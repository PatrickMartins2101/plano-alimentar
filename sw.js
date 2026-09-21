/* PLANO ALIMENTAR — SERVICE WORKER V24 */
const CACHE_NAME = "plano-alimentar-pwa-v24";
const BASE = "/plano-alimentar/";
const CORE_ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.webmanifest",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
  BASE + "icons/icon-maskable-192.png",
  BASE + "icons/icon-maskable-512.png",
  BASE + "painel-geral.js",
  BASE + "editor-plano.js",
  BASE + "meta-atividade.js",
  BASE + "atividade.js",
  BASE + "agua.js",
  BASE + "calendario.js",
  BASE + "fotos-evolucao.js",
  BASE + "backup-restauracao.js",
  BASE + "notificacoes.js",
  BASE + "receita-foto-ocr.js",
  BASE + "dashboard-progresso.js",
  BASE + "integracao-final-v7.js"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of CORE_ASSETS) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) await cache.put(url, response.clone());
      } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function getAppPage(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) return response;
  } catch (_) {}
  return caches.match(BASE + "index.html");
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(getAppPage(event.request));
    return;
  }

  // Recursos JavaScript do aplicativo devem buscar a versão publicada quando
  // houver rede. Isso evita que uma versão antiga do PWA mantenha correções
  // recentes presas no cache. Em caso de falha, ainda usamos o cache local.
  if (url.pathname.endsWith(".js")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(BASE + "index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(BASE + "index.html"));
    })
  );
});
