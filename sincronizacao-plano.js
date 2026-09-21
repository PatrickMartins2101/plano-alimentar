/* SINCRONIZAÇÃO DO PLANO — horários/títulos/ícones entre todas as áreas */
(() => {
  "use strict";
  const map=["cafe","almoco","lanche","jantar","opcao","whey"];
  function removerChecklistAntigo(){document.getElementById("checklist-section")?.remove();document.getElementById("checklist-container")?.remove()}
  function sync(){
    removerChecklistAntigo();
    map.forEach(id=>{
      const meal=document.getElementById(id);if(!meal)return;
      const time=meal.querySelector(".time")?.textContent.trim()||"";
      const title=meal.querySelector("h2")?.textContent.trim()||"";
      const icon=(meal.querySelector(".time")?.textContent.trim().match(/^([^0-9]+)/)?.[1]||"🍽️").trim();
      [...document.querySelectorAll("nav button")].forEach(btn=>{const onclick=btn.getAttribute("onclick")||"";if(onclick.includes(`go('${id}'`))btn.textContent=`${icon} ${time} — ${title}`});
      const check=document.querySelector(`[data-check="${id}"]`);const detail=check?.querySelector(".cd-time");if(detail)detail.textContent=time||"Hoje";
    });
  }
  function start(){sync();const content=document.getElementById("content");if(content)new MutationObserver(sync).observe(content,{subtree:true,childList:true,characterData:true});setInterval(sync,1000);window.addEventListener("planoAlimentar:planoAtualizado",sync);window.addEventListener("storage",sync)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();