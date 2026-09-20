/* Cole antes de </script>. Requer getData() e saveData() já existentes. */
const checklistItems=["agua","refeicoes","exercicio","sono","plano"];

function getTodayKey(){
  return new Date().toISOString().split("T")[0];
}

function loadChecklist(){
  const data=getData();
  if(!data.checklists)data.checklists={};
  const today=getTodayKey();
  if(!data.checklists[today])data.checklists[today]={};

  checklistItems.forEach(item=>{
    const checkbox=document.getElementById(`check-${item}`);
    if(checkbox){
      checkbox.checked=data.checklists[today][item]===true;
      checkbox.addEventListener("change",()=>{
        data.checklists[today][item]=checkbox.checked;
        saveData(data);
        updateChecklistProgress();
      });
    }
  });
  updateChecklistProgress();
}

function updateChecklistProgress(){
  const data=getData();
  const today=getTodayKey();
  const todayChecklist=data.checklists?.[today]||{};
  let completed=0;
  checklistItems.forEach(item=>{
    if(todayChecklist[item]===true)completed++;
  });
  const percentage=(completed/checklistItems.length)*100;
  const text=document.getElementById("check-progress-text");
  const fill=document.getElementById("check-progress-fill");
  if(text)text.textContent=`${completed} de ${checklistItems.length} concluídos`;
  if(fill)fill.style.width=`${percentage}%`;
}

loadChecklist();
