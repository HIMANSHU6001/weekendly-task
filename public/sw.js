const CACHE_NAME = 'weekendly-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/web-app-manifest-192x192.png',
    '/web-app-manifest-512x512.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ])
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    let notificationData = {};

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (error) {
            console.error('Error parsing push data:', error);
            notificationData = {
                title: 'SoundPark',
                body: 'You have a new notification',
                icon: '/web-app-manifest-192x192.png',
                badge: '/web-app-manifest-192x192.png'
            };
        }
    }

    const options = {
        body: notificationData.body || 'You have a new notification',
        icon: notificationData.icon || '/web-app-manifest-192x192.png',
        badge: notificationData.badge || '/web-app-manifest-192x192.png',
        data: notificationData.data || {},
        tag: notificationData.tag || 'default',
        renotify: true,
        actions: notificationData.actions || [],
        vibrate: [200, 100, 200],
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(
            notificationData.title || 'SoundPark',
            options
        )
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    // Handle notification actions
    if (event.action) {
        // Handle specific action clicks
        console.log('Action clicked:', event.action);
    }

    // Open the app or focus existing window
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Otherwise, open a new window
                if (self.clients.openWindow) {
                    const targetUrl = event.notification.data?.url || '/';
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
    // Track notification dismissal if needed
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});
