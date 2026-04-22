const CACHE_NAME = 'game-cache-v2';

// 🔥 Helper biar gak nulis satu-satu
function generateAssets(prefix, count) {
  const arr = [];
  for (let i = 1; i <= count; i++) {
    arr.push(`${prefix}${i}.png`);
  }
  return arr;
}

const ASSETS_TO_CACHE = [
  '/',

  // Player
  ...generateAssets('./Art/Diam', 1),
  ...generateAssets('./Art/Lari', 3),
  ...generateAssets('./Art/Lompat', 1),
  ...generateAssets('./Art/Turun', 1),
  ...generateAssets('./Art/Walll', 1),
  ...generateAssets('./Art/WallRentak', 1),

  // Senjata
  ...generateAssets('./Art/Pnh', 2),
  ...generateAssets('./Art/Misil', 1),

  // Musuh
  ...generateAssets('./Art/Semut', 2),
  ...generateAssets('./Art/Kura', 3),
  ...generateAssets('./Art/LabaLari', 2),
  ...generateAssets('./Art/LabaNembak', 2),
  ...generateAssets('./Art/LabaMakan', 2),

  // Skill & item
  ...generateAssets('./Art/BolaUlti', 2),
  ...generateAssets('./Art/Heal', 1),
  ...generateAssets('./Art/Energi', 1),
  ...generateAssets('./Art/PeluruGanda', 1),
];

// 🧠 INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting(); // langsung aktif

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 🧹 ACTIVATE
self.addEventListener('activate', (event) => {
  self.clients.claim(); // ambil kontrol langsung

  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('SW: delete old cache', name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// 🌐 FETCH (Cache First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      // ✅ kalau ada di cache → pakai
      if (cacheRes) return cacheRes;

      // ❌ kalau tidak → ambil dari network
      return fetch(event.request)
        .then((netRes) => {
          // simpan ke cache
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return netRes;
        })
        .catch(() => {
          // fallback kalau offline total
          return caches.match('/');
        });
    })
  );
});
