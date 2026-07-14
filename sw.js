// sw.js — shared service worker for the student app and teacher dashboard
// (2026-07-05, backlog #24). Strategy: NETWORK FIRST for everything, falling
// back to the last cached copy when offline. Never caches /api/* responses —
// live data must stay live; offline API calls just fail and the apps already
// handle that gracefully (static fallbacks, cached rosters, etc.).
const CACHE = 'spanish-lab-v1';
const SHELL = ['/', '/index.html', '/spanish-teacher-dashboard.html', '/exercises.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // live data only, never cached
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('/')))
  );
});
