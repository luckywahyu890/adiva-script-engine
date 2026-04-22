const CACHE_NAME = 'game-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/canvas',
  './Lib/AdivaClient.js',
  './Lib/AdivaServer.js',
  './data.js',
  './item.js',
  './semut.js',
  './kura.js',
  './laba.js',
  './Art/Diam*1.png',
  './Art/Lari*3.png',
  './Art/Lompat*1.png',
  './Art/Turun*1.png',
  './Art/Walll*1.png',
  './Art/WallRentak*1.png',
  './Art/Pnh*2.png',
  './Art/Misil*1.png',
  './Art/Semut*2.png',
  './Art/Kura*3.png',
  './Art/LabaLari*2.png',
  './Art/LabaLari*1.png',
  './Art/LabaNembak*1.png',
  './Art/LabaMakan*2.png',
  './Art/LabaNembak*2.png',
  './Art/BolaUlti*2.png',
  './Art/Heal*1.png',
  './Art/Energi*1.png',
  './Art/PeluruGanda*1.png',
  // Daftar semua aset yang ingin kamu cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Kembalikan dari cache
      }
      return fetch(event.request); // Ambil dari jaringan jika tidak ada di cache
    })
  );
});
