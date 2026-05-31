const CACHE_NAME = "liga-efootball-v62";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json"
];

// Instalación y almacenamiento inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Fuerza a activar el service worker nuevo de inmediato
});

// Limpieza automática de cachés viejas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Eliminando caché vieja:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Toma el control de las pestañas activas inmediatamente
});

// Estrategia Network-First: Prioriza buscar en internet para ver los cambios en vivo
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardamos una copia fresca en caché
        if (response && response.status === 200 && event.request.method === "GET") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay internet, recurre a lo guardado
        return caches.match(event.request);
      })
  );
});
