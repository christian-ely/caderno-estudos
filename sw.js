/* Caderno Estudos TOTAL — SW offline-first (arquivo único + vendor local).
   GitHub Gist API: NetworkOnly (nuvem vai pela fila local, nunca cacheada). */
const VERSION = "caderno-v1";
const CACHE = `${VERSION}-assets`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/tailwind-cdn.js",
  "./vendor/chart.umd.min.js",
  "./vendor/satoshi-local.css",
  "./vendor/phosphor/regular.css",
  "./vendor/phosphor/bold.css",
  "./vendor/phosphor/fill.css",
  "./vendor/phosphor/Phosphor.woff2",
  "./vendor/phosphor/Phosphor-Bold.woff2",
  "./vendor/phosphor/Phosphor-Fill.woff2",
  "./vendor/fonts/satoshi-0.woff2",
  "./vendor/fonts/satoshi-1.woff2",
  "./vendor/fonts/satoshi-2.woff2",
  "./vendor/fonts/satoshi-3.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./edital_fepese_sc.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url, self.location.href);

  // Nuvem (Gist): nunca interceptar — a fila local cuida do offline
  if (url.hostname === "api.github.com") return;

  // Navegação: NetworkFirst com fallback p/ index.html cacheado
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", clone));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Mesmo origem: CacheFirst com atualização em segundo plano
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((hit) => {
        const net = fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});
