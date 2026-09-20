/* ============================================================
   PLANO ALIMENTAR — PERFIL E METAS
   Versão: v1
   ============================================================ */
(() => {
  "use strict";
  const KEY = "planoAlimentar_perfil_v1";
  const ID = "perfilMetasApp";
  const DEFAULT = { nome:"", pesoAtual:null, pesoMeta:null, pesoInicial:null, altura:null, atualizadoEm:null };

  function load(){ try { const raw=localStorage.getItem(KEY); return raw ? {...DEFAULT,...JSON.parse(raw)} : {...DEFAULT}; } catch { return {...DEFAULT}; } }
  let state=load();
  function save(){ localStorage.setItem(KEY,JSON.stringify(state)); }
  function num(v){ const n=Number(String(v).replace(",",".")); return Number.isFinite(n)&&n>0?n:null; }
  function fmt(v){ return Number(v).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}); }
  function esc(v){ return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

  function calc(){
    const atual=num(state.pesoAtual), meta=num(state.pesoMeta), inicial=num(state.pesoInicial)||atual;
    if(!atual||!meta) return {ready:false,atual,meta,inicial,distancia:null,pct:0,texto:"Defina seu peso atual e sua meta."};
    const distancia=Math.abs(atual-meta);
    if(atual===meta) return {ready:true,atual,meta,inicial,distancia:0,pct:100,texto:"Meta de peso alcançada."};
    if(!inicial||inicial===meta) return {ready:true,atual,meta,inicial,distancia,pct:0,texto:`Faltam ${fmt(distancia)} kg para a meta.`};
    const total=Math.abs(inicial-meta), percorrido=Math.abs(inicial-atual);
    const pct=Math.max(0,Math.min(100,Math.round(percorrido/total*100)));
    const concluido=meta<inicial?atual<=meta:atual>=meta;
    return {ready:true,atual,meta,inicial,distancia,pct:concluido?100:pct,texto:concluido?"Meta de peso alcançada.":`${fmt(distancia)} kg restantes para a meta.`};
  }

  function styles(){
    if(document.getElementById("perfil-metas-styles"))return;
    const s=document.createElement("style");s.id="perfil-metas-styles";s.textContent=`
      #${ID}{max-width:1200px;margin:18px auto;padding:0 20px;color:#17352d;font-family:Arial,Helvetica,sans-serif}
      #${ID} *{box-sizing:border-box}.pm-card{background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(23,53,45,.08)}
      .pm-head{padding:18px 20px;background:#f1f0e7}.pm-head h2{margin:0;font-size:22px}.pm-head p{margin:5px 0 0;color:#60746c;font-size:13px}.pm-body{padding:18px 20px}
      .pm-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}.pm-panel{border:1px solid #dedacf;border-radius:15px;background:#fff;padding:16px}.pm-panel h3{margin:0 0 13px;font-size:17px}
      .pm-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pm-field{display:grid;gap:6px}.pm-field label{font-size:13px;font-weight:800}.pm-field input{width:100%;padding:11px;border:1px solid #d8d5c7;border-radius:10px;font-size:14px;background:#fff}
      .pm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pm-btn{border:0;border-radius:11px;padding:10px 14px;font-weight:800;cursor:pointer}.pm-save{background:#176b52;color:#fff}.pm-clear{background:#f5e5e1;color:#8b3e31}
      .pm-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.pm-stat{padding:12px;border-radius:12px;background:#f3f1e8}.pm-stat small{display:block;color:#657770;font-size:12px}.pm-stat strong{display:block;margin-top:4px;font-size:19px;color:#176b52}
      .pm-progress{height:12px;background:#e8e5dc;border-radius:99px;overflow:hidden;margin-top:12px}.pm-progress span{display:block;height:100%;background:#176b52;border-radius:inherit;transition:width .25s ease}.pm-message{margin-top:10px;color:#53675f;font-size:13px}.pm-note{margin-top:10px;color:#71827b;font-size:11px}
      @media(max-width:760px){#${ID}{padding:0 10px}.pm-grid{grid-template-columns:1fr}.pm-fields{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function render(){
    let app=document.getElementById(ID);if(!app){app=document.createElement("section");app.id=ID;(document.querySelector(".wrap")||document.body).prepend(app);}
    const c=calc();
    app.innerHTML=`<div class="pm-card"><div class="pm-head"><h2>👤 Perfil e metas</h2><p>Configure seus dados básicos e acompanhe sua meta de peso.</p></div><div class="pm-body"><div class="pm-grid">
      <div class="pm-panel"><h3>⚙️ Configuração</h3><div class="pm-fields">
        <div class="pm-field"><label for="pm-nome">Nome</label><input id="pm-nome" maxlength="80" value="${esc(state.nome)}" placeholder="Seu nome"></div>
        <div class="pm-field"><label for="pm-altura">Altura (cm)</label><input id="pm-altura" type="number" min="100" max="250" step="0.1" value="${esc(state.altura??"")}" placeholder="Ex.: 175"></div>
        <div class="pm-field"><label for="pm-atual">Peso atual (kg)</label><input id="pm-atual" type="number" min="20" max="400" step="0.1" value="${esc(state.pesoAtual??"")}" placeholder="Ex.: 90"></div>
        <div class="pm-field"><label for="pm-meta">Peso-meta (kg)</label><input id="pm-meta" type="number" min="20" max="400" step="0.1" value="${esc(state.pesoMeta??"")}" placeholder="Ex.: 80"></div>
      </div><div class="pm-actions"><button class="pm-btn pm-save" id="pm-save">Salvar perfil e metas</button><button class="pm-btn pm-clear" id="pm-clear">Limpar dados</button></div><div class="pm-note">Os dados ficam somente neste navegador.</div></div>
      <div class="pm-panel"><h3>🎯 Progresso da meta</h3><div class="pm-stats"><div class="pm-stat"><small>Peso atual</small><strong>${c.atual?fmt(c.atual)+" kg":"—"}</strong></div><div class="pm-stat"><small>Peso-meta</small><strong>${c.meta?fmt(c.meta)+" kg":"—"}</strong></div><div class="pm-stat"><small>Distância</small><strong>${c.distancia!==null?fmt(c.distancia)+" kg":"—"}</strong></div><div class="pm-stat"><small>Progresso</small><strong>${c.ready?c.pct+"%":"—"}</strong></div></div><div class="pm-progress"><span style="width:${c.pct}%"></span></div><div class="pm-message">${esc(c.texto)}</div></div>
    </div></div></div>`;
    app.querySelector("#pm-save").onclick=()=>{const atual=num(app.querySelector("#pm-atual").value),meta=num(app.querySelector("#pm-meta").value);if(!atual||!meta){alert("Informe o peso atual e o peso-meta para salvar.");return;}state.nome=app.querySelector("#pm-nome").value.trim();state.altura=num(app.querySelector("#pm-altura").value);if(!num(state.pesoInicial))state.pesoInicial=atual;state.pesoAtual=atual;state.pesoMeta=meta;state.atualizadoEm=new Date().toISOString();save();render();};
    app.querySelector("#pm-clear").onclick=()=>{if(!confirm("Limpar os dados de perfil e metas deste navegador?"))return;state={...DEFAULT};save();render();};
  }
  function start(){styles();render();window.addEventListener("storage",render);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
