const CACHE_NAME = 'game-cache-v1';

// Hapus 'index.html' dari daftar cache
const ASSETS_TO_CACHE = [
  '/',
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
  // Aset lainnya yang jarang berubah
];

// Caching aset saat Service Worker pertama kali diinstal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);  // Menambahkan aset ke cache
    })
  );
});

// Menghapus cache lama saat Service Worker diaktifkan
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];  // Cache yang ingin dipertahankan
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);  // Menghapus cache yang tidak terpakai
          }
        })
      );
    })
  );
});

// Menangani permintaan (fetch) dan mengembalikan data dari cache atau jaringan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada cache yang cocok, kembalikan dari cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada, ambil dari jaringan dan cache hasilnya
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            // Menambahkan response ke cache untuk penggunaan di masa depan
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;  // Mengembalikan response dari jaringan
      });
    })
  );
});
