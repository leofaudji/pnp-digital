const CACHE_NAME = 'rt-app-v5';
const urlsToCache = [
    './',
    './assets/css/style.css',
    './assets/js/app.js',
    './assets/js/api.js',
    './assets/js/sidebar.js',
    './assets/js/modules/auth.js',
    './assets/js/modules/dashboard.js',
    './assets/js/modules/attendance.js',
    './assets/js/modules/scan.js',
    './assets/js/modules/checkpoint-admin.js',
    './assets/js/modules/finance.js',
    './assets/js/modules/users.js',
    './assets/js/modules/roles.js',
    './assets/js/modules/warga.js',
    './assets/js/modules/settings.js',
    './assets/js/modules/sop.js',
    './assets/json/menu.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/lucide@0.294.0/dist/lucide.min.js',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://unpkg.com/html5-qrcode/html5-qrcode.min.js'
];

self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installing v5...', urlsToCache);
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('[ServiceWorker] Cache failed:', err);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activating v5...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // CRITICAL: Don't cache API requests to avoid user state persistence issues
    if (url.pathname.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone response to cache
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
