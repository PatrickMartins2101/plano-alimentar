/* DASHBOARD SYNC V5 — usa os mesmos registros reais do período selecionado */
(() => {
  "use strict";
  const WATER="planoAlimentar_hidratacao_v1";
  const ACT="planoAlimentar_atividade_v1";
  const CHECK="planoAlimentar_checklist_v2";
  const CHECK_HISTORY="planoAlimentar_checklist_historico_v1";

  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const periodKeys=n=>{const a=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);a.push(key(d))}return a};

  function checklistSeries(keys){
    const history=read(CHECK_HISTORY,{});
    const current=read(CHECK,{data:key(new Date()),itens:{}});
    const today=key(new Date());
    const result=keys.map(k=>{
      if(k===today && current.data===today){
        const vals=Object.values(current.itens||{});
        return vals.length?clamp(vals.filter(Boolean).length/vals.length*100):0;
      }
      return history[k]==null?0:clamp(history[k]);
    });
    return result;
  }

  function avg(a){return Math.round(a.reduce((s,v)=>s+v,0)/(a.length||1));}

  function sync(){
    const root=document.getElementById("dashboardProgressao");
    if(!root)return;
    const range=Number(root.dataset.range)||7;
    const keys=periodKeys([7,30,90].includes(range)?range:7);
    const water=read(WATER,{goal:2500,days:{}});
    const act=read(ACT,{goal:30,records:[]});
    const wg=Number(water.goal)||2500;
    const ag=Number(act.goal)||30;
    const waterPct=keys.map(k=>clamp((Number(water.days?.[k]?.total)||0)/wg*100));
    const actPct=keys.map(k=>clamp((Array.isArray(act.records)?act.records:[]).filter(r=>r.date===k).reduce((s,r)=>s+(Number(r.minutes)||0),0)/ag*100));
    const checkPct=checklistSeries(keys);
    const panel=[...root.querySelectorAll(".dp4panel")].find(p=>p.querySelector("h3")?.textContent.includes("Cumprimento das metas"));
    if(!panel)return;
    const rows=panel.querySelectorAll(".dp4row");
    const vals=[avg(waterPct),avg(actPct),null,avg(checkPct)];
    rows.forEach((row,i)=>{
      if(i===3){
        const value=vals[3];
        const bar=row.querySelector(".dp4track i"),strong=row.querySelector("strong");
        if(bar)bar.style.width=`${value}%`;
        if(strong)strong.textContent=`${value}%`;
      }
    });

    const checklistGoal=root.querySelector('[data-save-goal="goal-checklist"]')?.closest(".dp4goal");
    if(checklistGoal){
      checklistGoal.innerHTML=`<b>☑️ Checklist</b><strong>${avg(checkPct)}%</strong><small style="color:#71827b">cumprimento médio real no período</small>`;
    }
  }

  function start(){
    const run=()=>setTimeout(sync,30);
    run();
    const obs=new MutationObserver(run);
    obs.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("storage",run);
    window.addEventListener("planoAlimentar:dashboardAtualizar",run);
    window.addEventListener("planoAlimentar:checklistNovoDia",run);
    setInterval(sync,2000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
