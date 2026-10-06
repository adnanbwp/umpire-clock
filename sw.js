const VERSION = 'umpire-clock-v12';
const FILES = ['./', './index.html', './app.js', './rules.js', './seasons.js', './cards.js', './games.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
// cache: 'reload' skips the HTTP cache (Pages max-age=600): without it a fresh VERSION can
// install the stale files it was meant to replace, and serve them cache-first for good.
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))));
