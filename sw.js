const CACHE_NAME="plano-alimentar-pwa-v6";
const BASE="/plano-alimentar/";
const CORE_ASSETS=[BASE,BASE+"index.html",BASE+"manifest.webmanifest",BASE+"icons/icon-192.png",BASE+"icons/icon-512.png",BASE+"icons/icon-maskable-192.png",BASE+"icons/icon-maskable-512.png",BASE+"editor-plano.js"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function respostaPagina(request){
  const cached=await caches.match(request);
  const response=cached||await fetch(request);
  if(!response||!response.ok)return response;
  try{
    const type=response.headers.get("content-type")||"";
    if(!type.includes("text/html"))return response;
    const html=await response.text();
    if(html.includes('src="./editor-plano.js"')||html.includes("src='./editor-plano.js'"))return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
    const injected=html.replace(/<\/body>/i,'<script src="./editor-plano.js" defer></script></body>');
    const headers=new Headers(response.headers);
    headers.set("content-type","text/html; charset=utf-8");
    return new Response(injected,{status:response.status,statusText:response.statusText,headers});
  }catch{return response;}
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==="navigate"){
    event.respondWith(respostaPagina(event.request).catch(()=>caches.match(BASE+"index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(response=>{
      if(response&&response.status===200){
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(()=>caches.match(BASE+"index.html"));
  }));
});
