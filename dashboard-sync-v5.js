/* DASHBOARD SYNC V5 — usa os mesmos registros reais do período selecionado */
(() => {
  "use strict";
  const WATER="planoAlimentar_hidratacao_v1", ACT="planoAlimentar_atividade_v1", CHECK="planoAlimentar_checklist_v2", CHECK_HISTORY="planoAlimentar_checklist_historico_v1";
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const periodKeys=n=>{const a=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);a.push(key(d))}return a};
  const avg=a=>Math.round(a.reduce((s,v)=>s+v,0)/(a.length||1));
  function checklistSeries(keys){const history=read(CHECK_HISTORY,{}),current=read(CHECK,{data:key(new Date()),itens:{}}),today=key(new Date());return keys.map(k=>{if(k===today&&current.data===today){const vals=Object.values(current.itens||{});return vals.length?clamp(vals.filter(Boolean).length/vals.length*100):0}return history[k]==null?0:clamp(history[k])})}
  function sync(){
    const root=document.getElementById("dashboardProgressao");if(!root)return;
    const range=Number(root.dataset.range)||7,keys=periodKeys([7,30,90].includes(range)?range:7),water=read(WATER,{goal:2500,days:{}}),act=read(ACT,{goal:30,records:[]});
    const wg=Number(water.goal)||2500,ag=Number(act.goal)||30;
    const waterPct=keys.map(k=>clamp((Number(water.days?.[k]?.total)||0)/wg*100));
    const actPct=keys.map(k=>clamp((Array.isArray(act.records)?act.records:[]).filter(r=>r.date===k).reduce((s,r)=>s+(Number(r.minutes)||0),0)/ag*100));
    const checkAvg=avg(checklistSeries(keys));
    const panel=[...root.querySelectorAll(".dp4panel")].find(p=>p.querySelector("h3")?.textContent.includes("Cumprimento das metas"));if(!panel)return;
    const rows=panel.querySelectorAll(".dp4row");
    if(rows[3]){const bar=rows[3].querySelector(".dp4track i"),strong=rows[3].querySelector("strong");if(bar)bar.style.width=`${checkAvg}%`;if(strong)strong.textContent=`${checkAvg}%`}
    const checklistGoal=root.querySelector('[data-save-goal="goal-checklist"]')?.closest(".dp4goal");
    if(checklistGoal&&!checklistGoal.dataset.v5){checklistGoal.dataset.v5="1";checklistGoal.innerHTML=`<b>☑️ Checklist</b><strong>${checkAvg}%</strong><small style="color:#71827b">cumprimento médio real no período</small>`}
    else if(checklistGoal){const strong=checklistGoal.querySelector("strong");if(strong)strong.textContent=`${checkAvg}%`}
  }
  function start(){setTimeout(sync,200);window.addEventListener("storage",()=>setTimeout(sync,50));window.addEventListener("planoAlimentar:dashboardAtualizar",()=>setTimeout(sync,50));window.addEventListener("planoAlimentar:checklistNovoDia",()=>setTimeout(sync,50));setInterval(sync,2000)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
