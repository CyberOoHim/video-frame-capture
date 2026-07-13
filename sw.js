const CACHE = 'framecap-v3-fix-blob';
const ASSETS = [
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
  // IMPORTANT: Never intercept blob: or data: URLs - those are capture thumbnails
  // This was the bug causing black thumbnails after SW activation
  if (e.request.method !== 'GET') return;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('chrome-extension:') || url.startsWith('moz-extension:')) return;
  if (!url.startsWith(self.location.origin)) return; // only same-origin
  // Only cache GET for app shell, not video blobs or captures
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if (cached) return cached;
      return fetch(e.request).then(resp=>{
        if(resp && resp.status===200 && resp.type==='basic'){
          const clone = resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
