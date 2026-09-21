/* PAINEL GERAL */
(()=>{
'use strict';
const P='painelGeralFinal';
function carregar(src){const s=document.createElement('script');s.src=src+'?v=20260920-final';s.defer=false;document.head.appendChild(s)}
function render(){let p=document.getElementById(P);if(!p){p=document.createElement('section');p.id=P;(document.querySelector('.wrap')||document.body).prepend(p)}p.innerHTML='<div style="background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;padding:18px;color:#17352d"><b>📊 Progresso de hoje</b></div>'}
function init(){render();['perfil-metas.js','peso-evolucao.js','ajuste-meta-agua.js','plano-prescrito.js','editor-plano-fix.js','calendario.js','fotos-evolucao.js','backup-restauracao.js','notificacoes.js','meta-atividade.js','dashboard-progresso.js'].forEach(carregar);const o=document.createElement('script');o.src='receita-foto-ocr.js?v=20260920-ocr4';o.defer=false;document.head.appendChild(o)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();