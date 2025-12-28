// Service Worker for PWA
const CACHE_NAME = 'reybex-mobile-v1';

// Get base path for GitHub Pages compatibility
const getBasePath = () => {
    return self.location.pathname.split('/').slice(0, -1).join('/') || '';
};

const basePath = getBasePath();
const urlsToCache = [
    basePath + '/',
    basePath + '/index.html',
    basePath + '/manifest.json',
    basePath + '/assets/css/style.css',
    basePath + '/assets/js/app.js',
    basePath + '/assets/js/auth.js',
    basePath + '/assets/js/api.js',
];

// Install event - Cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

