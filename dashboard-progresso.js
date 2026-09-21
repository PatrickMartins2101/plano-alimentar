/* DASHBOARD DE PROGRESSÃO V4 */
(() => {
  "use strict";
  const ID="dashboardProgressao", WATER="planoAlimentar_hidratacao_v1", ACT="planoAlimentar_atividade_v1", WEIGHT="planoAlimentar_peso_v1", CHECK="planoAlimentar_checklist_v2", GOALS="planoAlimentar_dashboard_metas_v1";
  const DEFAULT_RANGE=7;
  const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const key=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
  const days=n=>{const a=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);a.push({date:d,key:key(d)})}return a};
  const safeNum=v=>Number.isFinite(Number(v))?Number(v):0;
  function init(){
    if(!document.getElementById("dp-v4-style")){
      const s=document.createElement("style");s.id="dp-v4-style";s.textContent=`
      #${ID}{max-width:1200px;margin:20px auto;padding:0 18px;color:#17352d;font-family:Arial,sans-serif}
      #${ID} *{box-sizing:border-box}
      .dp4{background:#fffdf8;border:1px solid #d8d5c7;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(23,53,45,.08)}
      .dp4head{padding:20px 22px;background:linear-gradient(135deg,#176b52,#2d8a6a);color:#fff;display:flex;justify-content:space-between;gap:16px;align-items:center}
      .dp4head h2{margin:0;font-size:24px}.dp4head p{margin:5px 0 0;opacity:.9;font-size:13px}
      .dp4range{display:flex;gap:6px;flex-wrap:wrap}.dp4range button,.dp4btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
      .dp4range button{background:rgba(255,255,255,.18);color:#fff}.dp4range .on{background:#fff;color:#176b52}
      .dp4body{padding:20px}.dp4body>h3{margin:0 0 12px;font-size:20px}
      .dp4goals{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      .dp4goal,.dp4panel{background:#fff;border:1px solid #dedacf;border-radius:16px;padding:14px}
      .dp4goal b{display:block;font-size:14px}.dp4goal strong{font-size:21px;color:#176b52;display:block;margin:5px 0}
      .dp4goal input{width:100%;padding:9px;border:1px solid #d5d1c4;border-radius:9px;font-size:15px}.dp4btn{background:#176b52;color:#fff;margin-top:8px}
      .dp4summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.dp4sum{padding:10px 12px;background:#f3f4ed;border-radius:12px;font-size:12px;color:#5e7169}.dp4sum strong{display:block;color:#176b52;font-size:18px;margin-top:2px}
      .dp4grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .dp4panel h3{margin:0 0 4px;font-size:18px}.dp4sub{font-size:12px;color:#71827b;margin-bottom:8px}
      .dp4chart{height:190px;display:grid;grid-template-columns:repeat(var(--bars),minmax(0,1fr));align-items:end;gap:7px;padding:20px 4px 28px;border-bottom:1px solid #ddd;overflow:hidden}
      .dp4bar{min-width:0;height:100%;position:relative;display:flex;align-items:flex-end;justify-content:center}
      .dp4bar i{display:block;width:min(28px,70%);background:#2d8a6a;border-radius:6px 6px 0 0;min-height:2px}
      .dp4bar small{position:absolute;bottom:-22px;font-size:10px;left:50%;transform:translateX(-50%);white-space:nowrap;color:#53675f}
      .dp4bar em{position:absolute;top:-2px;left:50%;transform:translate(-50%,-100%);font-size:9px;font-style:normal;color:#53675f}
      .dp4empty{text-align:center;padding:35px;color:#71827b}.dp4note{font-size:11px;color:#71827b;margin-top:14px}
      .dp4rows{display:grid;gap:10px}.dp4row{display:grid;grid-template-columns:105px 1fr 45px;align-items:center;gap:8px;font-size:12px}.dp4track{height:9px;background:#e8e5dc;border-radius:99px;overflow:hidden}.dp4track i{display:block;height:100%;background:#176b52}
      @media(max-width:850px){.dp4head{flex-direction:column;align-items:flex-start}.dp4goals{grid-template-columns:1fr 1fr}.dp4grid{grid-template-columns:1fr}}
      @media(max-width:520px){#${ID}{padding:0 10px}.dp4body{padding:14px}.dp4goals{grid-template-columns:1fr}.dp4summary{grid-template-columns:1fr 1fr}.dp4chart{height:175px;gap:4px}.dp4bar small{font-size:9px}.dp4bar em{font-size:8px}.dp4row{grid-template-columns:88px 1fr 40px}}
      `;document.head.appendChild(s)
    }
    render();
  }
  function chart(arr,ds){
    if(!arr.length)return '<div class="dp4empty">Sem registros no período.</div>';
    const step=ds.length<=7?1:Math.ceil(ds.length/7);
    return arr.map((v,i)=>{const show=i%step===0||i===arr.length-1;return `<div class="dp4bar"><em>${v}%</em><i style="height:${Math.max(2,Math.min(100,v))/100*145}px"></i><small>${show?ds[i].date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit}):""}</small></div>`}).join("");
  }
  function render(){
    let root=document.getElementById(ID);
    if(!root){root=document.createElement("section");root.id=ID;const p=document.getElementById("painelGeralFinal");(p?.parentNode||document.body).insertBefore(root,p?.nextSibling||null)}
    const range=Number(root.dataset.range)||DEFAULT_RANGE;
    const water=get(WATER,{goal:2500,days:{}}), activity=get(ACT,{goal:30,records:[]}), weights=get(WEIGHT,[]), saved=get(GOALS,{});
    const goals={water:safeNum(saved.water??water.goal??2500),activity:safeNum(saved.activity??activity.goal??30),weight:safeNum(saved.weight??0),checklist:safeNum(saved.checklist??100)};
    const ds=days([7,30,90].includes(range)?range:DEFAULT_RANGE);
    const ws=ds.map(d=>safeNum(water.days?.[d.key]?.total));
    const as=ds.map(d=>(Array.isArray(activity.records)?activity.records:[]).filter(r=>r.date===d.key).reduce((s,r)=>s+safeNum(r.minutes),0));
    const waterPct=ws.map(v=>clamp(goals.water?v/goals.water*100:0)), actPct=as.map(v=>clamp(goals.activity?v/goals.activity*100:0));
    const avg=a=>Math.round(a.reduce((s,v)=>s+v,0)/(a.length||1));
    const weightRows=(Array.isArray(weights)?weights:[]).sort((a,b)=>String(a.data).localeCompare(String(b.data))).slice(-range);
    const last=weightRows.at(-1)?.peso;
    const goalCard=(id,title,value,unit)=>`<div class="dp4goal"><b>${title}</b><strong>${value||value===0?value:"—"} ${unit}</strong><input id="${id}" type="number" min="0" value="${value||value===0?value:""}"><button class="dp4btn" data-save-goal="${id}">Salvar meta</button></div>`;
    root.innerHTML=`<div class="dp4"><div class="dp4head"><div><h2>📈 Dashboard de progressão</h2><p>Visão resumida dos últimos ${range} dias.</p></div><div class="dp4range"><button data-range="7" class="${range===7?"on":""}">7 dias</button><button data-range="30" class="${range===30?"on":""}">30 dias</button><button data-range="90" class="${range===90?"on":""}">90 dias</button></div></div><div class="dp4body"><h3>🎯 Minhas metas</h3><div class="dp4goals">${goalCard("goal-water","💧 Água",goals.water,"ml/dia")}${goalCard("goal-activity","🏃 Atividade",goals.activity,"min/dia")}${goalCard("goal-weight","⚖️ Peso",goals.weight,"kg")}${goalCard("goal-checklist","☑️ Checklist",goals.checklist,"%")}</div><div class="dp4summary"><div class="dp4sum">💧 Água — média do período<strong>${avg(waterPct)}%</strong></div><div class="dp4sum">🏃 Atividade — média do período<strong>${avg(actPct)}%</strong></div><div class="dp4sum">⚖️ Peso<strong>${last!=null?Number(last).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+" kg":"Sem registro"}</strong></div></div><div class="dp4grid"><div class="dp4panel"><h3>💧 Hidratação</h3><div class="dp4sub">Percentual da meta diária</div><div class="dp4chart" style="--bars:${ds.length}">${chart(waterPct,ds)}</div></div><div class="dp4panel"><h3>🏃 Atividade</h3><div class="dp4sub">Percentual da meta diária</div><div class="dp4chart" style="--bars:${ds.length}">${chart(actPct,ds)}</div></div><div class="dp4panel"><h3>⚖️ Evolução do peso</h3><div class="dp4sub">${last!=null?`Último registro: ${Number(last).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} kg`:`Ainda não há registros.`}</div>${weightRows.length?`<div class="dp4chart" style="--bars:${Math.max(1,weightRows.length)}">${weightRows.map(r=>{const v=safeNum(r.peso);return `<div class="dp4bar"><em>${v.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</em><i style="height:${Math.max(5,Math.min(100,v/200*100))/100*145}px"></i><small>${String(r.data).slice(5).replace("-","/")}</small></div>`}).join("")}</div>`:`<div class="dp4empty">⚖️ Registre seu peso para começar o gráfico.</div>`}</div><div class="dp4panel"><h3>☑️ Cumprimento das metas</h3><div class="dp4rows"><div class="dp4row"><b>💧 Água</b><div class="dp4track"><i style="width:${avg(waterPct)}%"></i></div><strong>${avg(waterPct)}%</strong></div><div class="dp4row"><b>🏃 Atividade</b><div class="dp4track"><i style="width:${avg(actPct)}%"></i></div><strong>${avg(actPct)}%</strong></div><div class="dp4row"><b>⚖️ Peso</b><div class="dp4track"><i style="width:${last!=null?100:0}%"></i></div><strong>${last!=null?"OK":"—"}</strong></div><div class="dp4row"><b>☑️ Checklist</b><div class="dp4track"><i style="width:${clamp(goals.checklist)}%"></i></div><strong>${clamp(goals.checklist)}%</strong></div></div></div></div><div class="dp4note">O dashboard inicia automaticamente em 7 dias para facilitar a leitura. Os dados são os registros existentes neste dispositivo.</div></div></div>`;
    root.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>{root.dataset.range=b.dataset.range;render()});
    root.querySelectorAll("[data-save-goal]").forEach(b=>b.onclick=()=>{const id=b.dataset.saveGoal,v=Number(document.getElementById(id).value);if(!Number.isFinite(v)||v<0)return;const cur=get(GOALS,{});if(id==="goal-water")cur.water=v;if(id==="goal-activity")cur.activity=v;if(id==="goal-weight")cur.weight=v;if(id==="goal-checklist")cur.checklist=v;set(GOALS,cur);render()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
