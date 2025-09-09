const CACHE_NAME = 'weekendly-v2';
const STATIC_CACHE = 'weekendly-static-v2';
const DYNAMIC_CACHE = 'weekendly-dynamic-v2';
const API_CACHE = 'weekendly-api-v2';
const OFFLINE_DB_NAME = 'weekendly-offline';
const OFFLINE_DB_VERSION = 1;
const SYNC_QUEUE_NAME = 'weekendly-sync-queue';

// Static resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/web-app-manifest-192x192.png',
    '/web-app-manifest-512x512.png',
    '/favicon.ico',
    '/offline.html' // We'll create this fallback page
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/plans',
    '/api/auth'
];

// Initialize IndexedDB for offline data storage
let offlineDB;

function initOfflineDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            offlineDB = request.result;
            resolve(offlineDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Plans store
            if (!db.objectStoreNames.contains('plans')) {
                const plansStore = db.createObjectStore('plans', { keyPath: 'id' });
                plansStore.createIndex('userId', 'userId', { unique: false });
                plansStore.createIndex('lastModified', 'lastModified', { unique: false });
            }

            // Sync queue store
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
            }

            // User preferences store
            if (!db.objectStoreNames.contains('userPrefs')) {
                db.createObjectStore('userPrefs', { keyPath: 'key' });
            }
        };
    });
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v2');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            initOfflineDB()
        ]).then(() => {
            console.log('[SW] Skip waiting');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean old caches and claim clients
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v2');
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== API_CACHE &&
                            cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Initialize offline DB if not already done
            initOfflineDB(),
            // Claim all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
        return;
    }

    // Handle different types of requests with appropriate strategies
    if (url.pathname.startsWith('/api/')) {
        // API requests - Network First with cache fallback
        event.respondWith(handleApiRequest(request));
    } else if (isStaticAsset(url.pathname)) {
        // Static assets - Cache First
        event.respondWith(handleStaticAsset(request));
    } else {
        // Navigation requests - Network First with offline fallback
        event.respondWith(handleNavigationRequest(request));
    }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE);

    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());

            // If it's a plans API, also store in IndexedDB
            if (request.url.includes('/api/plans')) {
                await handlePlansData(request, networkResponse.clone());
            }
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);

        // Network failed, try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If it's a plans request and we have offline data, return that
        if (request.url.includes('/api/plans')) {
            return await getOfflinePlansData(request);
        }

        // Return offline response for other API calls
        return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch static asset:', request.url);
        throw error;
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);

    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Navigation network failed, trying cache for:', request.url);

        // Try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for document requests
        if (request.destination === 'document') {
            const offlinePage = await cache.match('/offline.html') ||
                               await caches.match('/');
            return offlinePage;
        }

        throw error;
    }
}

// Handle plans data storage in IndexedDB
async function handlePlansData(request, response) {
    if (!offlineDB) {
        await initOfflineDB();
    }

    try {
        const data = await response.json();
        const transaction = offlineDB.transaction(['plans'], 'readwrite');
        const store = transaction.objectStore('plans');

        if (Array.isArray(data)) {
            // Multiple plans
            data.forEach(plan => {
                plan.lastModified = Date.now();
                plan.synced = true;
                store.put(plan);
            });
        } else if (data.id) {
            // Single plan
            data.lastModified = Date.now();
            data.synced = true;
            store.put(data);
        }
    } catch (error) {
        console.log('[SW] Error storing plans data:', error);
    }
}

// Get offline plans data from IndexedDB
async function getOfflinePlansData(request) {
    if (!offlineDB) {
        await initOfflineDB();
    }

    try {
        const transaction = offlineDB.transaction(['plans'], 'readonly');
        const store = transaction.objectStore('plans');
        const plans = [];

        return new Promise((resolve) => {
            const cursor = store.openCursor();
            cursor.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    plans.push(result.value);
                    result.continue();
                } else {
                    resolve(new Response(
                        JSON.stringify(plans),
                        {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Offline': 'true'
                            }
                        }
                    ));
                }
            };

            cursor.onerror = () => {
                resolve(new Response(
                    JSON.stringify({ error: 'Offline storage error', offline: true }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                ));
            };
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Offline storage error', offline: true }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Helper function to check if a path is a static asset
function isStaticAsset(pathname) {
    return pathname.startsWith('/_next/') ||
           pathname.startsWith('/static/') ||
           pathname.includes('.') ||
           pathname === '/manifest.json' ||
           pathname === '/favicon.ico';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-plans') {
        event.waitUntil(syncOfflineChanges());
    }
});

// Sync offline changes when back online
async function syncOfflineChanges() {
    if (!offlineDB) {
        await initOfflineDB();
    }

    try {
        const transaction = offlineDB.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const syncItems = [];

        return new Promise((resolve) => {
            const cursor = store.openCursor();
            cursor.onsuccess = async (event) => {
                const result = event.target.result;
                if (result) {
                    syncItems.push(result.value);
                    result.continue();
                } else {
                    // Process sync items
                    for (const item of syncItems) {
                        await processSyncItem(item);
                    }
                    resolve();
                }
            };
        });
    } catch (error) {
        console.log('[SW] Sync error:', error);
    }
}

// Process individual sync items
async function processSyncItem(item) {
    try {
        const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
        });

        if (response.ok) {
            // Remove from sync queue on success
            const transaction = offlineDB.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            store.delete(item.id);

            console.log('[SW] Synced item:', item.id);
        }
    } catch (error) {
        console.log('[SW] Failed to sync item:', item.id, error);
    }
}

// Message handling for communication with the app
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'CACHE_PLAN':
            cachePlanOffline(data);
            break;
        case 'QUEUE_SYNC':
            queueSyncAction(data);
            break;
        case 'GET_OFFLINE_STATUS':
            event.ports[0].postMessage({
                type: 'OFFLINE_STATUS',
                isOffline: !navigator.onLine
            });
            break;
    }
});

// Cache plan data for offline use
async function cachePlanOffline(planData) {
    if (!offlineDB) {
        await initOfflineDB();
    }

    try {
        const transaction = offlineDB.transaction(['plans'], 'readwrite');
        const store = transaction.objectStore('plans');

        planData.lastModified = Date.now();
        planData.synced = false;

        store.put(planData);
        console.log('[SW] Cached plan offline:', planData.id);
    } catch (error) {
        console.log('[SW] Error caching plan:', error);
    }
}

// Queue sync action for when back online
async function queueSyncAction(actionData) {
    if (!offlineDB) {
        await initOfflineDB();
    }

    try {
        const transaction = offlineDB.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');

        const syncItem = {
            ...actionData,
            timestamp: Date.now()
        };

        store.add(syncItem);
        console.log('[SW] Queued sync action:', actionData.type);

        // Register for background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await self.registration;
            await registration.sync.register('sync-plans');
        }
    } catch (error) {
        console.log('[SW] Error queueing sync action:', error);
    }
}
