const CACHE = 'framecap-v5-ios-fix';
const ASSETS = [
  './',
  './index.html',
  './framecap_pwa.html',
  './manifest.webmanifest',
  './pwa/icon-192.png',
  './pwa/icon-512.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('chrome-extension:') || url.startsWith('moz-extension:')) return;
  if (!url.startsWith(self.location.origin)) return;
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(r=>{
        if (r && r.ok) {
          const clone=r.clone(); caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return r;
      }).catch(()=>caches.match('./index.html').then(m=>m||caches.match('./framecap_pwa.html').then(m2=>m2||caches.match('./'))))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if (cached) return cached;
      return fetch(e.request).then(resp=>{
        if (resp && resp.ok && resp.type==='basic') {
          const clone=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
