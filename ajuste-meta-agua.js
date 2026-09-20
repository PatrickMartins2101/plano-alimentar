/* Ajuste visual da meta de hidratação sem substituir agua.js. */
(() => {
  "use strict";
  function aplicar(){
    const app=document.getElementById("agua-app");
    if(!app)return;
    const cards=app.querySelectorAll(".agua-card");
    cards.forEach(card=>{
      const txt=card.querySelector(".agua-values span");
      const strong=card.querySelector(".agua-values strong");
      if(!txt||!strong)return;
      const s=window.PlanoAlimentarAgua;
      if(!s)return;
      const day=s.obterHoje();const goal=Number(s.obterMeta()||0);const total=Number(day.total||0);
      if(total>=goal){
        const extra=total-goal;
        txt.textContent=extra>0?`de ${(goal/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})} L • Meta atingida +${(extra/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})} L`:`de ${(goal/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})} L • Meta atingida`;
      }
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(aplicar,200));else setTimeout(aplicar,200);
  setInterval(aplicar,2000);
})();
