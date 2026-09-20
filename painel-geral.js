/* ============================================================
   PLANO ALIMENTAR — PAINEL GERAL DE PROGRESSO
   Arquivo: painel-geral.js
   Versão: final-integração

   Integra:
   - Hidratação: planoAlimentar_hidratacao_v1
   - Atividade física: planoAlimentar_atividade_v1
   - Checklist: planoAlimentar_checklist_v2

   O painel não altera os módulos existentes.
   Ele apenas lê os dados salvos no navegador e apresenta
   um resumo geral.
   ============================================================ */

(() => {
  "use strict";

  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const ACTIVITY_KEY = "planoAlimentar_atividade_v1";
  const CHECKLIST_KEY = "planoAlimentar_checklist_v2";
  const PANEL_ID = "painelGeralFinal";

  function hoje() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function ler(chave, padrao) {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : padrao;
    } catch {
      return padrao;
    }
  }

  function limitar(v) {
    return Math.max(0, Math.min(100, Math.round(v || 0)));
  }

  function agua() {
    const s = ler(WATER_KEY, { goal: 2500, days: {} });
    const dia = s.days?.[hoje()] || { total: 0 };
    const total = Number(dia.total || 0);
    const meta = Number(s.goal || 2500);
    return { total, meta, pct: limitar(total / meta * 100) };
  }

  function atividade() {
    const s = ler(ACTIVITY_KEY, { goal: 30, records: [] });
    const meta = Number(s.goal || 30);
    const total = (Array.isArray(s.records) ? s.records : [])
      .filter(r => r.date === hoje())
      .reduce((acc, r) => acc + Number(r.minutes || 0), 0);
    return { total, meta, pct: limitar(total / meta * 100) };
  }

  function checklist() {
    const s = ler(CHECKLIST_KEY, { data: hoje(), itens: {} });
    if (s.data !== hoje()) return { feitos: 0, total: 0, pct: 0 };

    const itens = s.itens && typeof s.itens === "object" ? s.itens : {};
    const total = Object.keys(itens).length;
    const feitos = Object.values(itens).filter(Boolean).length;

    // O checklist pode possuir qualquer quantidade de itens.
    // Se não houver dados, o painel mostra 0%.
    return { feitos, total, pct: total ? limitar(feitos / total * 100) : 0 };
  }

  function estilo() {
    if (document.getElementById("painel-geral-final-style")) return;
    const style = document.createElement("style");
    style.id = "painel-geral-final-style";
    style.textContent = `
      #${PANEL_ID}{
        max-width:1200px;
        margin:18px auto;
        padding:0 20px;
        box-sizing:border-box;
        color:#17352d;
        font-family:Arial,Helvetica,sans-serif;
      }
      #${PANEL_ID} *{box-sizing:border-box}
      .pg-card{
        background:#fffdf8;
        border:1px solid #d8d5c7;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 6px 20px rgba(23,53,45,.08)
      }
      .pg-head{
        padding:18px 20px;
        background:linear-gradient(135deg,#176b52,#2d8a6a);
        color:#fff;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px
      }
      .pg-head h2{margin:0;font-size:22px}
      .pg-head p{margin:4px 0 0;opacity:.9;font-size:13px}
      .pg-score{
        min-width:88px;
        padding:9px 12px;
        text-align:center;
        border-radius:13px;
        background:rgba(255,255,255,.15)
      }
      .pg-score strong{display:block;font-size:23px}
      .pg-grid{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:12px;
        padding:16px
      }
      .pg-item{
        border:1px solid #dedacf;
        border-radius:15px;
        padding:14px;
        background:#fff
      }
      .pg-top{
        display:flex;
        justify-content:space-between;
        gap:8px;
        align-items:center
      }
      .pg-name{font-weight:800}
      .pg-pct{font-weight:900;color:#176b52}
      .pg-value{font-size:13px;color:#657770;margin-top:7px}
      .pg-bar{
        height:8px;
        margin-top:10px;
        border-radius:99px;
        background:#e8e5dc;
        overflow:hidden
      }
      .pg-bar span{
        display:block;
        height:100%;
        width:0;
        background:#176b52;
        border-radius:inherit;
        transition:width .25s ease
      }
      .pg-foot{
        padding:0 16px 16px;
        color:#71827b;
        font-size:12px
      }
      @media(max-width:760px){
        .pg-grid{grid-template-columns:1fr}
        .pg-head{align-items:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    let panel = document.getElementById(PANEL_ID);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;

      const alvo = document.querySelector(".wrap") || document.body;
      alvo.prepend(panel);
    }

    const w = agua();
    const a = atividade();
    const c = checklist();

    const partes = [w.pct, a.pct];
    if (c.total > 0) partes.push(c.pct);
    const geral = Math.round(partes.reduce((s, n) => s + n, 0) / partes.length);

    panel.innerHTML = `
      <div class="pg-card">
        <div class="pg-head">
          <div>
            <h2>📊 Progresso de hoje</h2>
            <p>Resumo automático dos principais indicadores do seu plano.</p>
          </div>
          <div class="pg-score">
            <strong>${geral}%</strong>
            <small>progresso geral</small>
          </div>
        </div>

        <div class="pg-grid">
          <div class="pg-item">
            <div class="pg-top">
              <span class="pg-name">💧 Hidratação</span>
              <span class="pg-pct">${w.pct}%</span>
            </div>
            <div class="pg-value">${(w.total/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})} L de ${(w.meta/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})} L</div>
            <div class="pg-bar"><span style="width:${w.pct}%"></span></div>
          </div>

          <div class="pg-item">
            <div class="pg-top">
              <span class="pg-name">🏃 Atividade física</span>
              <span class="pg-pct">${a.pct}%</span>
            </div>
            <div class="pg-value">${a.total} min de ${a.meta} min</div>
            <div class="pg-bar"><span style="width:${a.pct}%"></span></div>
          </div>

          <div class="pg-item">
            <div class="pg-top">
              <span class="pg-name">☑️ Checklist</span>
              <span class="pg-pct">${c.total ? c.pct + "%" : "—"}</span>
            </div>
            <div class="pg-value">${c.total ? `${c.feitos} de ${c.total} itens concluídos` : "Nenhum dado disponível ainda"}</div>
            <div class="pg-bar"><span style="width:${c.pct}%"></span></div>
          </div>
        </div>

        <div class="pg-foot">
          Os dados são armazenados localmente neste navegador. O painel é apenas um resumo e não substitui orientação profissional.
        </div>
      </div>
    `;
  }

  function iniciar() {
    estilo();
    render();

    // Atualiza mesmo quando outro módulo grava localStorage na mesma aba.
    setInterval(render, 2000);

    window.addEventListener("storage", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
