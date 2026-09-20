/* ============================================================
   EDITOR DO PLANO ALIMENTAR — V2
   Camada independente: não altera a prescrição original.
   As personalizações ficam somente no navegador.
   ============================================================ */
(() => {
  "use strict";
  const KEY = "planoAlimentar_editorPlano_v1";
  const ID = "editorPlanoV2";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { meals:{}, customMeals:[] }; } catch { return { meals:{}, customMeals:[] }; } };
  const save = s => localStorage.setItem(KEY, JSON.stringify(s));
  const state = () => { const s=load(); s.meals ||= {}; s.customMeals ||= []; return s; };
  const mealIds = () => $$(".meal[id]").map(x=>x.id);
  const original = id => {
    const el = document.getElementById(id); if(!el) return null;
    return {id,title:$("h2",el)?.textContent.trim()||id,time:$(".time",el)?.textContent.trim()||"",notes:$(".notes",el)?.innerHTML||"",foods:$$('.food',el).map(f=>({icon:$('.food-icon',f)?.textContent.trim()||"🍽️",name:$('.food-name',f)?.textContent.trim()||"",qty:$('.food-qty',f)?.textContent.trim()||"",subs:JSON.parse($('.swap',f)?.dataset.subs||"[]")}))};
  };
  const current = id => state().meals[id] || original(id);
  function css(){ if($("#editor-plano-style"))return; const s=document.createElement("style");s.id="editor-plano-style";s.textContent=`#${ID}{max-width:1200px;margin:18px auto;padding:0 20px;font-family:Arial,sans-serif;color:#17352d}#${ID} *{box-sizing:border-box}.ep-card{background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;box-shadow:0 6px 20px #17352d14;overflow:hidden}.ep-head{padding:18px 20px;background:#f1f0e7;display:flex;justify-content:space-between;gap:12px;align-items:center}.ep-head h2{margin:0;font-size:22px}.ep-head p{margin:5px 0 0;color:#60746c;font-size:13px}.ep-body{padding:16px 20px}.ep-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.ep-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.ep-primary{background:#176b52;color:#fff}.ep-soft{background:#e7eee5;color:#176b52}.ep-danger{background:#f5dfda;color:#8b3e31}.ep-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ep-meal{border:1px solid #dedacf;border-radius:13px;padding:12px;background:#fff}.ep-meal strong{display:block}.ep-meal small{color:#687871}.ep-editor{margin-top:14px;border-top:1px solid #e3e0d6;padding-top:14px;display:none}.ep-editor.show{display:block}.ep-grid{display:grid;grid-template-columns:140px 1fr 140px;gap:9px}.ep-field{display:grid;gap:5px;font-size:11px;font-weight:800}.ep-field input,.ep-field textarea{width:100%;padding:9px;border:1px solid #d8d5c7;border-radius:9px;background:#fff}.ep-food{display:grid;grid-template-columns:55px 1fr 180px 40px;gap:8px;align-items:center;margin-top:8px;padding:8px;border:1px solid #e1ded4;border-radius:10px}.ep-food input{width:100%;padding:8px;border:1px solid #d8d5c7;border-radius:8px}.ep-icon{font-size:24px;text-align:center}.ep-x{border:0;border-radius:8px;background:#f5dfda;color:#8b3e31;padding:8px;cursor:pointer;font-weight:800}.ep-hint{margin:10px 0;color:#6d7c75;font-size:12px}.ep-empty{padding:15px;border:1px dashed #d8d5c7;border-radius:10px;color:#71817a}.ep-custom{margin-top:12px}@media(max-width:700px){#${ID}{padding:0 10px}.ep-list,.ep-grid{grid-template-columns:1fr}.ep-food{grid-template-columns:45px 1fr 35px}.ep-food .ep-qty{grid-column:2}.ep-food .ep-x{grid-column:3;grid-row:1 / span 2}}`;document.head.appendChild(s); }
  function render(){
    let box=$("#"+ID); if(!box){box=document.createElement("section");box.id=ID;const wrap=$(".wrap")||document.body;wrap.insertBefore(box,wrap.children[1]||null)}
    const s=state(); const originals=mealIds().map(id=>({id,title:current(id)?.title||original(id)?.title||id,time:current(id)?.time||original(id)?.time||""}));
    box.innerHTML=`<div class="ep-card"><div class="ep-head"><div><h2>🍽️ Personalizar plano alimentar</h2><p>A prescrição original permanece preservada. Suas alterações ficam somente neste dispositivo.</p></div></div><div class="ep-body"><div class="ep-actions"><button class="ep-btn ep-primary" id="ep-new">＋ Nova refeição</button><button class="ep-btn ep-soft" id="ep-reset-all">↺ Restaurar plano original</button></div><div class="ep-list">${originals.map(m=>`<div class="ep-meal"><strong>${esc(m.title)}</strong><small>${esc(m.time)}</small><div style="margin-top:8px"><button class="ep-btn ep-soft" data-edit="${esc(m.id)}">✏️ Editar completamente</button> <button class="ep-btn ep-danger" data-reset="${esc(m.id)}">Restaurar</button></div></div>`).join("")}${s.customMeals.map((m,i)=>`<div class="ep-meal ep-custom"><strong>${esc(m.title)}</strong><small>${esc(m.time)} • Receita personalizada</small><div style="margin-top:8px"><button class="ep-btn ep-soft" data-custom-edit="${i}">✏️ Editar</button> <button class="ep-btn ep-danger" data-custom-delete="${i}">Excluir</button></div></div>`).join("")}</div><div class="ep-editor" id="ep-editor"></div></div></div>`;
    $$('[data-edit]',box).forEach(b=>b.onclick=()=>openEditor(b.dataset.edit,false));
    $$('[data-reset]',box).forEach(b=>b.onclick=()=>{if(confirm("Restaurar esta refeição para a prescrição original?")){const x=state();delete x.meals[b.dataset.reset];save(x);apply();render();}});
    $$('[data-custom-edit]',box).forEach(b=>b.onclick=()=>openEditor(Number(b.dataset.customEdit),true));
    $$('[data-custom-delete]',box).forEach(b=>b.onclick=()=>{if(confirm("Excluir esta refeição personalizada?")){const x=state();x.customMeals.splice(Number(b.dataset.customDelete),1);save(x);render();}});
    $("#ep-new",box).onclick=()=>openEditor(null,true);
    $("#ep-reset-all",box).onclick=()=>{if(confirm("Restaurar todas as refeições e excluir as receitas personalizadas?")){save({meals:{},customMeals:[]});apply();render();}};
  }
  function openEditor(id,isCustom){
    const s=state(); let data;
    if(isCustom){data=id===null?{title:"Nova refeição",time:"",icon:"🍽️",foods:[]}:s.customMeals[id];}
    else data=current(id);
    if(!data)return;
    const editor=$("#ep-editor"); editor.classList.add("show"); editor.dataset.custom=isCustom?"1":"0";editor.dataset.id=id===null?"":String(id);
    editor.innerHTML=`<div class="ep-grid"><label class="ep-field">Nome da refeição<input id="ep-title" value="${esc(data.title)}"></label><label class="ep-field">Horário<input id="ep-time" type="time" value="${esc(String(data.time).match(/\d\d:\d\d/)?.[0]||"")}"></label><label class="ep-field">Ícone<input id="ep-icon" value="${esc(data.icon||"🍽️")}" maxlength="4"></label></div><div class="ep-hint">Adicione, edite ou remova qualquer alimento. O nome pode ser totalmente novo; ele não precisa existir no aplicativo.</div><div id="ep-foods">${(data.foods||[]).map((f,i)=>foodRow(f,i)).join("")}</div><div class="ep-actions" style="margin-top:12px"><button class="ep-btn ep-soft" id="ep-add-food">＋ Adicionar alimento</button><button class="ep-btn ep-primary" id="ep-save">💾 Salvar alterações</button><button class="ep-btn ep-danger" id="ep-cancel">Cancelar</button></div>`;
    $("#ep-add-food",editor).onclick=()=>{const n=$("#ep-foods").children.length;$("#ep-foods").insertAdjacentHTML("beforeend",foodRow({icon:"🍽️",name:"Novo alimento",qty:"",subs:[]},n));};
    $("#ep-save",editor).onclick=()=>saveEditor(editor,isCustom);
    $("#ep-cancel",editor).onclick=()=>{editor.classList.remove("show");};
    editor.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function foodRow(f,i){return `<div class="ep-food" data-food><input class="ep-icon" value="${esc(f.icon||"🍽️")}" maxlength="4" aria-label="Ícone"><input class="ep-name" value="${esc(f.name||"")}" placeholder="Nome do alimento"><input class="ep-qty" value="${esc(f.qty||"")}" placeholder="Quantidade / medida"><button class="ep-x" type="button" title="Remover">×</button></div>`}
  function saveEditor(editor,isCustom){
    const foods=$$('[data-food]',editor).map(r=>({icon:$(".ep-icon",r).value.trim()||"🍽️",name:$(".ep-name",r).value.trim(),qty:$(".ep-qty",r).value.trim(),subs:[]})).filter(f=>f.name);
    const data={title:$("#ep-title",editor).value.trim()||"Refeição",time:$("#ep-time",editor).value||"",icon:$("#ep-icon",editor).value.trim()||"🍽️",foods}; const s=state();
    if(isCustom){const id=editor.dataset.id===""?null:Number(editor.dataset.id);if(id===null)s.customMeals.push(data);else s.customMeals[id]=data;}else{const id=editor.dataset.id;s.meals[id]=data;}
    save(s);apply();render();
  }
  function apply(){
    const s=state();
    mealIds().forEach(id=>{const d=s.meals[id];const el=document.getElementById(id);if(!el||!d)return;const h=$("h2",el);if(h)h.textContent=d.title;const t=$(".time",el);if(t)t.textContent=d.time||t.textContent;const foods=$(".foods",el);if(foods)foods.innerHTML=d.foods.map(f=>`<article class="food"><div class="food-icon">${esc(f.icon)}</div><div class="food-name">${esc(f.name)}</div><div class="food-qty">${esc(f.qty)}</div><span class="no-subs">Personalizado</span></article>`).join("");});
    $$("#editorPlanoV2 .ep-custom-render").forEach(x=>x.remove());
    const content=$("#content"); if(content)s.customMeals.forEach((d,i)=>{const sec=document.createElement("section");sec.className="meal ep-custom-render";sec.id=`custom-meal-${i}`;sec.innerHTML=`<div class="meal-head"><div class="time">${esc(d.time||"—")}</div><h2>${esc(d.title)}</h2></div><div class="foods">${d.foods.map(f=>`<article class="food"><div class="food-icon">${esc(f.icon)}</div><div class="food-name">${esc(f.name)}</div><div class="food-qty">${esc(f.qty)}</div><span class="no-subs">Receita personalizada</span></article>`).join("")}</div>`;content.appendChild(sec);});
  }
  function boot(){try{css();apply();render();}catch(e){console.warn("Editor de plano não foi carregado:",e)}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
