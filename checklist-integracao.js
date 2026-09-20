(() => {
  "use strict";

  const STORAGE_KEY = "planoAlimentar_checklist_v2";

  const itens = [
    { id: "cafe", emoji: "🌅", titulo: "Café da manhã", detalhe: "07:30" },
    { id: "almoco", emoji: "🍽️", titulo: "Almoço", detalhe: "12:00" },
    { id: "lanche", emoji: "🍎", titulo: "Lanche da tarde", detalhe: "15:00" },
    { id: "jantar", emoji: "🌙", titulo: "Jantar", detalhe: "20:00" },
    { id: "plano", emoji: "📋", titulo: "Seguir o plano alimentar", detalhe: "Hoje" },
    { id: "atividade", emoji: "🏃", titulo: "Atividade física", detalhe: "Hoje" }
  ];

  function hoje() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (salvo.data !== hoje()) return { data: hoje(), itens: {} };
      return salvo;
    } catch {
      return { data: hoje(), itens: {} };
    }
  }

  let estado = carregar();

  function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  function percentual() {
    const feitos = itens.filter(i => estado.itens[i.id]).length;
    return Math.round((feitos / itens.length) * 100);
  }

  function render() {
    const antigo = document.getElementById("checklistDiarioV2");
    if (antigo) antigo.remove();

    const card = document.createElement("section");
    card.id = "checklistDiarioV2";
    card.innerHTML = `
      <style>
        #checklistDiarioV2{margin:18px 0;background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;overflow:hidden;box-shadow:0 5px 18px rgba(23,53,45,.08)}
        #checklistDiarioV2 .cd-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:18px 20px;background:#f1f0e7}
        #checklistDiarioV2 .cd-title{margin:0;color:#17352d;font-size:22px;font-weight:800}
        #checklistDiarioV2 .cd-sub{margin:5px 0 0;color:#507368;font-size:14px}
        #checklistDiarioV2 .cd-score{min-width:78px;text-align:center;padding:10px 12px;border-radius:14px;background:#176b52;color:#fff;font-weight:800}
        #checklistDiarioV2 .cd-progress{height:8px;background:#e7e4d8}
        #checklistDiarioV2 .cd-progress span{display:block;height:100%;width:0;background:#176b52;transition:width .25s ease}
        #checklistDiarioV2 .cd-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px}
        #checklistDiarioV2 .cd-item{border:1px solid #d8d5c7;background:#fff;border-radius:15px;padding:13px;cursor:pointer;display:flex;align-items:center;gap:11px;transition:.2s;user-select:none}
        #checklistDiarioV2 .cd-item:hover{transform:translateY(-1px);border-color:#176b52}
        #checklistDiarioV2 .cd-item.done{background:#e8f4ed;border-color:#176b52}
        #checklistDiarioV2 .cd-check{width:24px;height:24px;flex:0 0 24px;border:2px solid #176b52;border-radius:7px;display:grid;place-items:center;color:#fff;font-weight:900}
        #checklistDiarioV2 .done .cd-check{background:#176b52}
        #checklistDiarioV2 .cd-emoji{font-size:25px}.cd-name{display:block;color:#17352d;font-weight:800;font-size:14px}.cd-time{display:block;margin-top:2px;color:#71857e;font-size:12px}
        #checklistDiarioV2 .cd-footer{padding:0 16px 17px;display:flex;justify-content:flex-end}
        #checklistDiarioV2 .cd-reset{border:0;border-radius:10px;padding:9px 13px;background:#e7eadf;color:#176b52;font-weight:700;cursor:pointer}
        @media(max-width:760px){#checklistDiarioV2 .cd-head{align-items:flex-start}#checklistDiarioV2 .cd-list{grid-template-columns:1fr}#checklistDiarioV2 .cd-score{min-width:68px}}
      </style>
      <div class="cd-head"><div><h2 class="cd-title">☑️ Checklist Diário</h2><p class="cd-sub">Acompanhe sua rotina de hoje e mantenha a constância.</p></div><div class="cd-score"><span id="cdPercent">0%</span><br><small id="cdCount">0/6</small></div></div>
      <div class="cd-progress"><span id="cdBar"></span></div>
      <div class="cd-list">${itens.map(item=>`<div class="cd-item" data-check="${item.id}" role="button" tabindex="0"><span class="cd-check">✓</span><span class="cd-emoji">${item.emoji}</span><span><span class="cd-name">${item.titulo}</span><span class="cd-time">${item.detalhe}</span></span></div>`).join("")}</div>
      <div class="cd-footer"><button class="cd-reset" type="button" id="cdReset">↺ Reiniciar o dia</button></div>
    `;

    const alvo = document.querySelector(".wrap") || document.body;
    const primeiroMeal = alvo.querySelector(".meal") || alvo.querySelector("nav");
    if (primeiroMeal && primeiroMeal.parentNode === alvo) primeiroMeal.before(card); else alvo.prepend(card);

    atualizar();
    card.querySelectorAll("[data-check]").forEach(el=>{
      const alternar=()=>{const id=el.dataset.check;estado.itens[id]=!estado.itens[id];salvar();atualizar();};
      el.addEventListener("click",alternar);
      el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();alternar();}});
    });
    document.getElementById("cdReset").addEventListener("click",()=>{if(!confirm("Reiniciar o checklist de hoje?"))return;estado={data:hoje(),itens:{}};salvar();atualizar();});
  }

  function atualizar(){
    const p=percentual(),feitos=itens.filter(i=>estado.itens[i.id]).length;
    const percent=document.getElementById("cdPercent"),count=document.getElementById("cdCount"),bar=document.getElementById("cdBar");
    if(percent)percent.textContent=`${p}%`;if(count)count.textContent=`${feitos}/${itens.length}`;if(bar)bar.style.width=`${p}%`;
    itens.forEach(item=>{const el=document.querySelector(`[data-check="${item.id}"]`);if(el){el.classList.toggle("done",!!estado.itens[item.id]);el.setAttribute("aria-pressed",estado.itens[item.id]?"true":"false");}});
  }

  function iniciar(){if(document.body)render();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar,{once:true});else iniciar();
})();

// Carrega o módulo de perfil sem alterar o HTML principal.
(() => { const s=document.createElement("script"); s.src="./perfil-metas.js"; s.defer=true; document.head.appendChild(s); })();
