const CACHE_NAME = 'weekendly-v3';
const STATIC_CACHE = 'weekendly-static-v3';

// Only cache essential static assets that we know exist
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/offline.html'
];

// Assets to try caching but don't fail if they don't exist
const OPTIONAL_ASSETS = [
    '/web-app-manifest-192x192.png',
    '/web-app-manifest-512x512.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v3');
    event.waitUntil(
        Promise.all([
            // Cache essential assets
            caches.open(STATIC_CACHE).then(async (cache) => {
                console.log('[SW] Caching essential assets');
                try {
                    await cache.addAll(STATIC_ASSETS);
                } catch (error) {
                    console.warn('[SW] Failed to cache some essential assets:', error);
                }

                // Try to cache optional assets individually
                for (const asset of OPTIONAL_ASSETS) {
                    try {
                        await cache.add(asset);
                        console.log('[SW] Cached optional asset:', asset);
                    } catch (error) {
                        console.warn('[SW] Failed to cache optional asset:', asset, error);
                    }
                }
            })
        ]).then(() => {
            console.log('[SW] Skip waiting');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v3');
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const {request} = event;
    const url = new URL(request.url);

    // Skip non-GET requests and extension requests
    if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
        return;
    }

    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        // Let API requests go through normally - Zustand handles the data
        return;
    } else if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticAsset(request));
    } else {
        event.respondWith(handleNavigationRequest(request));
    }
});

async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);

    try {
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch static asset:', request.url);

        // Try to return cached version as fallback
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If it's a critical asset, return a minimal response
        if (request.url.includes('manifest.json')) {
            return new Response('{}', {
                headers: {'Content-Type': 'application/json'}
            });
        }

        throw error;
    }
}

async function handleNavigationRequest(request) {
    try {
        // Try network first for navigation requests
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful navigation responses
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Navigation network failed, trying cache for:', request.url);

        // Try cached version
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to offline page for document requests
        if (request.destination === 'document') {
            const offlinePage = await cache.match('/offline.html') ||
                await cache.match('/');
            if (offlinePage) {
                return offlinePage;
            }
        }

        throw error;
    }
}

function isStaticAsset(pathname) {
    return pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname.includes('.') ||
        pathname === '/manifest.json' ||
        pathname === '/favicon.ico' ||
        pathname.includes('.png') ||
        pathname.includes('.jpg') ||
        pathname.includes('.svg') ||
        pathname.includes('.css') ||
        pathname.includes('.js');
}

// Simple message handler for any communication needs
self.addEventListener('message', (event) => {
    const {type, data} = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_VERSION':
            event.ports[0]?.postMessage({version: 'v3', cacheNames: [STATIC_CACHE]});
            break;
        default:
            console.log('[SW] Unknown message type:', type);
    }
});