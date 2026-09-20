/* ============================================================
   PESO E EVOLUÇÃO — Plano Alimentar Interativo
   Histórico local de peso + gráfico simples + integração com perfil.
   ============================================================ */
(() => {
  "use strict";
  const KEY = "planoAlimentar_peso_v1";
  const ID = "pesoEvolucaoApp";

  function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:[]}catch{return []}}
  let registros=load();
  function save(){localStorage.setItem(KEY,JSON.stringify(registros));}
  function today(){const d=new Date();return d.toISOString().slice(0,10)}
  function fmt(n){return Number(n).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}
  function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function profile(){try{return JSON.parse(localStorage.getItem("planoAlimentar_perfil_v1"))||{}}catch{return {}}}

  function style(){
    if(document.getElementById("peso-evolucao-style"))return;
    const s=document.createElement("style");s.id="peso-evolucao-style";s.textContent=`
      #${ID}{max-width:1200px;margin:18px auto;padding:0 20px;font-family:Arial,Helvetica,sans-serif;color:#17352d}
      #${ID} *{box-sizing:border-box}.pe-card{background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(23,53,45,.08)}
      .pe-head{padding:18px 20px;background:#f1f0e7}.pe-head h2{margin:0;font-size:22px}.pe-head p{margin:5px 0 0;color:#60746c;font-size:13px}
      .pe-body{padding:18px 20px}.pe-grid{display:grid;grid-template-columns:.75fr 1.25fr;gap:16px}.pe-panel{border:1px solid #dedacf;border-radius:15px;background:#fff;padding:16px}.pe-panel h3{margin:0 0 12px;font-size:17px}
      .pe-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pe-field{display:grid;gap:5px}.pe-field label{font-size:12px;font-weight:800}.pe-field input{padding:10px;border:1px solid #d8d5c7;border-radius:10px}
      .pe-actions{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}.pe-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.pe-add{background:#176b52;color:white}.pe-clear{background:#f5e5e1;color:#8b3e31}
      .pe-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pe-stat{background:#f3f1e8;border-radius:11px;padding:10px}.pe-stat small{display:block;color:#657770;font-size:11px}.pe-stat strong{display:block;color:#176b52;margin-top:3px;font-size:17px}
      .pe-chart{margin-top:14px;height:170px;display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid #d8d5c7;padding:10px 4px 0;overflow-x:auto}.pe-bar{min-width:28px;background:#2d8a6a;border-radius:7px 7px 0 0;position:relative}.pe-bar span{position:absolute;bottom:-23px;left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap;color:#60746c}.pe-empty{color:#71817a;font-size:13px}.pe-history{margin-top:14px;max-height:190px;overflow:auto}.pe-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eeeade;font-size:13px}.pe-row button{border:0;background:transparent;color:#9a4b3c;font-weight:800;cursor:pointer}.pe-note{margin-top:10px;font-size:11px;color:#71817a}
      @media(max-width:760px){#${ID}{padding:0 10px}.pe-grid{grid-template-columns:1fr}.pe-fields{grid-template-columns:1fr}.pe-stats{grid-template-columns:1fr 1fr}.pe-chart{height:150px}}
    `;document.head.appendChild(s)
  }

  function render(){
    let app=document.getElementById(ID);if(!app){app=document.createElement("section");app.id=ID;(document.querySelector(".wrap")||document.body).appendChild(app)}
    registros.sort((a,b)=>a.data.localeCompare(b.data));
    const p=profile();const atual=registros.at(-1)?.peso??p.pesoAtual??null;const inicial=registros[0]?.peso??p.pesoInicial??null;const meta=p.pesoMeta??null;const variacao=atual!==null&&inicial!==null?atual-inicial:null;const falta=atual!==null&&meta!==null?Math.abs(atual-meta):null;
    const vals=registros.map(r=>r.peso);const max=Math.max(...vals,meta||0,atual||0,1);const min=Math.min(...vals,meta||Infinity,atual||Infinity);const span=Math.max(1,max-min);
    app.innerHTML=`<div class="pe-card"><div class="pe-head"><h2>⚖️ Peso e evolução</h2><p>Registre seu peso e acompanhe a evolução ao longo do tempo.</p></div><div class="pe-body"><div class="pe-grid"><div class="pe-panel"><h3>➕ Novo registro</h3><div class="pe-fields"><div class="pe-field"><label>Data</label><input id="pe-date" type="date" value="${today()}"></div><div class="pe-field"><label>Peso (kg)</label><input id="pe-weight" type="number" min="20" max="400" step="0.1" placeholder="Ex.: 82,4"></div></div><div class="pe-actions"><button class="pe-btn pe-add" id="pe-add">Registrar peso</button><button class="pe-btn pe-clear" id="pe-clear">Apagar histórico</button></div><div class="pe-note">O registro fica salvo apenas neste navegador.</div></div><div class="pe-panel"><h3>📊 Resumo</h3><div class="pe-stats"><div class="pe-stat"><small>Atual</small><strong>${atual!==null?fmt(atual)+" kg":"—"}</strong></div><div class="pe-stat"><small>Inicial</small><strong>${inicial!==null?fmt(inicial)+" kg":"—"}</strong></div><div class="pe-stat"><small>Meta</small><strong>${meta!==null?fmt(meta)+" kg":"—"}</strong></div><div class="pe-stat"><small>Variação</small><strong>${variacao!==null?(variacao>0?"+":"")+fmt(variacao)+" kg":"—"}</strong></div><div class="pe-stat"><small>Até a meta</small><strong>${falta!==null?fmt(falta)+" kg":"—"}</strong></div><div class="pe-stat"><small>Registros</small><strong>${registros.length}</strong></div></div>${registros.length?`<div class="pe-chart">${registros.slice(-14).map(r=>{const h=Math.max(12,((r.peso-min)/span)*125+20);return `<div class="pe-bar" style="height:${h}px" title="${esc(r.data)} — ${fmt(r.peso)} kg"><span>${fmt(r.peso)}</span></div>`}).join("")}</div>`:`<div class="pe-empty" style="margin-top:14px">Registre seu primeiro peso para visualizar a evolução.</div>`}</div></div><div class="pe-panel" style="margin-top:16px"><h3>📅 Histórico</h3><div class="pe-history">${registros.length?registros.slice().reverse().map((r,i)=>`<div class="pe-row"><span>${new Date(r.data+"T12:00:00").toLocaleDateString("pt-BR")} — <strong>${fmt(r.peso)} kg</strong></span><button data-del="${registros.length-1-i}">Remover</button></div>`).join(""):`<div class="pe-empty">Nenhum registro de peso.</div>`}</div></div></div></div>`;
    app.querySelector("#pe-add").onclick=()=>{const d=app.querySelector("#pe-date").value||today();const w=Number(String(app.querySelector("#pe-weight").value).replace(",","."));if(!w||w<20||w>400){alert("Informe um peso válido.");return}const idx=registros.findIndex(r=>r.data===d);if(idx>=0)registros[idx]={data:d,peso:w};else registros.push({data:d,peso:w});save();const prof=profile();if(!prof.pesoInicial){prof.pesoInicial=w;prof.pesoAtual=w;localStorage.setItem("planoAlimentar_perfil_v1",JSON.stringify(prof))}else{prof.pesoAtual=w;localStorage.setItem("planoAlimentar_perfil_v1",JSON.stringify(prof))}window.dispatchEvent(new CustomEvent("planoAlimentar:pesoAtualizado"));render()};
    app.querySelector("#pe-clear").onclick=()=>{if(!confirm("Apagar todo o histórico de peso deste navegador?"))return;registros=[];save();window.dispatchEvent(new CustomEvent("planoAlimentar:pesoAtualizado"));render()};
    app.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.del);registros.splice(i,1);save();window.dispatchEvent(new CustomEvent("planoAlimentar:pesoAtualizado"));render()});
  }
  function start(){style();render();window.addEventListener("storage",render);window.addEventListener("planoAlimentar:perfilAtualizado",render)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
