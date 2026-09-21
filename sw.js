const CACHE_NAME="plano-alimentar-pwa-v21";
const BASE="/plano-alimentar/";
const CORE_ASSETS=[
  BASE,BASE+"index.html",BASE+"manifest.webmanifest",
  BASE+"icons/icon-192.png",BASE+"icons/icon-512.png",BASE+"icons/icon-maskable-192.png",BASE+"icons/icon-maskable-512.png",
  BASE+"painel-geral.js",BASE+"editor-plano.js",BASE+"meta-atividade.js",BASE+"atividade.js",BASE+"agua.js",BASE+"calendario.js",
  BASE+"fotos-evolucao.js",BASE+"backup-restauracao.js",BASE+"notificacoes.js",BASE+"receita-foto-ocr.js",BASE+"dashboard-progresso.js",
  BASE+"melhorias-diarias-v4.js",BASE+"melhorias-diarias-v5.js",BASE+"melhorias-diarias-v6.js",BASE+"dashboard-sync-v5.js"
];

self.addEventListener("install",event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.all(CORE_ASSETS.map(async url=>{
    try{
      const r=await fetch(url,{cache:"no-store"});
      if(r.ok)await cache.put(url,r.clone());
    }catch{}
  }));
  await self.skipWaiting();
})()));

self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));

async function page(request){
  let r;
  try{r=await fetch(request,{cache:"no-store"})}catch{r=await caches.match(BASE+"index.html")}
  if(!r||!r.ok)return r;
  try{
    const type=r.headers.get("content-type")||"";
    if(!type.includes("text/html"))return r;
    const html=await r.text();
    let out=html;
    const add=src=>{
      const base=src.split("?")[0];
      if(!out.includes(base))out=out.replace(/<\/body>/i,`<script src="./${src}" defer></script></body>`);
    };
    // Um único ponto de entrada reduz duplicações e evita que módulos sejam carregados duas vezes.
    add("painel-geral.js?v=v2-final");
    add("melhorias-diarias-v6.js?v=20260921-v6");
    add("dashboard-sync-v5.js?v=20260921-v5");
    return new Response(out,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch{return r}
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const u=new URL(event.request.url);
  if(u.origin!==self.location.origin)return;
  if(event.request.mode==="navigate"){
    event.respondWith(page(event.request).catch(()=>caches.match(BASE+"index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{
    if(r&&r.status===200){const cp=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,cp)).catch(()=>{});}
    return r;
  }).catch(()=>caches.match(BASE+"index.html"))));
});
