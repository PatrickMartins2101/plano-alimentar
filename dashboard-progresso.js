/* ============================================================
   DASHBOARD DE PROGRESSÃO — Plano Alimentar Interativo
   Visão histórica do processo: hidratação, atividade, checklist e peso.
   Dados locais do navegador. Sem dependências externas.
   ============================================================ */
(() => {
  "use strict";

  const ID = "dashboardProgressao";
  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const ACTIVITY_KEY = "planoAlimentar_atividade_v1";
  const CHECKLIST_KEY = "planoAlimentar_checklist_v2";
  const WEIGHT_KEY = "planoAlimentar_peso_v1";
  const PROFILE_KEY = "planoAlimentar_perfil_v1";

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const clamp = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const parse = (key, fallback) => { try { const x = JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } };
  const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
  const daysBack = n => { const out=[]; for(let i=n-1;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);out.push({date:d,key:dayKey(d)});} return out; };
  const fmtDate = d => d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});

  function styles(){
    if(document.getElementById("dashboard-progressao-style")) return;
    const s=document.createElement("style"); s.id="dashboard-progressao-style";
    s.textContent=`
      #${ID}{max-width:1200px;margin:18px auto;padding:0 20px;font-family:Arial,Helvetica,sans-serif;color:#17352d}
      #${ID} *{box-sizing:border-box}.dp-card{background:#fffdf8;border:1px solid #d8d5c7;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(23,53,45,.08)}
      .dp-head{padding:22px 24px;background:linear-gradient(135deg,#176b52,#2d8a6a);color:#fff;display:flex;justify-content:space-between;gap:18px;align-items:center}
      .dp-head h2{margin:0;font-size:25px}.dp-head p{margin:5px 0 0;font-size:14px;opacity:.9}.dp-range{display:flex;gap:6px;flex-wrap:wrap}.dp-range button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}.dp-range button.active,.dp-range button:hover{background:#fff;color:#176b52}
      .dp-body{padding:20px 24px 24px}.dp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.dp-stat{border:1px solid #dedacf;border-radius:15px;padding:14px;background:#fff}.dp-stat small{display:block;color:#657770;font-size:12px}.dp-stat strong{display:block;color:#176b52;font-size:21px;margin-top:5px}.dp-stat span{display:block;color:#71827b;font-size:11px;margin-top:4px}
      .dp-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;margin-top:16px}.dp-panel{border:1px solid #dedacf;border-radius:16px;background:#fff;padding:16px}.dp-panel h3{margin:0 0 12px;font-size:18px}.dp-sub{font-size:12px;color:#71827b;margin:-6px 0 12px}
      .dp-chart{height:220px;display:flex;align-items:flex-end;gap:5px;padding:12px 4px 28px;border-bottom:1px solid #d8d5c7;overflow-x:auto}.dp-col{height:100%;min-width:14px;display:flex;align-items:flex-end;position:relative}.dp-col span{display:block;width:100%;min-height:2px;border-radius:6px 6px 0 0;background:#2d8a6a}.dp-col small{position:absolute;bottom:-23px;left:50%;transform:translateX(-50%);font-size:9px;color:#71827b;white-space:nowrap}.dp-col em{position:absolute;top:-2px;left:50%;transform:translate(-50%,-100%);font-size:9px;font-style:normal;color:#176b52;white-space:nowrap}
      .dp-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#60746c}.dp-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#2d8a6a;margin-right:4px}
      .dp-progress-list{display:grid;gap:13px}.dp-progress-row{display:grid;grid-template-columns:130px 1fr 48px;gap:9px;align-items:center}.dp-progress-row b{font-size:13px}.dp-progress-row .bar{height:10px;background:#e8e5dc;border-radius:99px;overflow:hidden}.dp-progress-row .bar i{display:block;height:100%;background:#176b52;border-radius:inherit}.dp-progress-row strong{text-align:right;color:#176b52;font-size:13px}
      .dp-insights{margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.dp-insight{background:#f3f1e8;border-radius:14px;padding:13px}.dp-insight b{display:block;font-size:13px}.dp-insight span{display:block;margin-top:5px;color:#60746c;font-size:12px;line-height:1.4}
      .dp-empty{padding:25px;text-align:center;color:#71827b;font-size:13px}.dp-foot{margin-top:14px;font-size:11px;color:#71827b;line-height:1.5}
      @media(max-width:850px){.dp-head{align-items:flex-start;flex-direction:column}.dp-stats{grid-template-columns:repeat(2,1fr)}.dp-grid{grid-template-columns:1fr}.dp-insights{grid-template-columns:1fr}}
      @media(max-width:520px){#${ID}{padding:0 10px}.dp-body{padding:16px}.dp-stats{grid-template-columns:1fr 1fr}.dp-progress-row{grid-template-columns:105px 1fr 40px}.dp-chart{height:190px}.dp-head h2{font-size:21px}}
    `; document.head.appendChild(s);
  }

  function data(n){
    const dates=daysBack(n);
    const water=parse(WATER_KEY,{goal:2500,days:{}});
    const activity=parse(ACTIVITY_KEY,{goal:30,records:[]});
    const checklist=parse(CHECKLIST_KEY,{data:"",itens:{}});
    const weights=parse(WEIGHT_KEY,[]);
    const profile=parse(PROFILE_KEY,{});
    const waterGoal=Number(water.goal)||2500;
    const activityGoal=Number(activity.goal)||30;
    const waterDays=dates.map(x=>({key:x.key,total:Number(water.days?.[x.key]?.total||0),pct:clamp(Number(water.days?.[x.key]?.total||0)/waterGoal*100)}));
    const activityDays=dates.map(x=>{const total=(Array.isArray(activity.records)?activity.records:[]).filter(r=>r.date===x.key).reduce((s,r)=>s+Number(r.minutes||0),0);return{key:x.key,total,pct:clamp(total/activityGoal*100)}});
    const checklistDays=dates.map(x=>{let pct=0;let total=0;let done=0;if(checklist.data===x.key){const it=checklist.itens&&typeof checklist.itens==="object"?checklist.itens:{};total=Object.keys(it).length;done=Object.values(it).filter(Boolean).length;pct=total?done/total*100:0;}return{key:x.key,total,done,pct:clamp(pct)}});
    const sorted=[...(Array.isArray(weights)?weights:[])].sort((a,b)=>String(a.data).localeCompare(String(b.data)));
    const inRange=sorted.filter(r=>dates.some(d=>d.key===r.data));
    const atual=sorted.at(-1)?.peso ?? profile.pesoAtual ?? null;
    const inicial=sorted[0]?.peso ?? profile.pesoInicial ?? null;
    const meta=profile.pesoMeta ?? null;
    const waterMet=waterDays.filter(x=>x.total>=waterGoal).length;
    const activityMet=activityDays.filter(x=>x.total>=activityGoal).length;
    const checklistWithData=checklistDays.filter(x=>x.total>0);
    const checklistAvg=checklistWithData.length?checklistWithData.reduce((s,x)=>s+x.pct,0)/checklistWithData.length:0;
    const adherence=Math.round((waterDays.reduce((s,x)=>s+x.pct,0)+activityDays.reduce((s,x)=>s+x.pct,0)+(checklistAvg||0))/(checklistWithData.length?3:2));
    return {dates,waterDays,activityDays,checklistDays,waterGoal,activityGoal,weights:inRange,sortedWeights:sorted,atual,inicial,meta,waterMet,activityMet,checklistAvg,adherence};
  }

  function render(){
    let root=document.getElementById(ID); if(!root){root=document.createElement("section");root.id=ID;const panel=document.getElementById("painelGeralFinal");if(panel?.parentNode)panel.parentNode.insertBefore(root,panel.nextSibling);else document.body.prepend(root);}
    const n=Number(root.dataset.range||30); const d=data(n); const vals=d.waterDays.map(x=>x.pct); const max=Math.max(100,...vals); const weightChange=d.atual!==null&&d.inicial!==null?d.atual-d.inicial:null;
    const titleRange=n===7?"Últimos 7 dias":n===30?"Últimos 30 dias":"Últimos 90 dias";
    const chart=d.waterDays.map((x,i)=>{const h=Math.max(2,Math.round(x.pct/max*160));return `<div class="dp-col"><em>${x.pct}%</em><span style="height:${h}px" title="${x.key}: ${x.total} ml"></span><small>${fmtDate(d.dates[i].date)}</small></div>`}).join("");
    const avgWater=Math.round(d.waterDays.reduce((s,x)=>s+x.pct,0)/n); const avgActivity=Math.round(d.activityDays.reduce((s,x)=>s+x.pct,0)/n);
    root.innerHTML=`<div class="dp-card"><div class="dp-head"><div><h2>📈 Dashboard de progressão</h2><p>Acompanhe a evolução do seu processo ao longo do tempo.</p></div><div class="dp-range"><button data-range="7" class="${n===7?"active":""}">7 dias</button><button data-range="30" class="${n===30?"active":""}">30 dias</button><button data-range="90" class="${n===90?"active":""}">90 dias</button></div></div><div class="dp-body"><div class="dp-stats"><div class="dp-stat"><small>Adesão geral</small><strong>${d.adherence}%</strong><span>${titleRange}</span></div><div class="dp-stat"><small>Meta de água atingida</small><strong>${d.waterMet}/${n}</strong><span>dias completos</span></div><div class="dp-stat"><small>Meta de atividade</small><strong>${d.activityMet}/${n}</strong><span>dias completos</span></div><div class="dp-stat"><small>Evolução do peso</small><strong>${weightChange!==null?(weightChange>0?"+":"")+weightChange.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+" kg":"—"}</strong><span>${d.atual!==null?"peso atual "+d.atual.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+" kg":"registre seu peso"}</span></div></div><div class="dp-grid"><div class="dp-panel"><h3>💧 Consistência da hidratação</h3><p class="dp-sub">Percentual da meta diária alcançado em cada dia.</p>${chart?`<div class="dp-chart">${chart}</div>`:`<div class="dp-empty">Ainda não há registros de hidratação suficientes.</div>`}<div class="dp-legend"><span><i class="dp-dot"></i>Meta limitada a 100% por dia</span><span>Média do período: <b>${avgWater}%</b></span></div></div><div class="dp-panel"><h3>🎯 Indicadores do processo</h3><div class="dp-progress-list"><div class="dp-progress-row"><b>💧 Água</b><div class="bar"><i style="width:${avgWater}%"></i></div><strong>${avgWater}%</strong></div><div class="dp-progress-row"><b>🏃 Atividade</b><div class="bar"><i style="width:${avgActivity}%"></i></div><strong>${avgActivity}%</strong></div><div class="dp-progress-row"><b>☑️ Checklist</b><div class="bar"><i style="width:${Math.round(d.checklistAvg)}%"></i></div><strong>${d.checklistAvg?Math.round(d.checklistAvg)+"%":"—"}</strong></div><div class="dp-progress-row"><b>⚖️ Peso</b><div class="bar"><i style="width:${d.atual!==null?100:0}%"></i></div><strong>${d.atual!==null?"OK":"—"}</strong></div></div><div class="dp-insights"><div class="dp-insight"><b>💧 Água</b><span>${avgWater>=100?"Excelente constância no período.":avgWater>=80?"Boa adesão; tente aproximar-se da meta diariamente.":"Há espaço para melhorar a regularidade da hidratação."}</span></div><div class="dp-insight"><b>🏃 Movimento</b><span>${avgActivity>=100?"Meta física média atingida.":avgActivity>=70?"Boa frequência de atividade física.":"Priorize pequenos treinos consistentes."}</span></div><div class="dp-insight"><b>⚖️ Peso</b><span>${d.meta!==null&&d.atual!==null?`Meta cadastrada: ${Number(d.meta).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} kg.` : "Cadastre uma meta de peso para acompanhar a distância até o objetivo."}</span></div></div></div></div><div class="dp-panel"><h3>⚖️ Linha do tempo do peso</h3><p class="dp-sub">Registros existentes dentro do período selecionado.</p>${d.weights.length?`<div class="dp-chart" style="height:180px">${d.weights.map((r,i)=>{const ws=d.weights.map(x=>Number(x.peso));const min=Math.min(...ws),maxW=Math.max(...ws);const span=Math.max(0.5,maxW-min);const h=Math.max(10,Math.round(((Number(r.peso)-min)/span)*125+25));return `<div class="dp-col"><em>${Number(r.peso).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</em><span style="height:${h}px"></span><small>${esc(fmtDate(new Date(r.data+"T12:00:00")))}</small></div>`}).join("")}</div>`:`<div class="dp-empty">Registre seu peso para visualizar a evolução aqui.</div>`}</div><div class="dp-foot">O dashboard utiliza os dados já registrados no aplicativo e armazenados localmente neste navegador. Trocar de navegador ou limpar os dados do site pode remover o histórico local; use o módulo de backup para preservar seus registros.</div></div></div>`;
    root.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>{root.dataset.range=b.dataset.range;render()});
  }

  function start(){styles();render();window.addEventListener("storage",render);["planoAlimentar:pesoAtualizado","planoAlimentar:atividadeMetaAtualizada","planoAlimentar:backupRestaurado","planoAlimentar:perfilAtualizado"].forEach(e=>window.addEventListener(e,()=>setTimeout(render,100)));setInterval(render,3000);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
