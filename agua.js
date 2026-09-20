/* ============================================================
   CONTROLE DE HIDRATAÇÃO — Plano Alimentar Interativo
   Arquivo: agua.js
   Integração: basta manter <script src="agua.js"></script>
   na página. Não exige HTML adicional.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "planoAlimentar_hidratacao_v1";
  const DEFAULT_GOAL = 2500;
  const PORTIONS = [200, 250, 300, 500, 750];

  function todayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function createDefaultState() {
    return {
      goal: DEFAULT_GOAL,
      days: {},
      settings: {
        reminder: false,
        reminderInterval: 120
      }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();

      const parsed = JSON.parse(raw);
      return {
        goal: Number(parsed.goal) > 0 ? Number(parsed.goal) : DEFAULT_GOAL,
        days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
        settings: {
          reminder: Boolean(parsed.settings?.reminder),
          reminderInterval: Number(parsed.settings?.reminderInterval) || 120
        }
      };
    } catch (error) {
      console.warn("Não foi possível carregar os dados de hidratação.", error);
      return createDefaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Não foi possível salvar os dados de hidratação.", error);
    }
  }

  function getDay(key = todayKey()) {
    if (!state.days[key]) {
      state.days[key] = {
        total: 0,
        entries: []
      };
    }

    if (!Array.isArray(state.days[key].entries)) {
      state.days[key].entries = [];
    }

    return state.days[key];
  }

  function formatMl(value) {
    return Number(value).toLocaleString("pt-BR") + " ml";
  }

  function formatLiters(value) {
    return (Number(value) / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }) + " L";
  }

  function clampPercent(total, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((total / goal) * 100));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "--:--";
    }
  }

  function ensureStyles() {
    if (document.getElementById("agua-final-styles")) return;

    const style = document.createElement("style");
    style.id = "agua-final-styles";
    style.textContent = `
      #agua-app {
        max-width: 1260px;
        margin: 22px auto;
        padding: 0 20px;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        color: #17352d;
      }

      #agua-app * { box-sizing: border-box; }

      .agua-card {
        background: #fffdf8;
        border: 1px solid #d8d5c7;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(23,53,45,.08);
      }

      .agua-header {
        padding: 22px 24px;
        background: linear-gradient(135deg, #176b52, #2d8a6a);
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
      }

      .agua-title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .agua-icon {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,.16);
        font-size: 28px;
      }

      .agua-header h2 {
        margin: 0 0 4px;
        font-size: 25px;
      }

      .agua-header p {
        margin: 0;
        opacity: .9;
        font-size: 14px;
      }

      .agua-percent {
        min-width: 84px;
        padding: 10px 14px;
        border-radius: 14px;
        text-align: center;
        background: rgba(255,255,255,.16);
        font-weight: 800;
      }

      .agua-percent strong {
        display: block;
        font-size: 24px;
      }

      .agua-percent span {
        font-size: 12px;
      }

      .agua-body {
        padding: 22px 24px 24px;
      }

      .agua-summary {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        align-items: center;
      }

      .agua-values {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px;
      }

      .agua-values strong {
        font-size: 32px;
        color: #176b52;
      }

      .agua-values span {
        color: #60746c;
        font-size: 15px;
      }

      .agua-progress {
        margin-top: 12px;
        width: 100%;
        height: 18px;
        border-radius: 999px;
        background: #e7e4d8;
        overflow: hidden;
      }

      .agua-progress-bar {
        height: 100%;
        width: 0%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2d8a6a, #176b52);
        transition: width .25s ease;
      }

      .agua-goal {
        text-align: right;
        color: #60746c;
        font-size: 13px;
      }

      .agua-goal strong {
        display: block;
        color: #17352d;
        font-size: 16px;
      }

      .agua-actions {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
      }

      .agua-btn,
      .agua-secondary,
      .agua-danger {
        border: 0;
        border-radius: 12px;
        min-height: 44px;
        padding: 10px 12px;
        font-weight: 800;
        cursor: pointer;
        font-size: 14px;
      }

      .agua-btn {
        background: #176b52;
        color: #fff;
      }

      .agua-btn:hover { background: #0f5943; }

      .agua-lower {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1.3fr .7fr;
        gap: 16px;
      }

      .agua-panel {
        border: 1px solid #e1dfd3;
        border-radius: 16px;
        padding: 16px;
        background: #fff;
      }

      .agua-panel h3 {
        margin: 0 0 12px;
        font-size: 17px;
      }

      .agua-entry-list {
        max-height: 190px;
        overflow: auto;
      }

      .agua-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 9px 0;
        border-bottom: 1px solid #eeeade;
        font-size: 14px;
      }

      .agua-entry:last-child { border-bottom: 0; }

      .agua-entry button {
        border: 0;
        background: transparent;
        cursor: pointer;
        color: #9a4b3c;
        font-weight: 800;
      }

      .agua-empty {
        color: #71817a;
        font-size: 14px;
      }

      .agua-settings {
        display: grid;
        gap: 10px;
      }

      .agua-settings label {
        font-size: 13px;
        font-weight: 700;
      }

      .agua-settings input,
      .agua-settings select {
        width: 100%;
        padding: 10px;
        border: 1px solid #d8d5c7;
        border-radius: 10px;
        background: #fff;
        font-size: 14px;
      }

      .agua-setting-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        align-items: end;
      }

      .agua-secondary {
        background: #e8efe5;
        color: #176b52;
      }

      .agua-danger {
        background: #f5e5e1;
        color: #8b3e31;
      }

      .agua-history {
        margin-top: 16px;
      }

      .agua-history-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 7px;
      }

      .agua-day {
        min-width: 0;
        padding: 9px 5px;
        border-radius: 10px;
        background: #f0eee5;
        text-align: center;
      }

      .agua-day.today { outline: 2px solid #176b52; }

      .agua-day small {
        display: block;
        font-weight: 800;
        color: #53665e;
      }

      .agua-day strong {
        display: block;
        margin-top: 4px;
        color: #176b52;
        font-size: 12px;
      }

      .agua-note {
        margin-top: 14px;
        color: #6a7771;
        font-size: 12px;
        line-height: 1.5;
      }

      @media (max-width: 800px) {
        #agua-app { padding: 0 12px; }
        .agua-header { align-items: flex-start; }
        .agua-summary,
        .agua-lower { grid-template-columns: 1fr; }
        .agua-goal { text-align: left; }
        .agua-actions { grid-template-columns: repeat(2, 1fr); }
        .agua-history-grid { grid-template-columns: repeat(4, 1fr); }
      }

      @media (max-width: 480px) {
        .agua-header { padding: 18px; }
        .agua-body { padding: 18px; }
        .agua-header h2 { font-size: 21px; }
        .agua-percent { min-width: 72px; }
        .agua-actions { grid-template-columns: 1fr 1fr; }
        .agua-values strong { font-size: 27px; }
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    const app = document.getElementById("agua-app");
    if (!app) return;

    const day = getDay();
    const total = Number(day.total) || 0;
    const goal = Number(state.goal) || DEFAULT_GOAL;
    const percent = clampPercent(total, goal);
    const reached = total >= goal;

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7.push({
        key,
        total: Number(state.days[key]?.total || 0),
        date: d
      });
    }

    const entries = [...day.entries].reverse();

    app.innerHTML = `
      <section class="agua-card" aria-label="Controle de hidratação">
        <header class="agua-header">
          <div class="agua-title-wrap">
            <div class="agua-icon">💧</div>
            <div>
              <h2>Hidratação diária</h2>
              <p>Acompanhe sua ingestão de água ao longo do dia.</p>
            </div>
          </div>
          <div class="agua-percent">
            <strong>${percent}%</strong>
            <span>${reached ? "Meta atingida" : "do objetivo"}</span>
          </div>
        </header>

        <div class="agua-body">
          <div class="agua-summary">
            <div>
              <div class="agua-values">
                <strong>${formatLiters(total)}</strong>
                <span>de ${formatLiters(goal)}</span>
              </div>
              <div class="agua-progress" role="progressbar"
                   aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(total, goal)}">
                <div class="agua-progress-bar" style="width:${percent}%"></div>
              </div>
            </div>
            <div class="agua-goal">
              <span>Meta diária</span>
              <strong>${formatMl(goal)}</strong>
            </div>
          </div>

          <div class="agua-actions">
            ${PORTIONS.map(v => `
              <button class="agua-btn" data-add="${v}">+ ${v} ml</button>
            `).join("")}
          </div>

          <div class="agua-lower">
            <div class="agua-panel">
              <h3>🕘 Registros de hoje</h3>
              <div class="agua-entry-list">
                ${
                  entries.length
                    ? entries.map((entry, index) => `
                      <div class="agua-entry">
                        <span>💧 <strong>${formatMl(entry.amount)}</strong> — ${formatTime(entry.time)}</span>
                        <button data-remove="${day.entries.length - 1 - index}" title="Remover registro">Remover</button>
                      </div>
                    `).join("")
                    : `<div class="agua-empty">Nenhum registro hoje. Adicione seu primeiro copo.</div>`
                }
              </div>
            </div>

            <div class="agua-panel">
              <h3>⚙️ Configuração</h3>
              <div class="agua-settings">
                <div>
                  <label for="agua-goal-input">Meta diária (ml)</label>
                  <input id="agua-goal-input" type="number" min="500" max="10000" step="100" value="${escapeHtml(goal)}">
                </div>

                <div class="agua-setting-row">
                  <button class="agua-secondary" id="agua-save-goal">Salvar meta</button>
                  <button class="agua-danger" id="agua-reset-day">Zerar hoje</button>
                </div>

                <div>
                  <button class="agua-secondary" id="agua-export">Exportar histórico</button>
                </div>
              </div>
            </div>
          </div>

          <div class="agua-panel agua-history">
            <h3>📅 Últimos 7 dias</h3>
            <div class="agua-history-grid">
              ${last7.map(item => {
                const isToday = item.key === todayKey();
                const dayPercent = clampPercent(item.total, goal);
                return `
                  <div class="agua-day ${isToday ? "today" : ""}">
                    <small>${isToday ? "Hoje" : item.date.toLocaleDateString("pt-BR", {weekday:"short"})}</small>
                    <strong>${formatLiters(item.total)}</strong>
                    <span style="font-size:11px;color:#71817a">${dayPercent}%</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="agua-note">
            💡 A meta mostrada é um parâmetro configurável do aplicativo. Necessidades de hidratação
            podem variar conforme pessoa, clima, atividade física e orientação profissional.
          </div>
        </div>
      </section>
    `;

    app.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const amount = Number(btn.dataset.add);
        const current = getDay();
        current.total += amount;
        current.entries.push({
          amount,
          time: new Date().toISOString()
        });
        saveState();
        render();
      });
    });

    app.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.remove);
        const current = getDay();
        if (Number.isInteger(index) && current.entries[index]) {
          current.total = Math.max(0, current.total - Number(current.entries[index].amount || 0));
          current.entries.splice(index, 1);
          saveState();
          render();
        }
      });
    });

    const saveGoal = app.querySelector("#agua-save-goal");
    saveGoal?.addEventListener("click", () => {
      const input = app.querySelector("#agua-goal-input");
      const value = Math.round(Number(input.value) || DEFAULT_GOAL);
      state.goal = Math.min(10000, Math.max(500, value));
      saveState();
      render();
    });

    app.querySelector("#agua-reset-day")?.addEventListener("click", () => {
      if (!confirm("Zerar todos os registros de água de hoje?")) return;
      state.days[todayKey()] = { total: 0, entries: [] };
      saveState();
      render();
    });

    app.querySelector("#agua-export")?.addEventListener("click", exportHistory);
  }

  function exportHistory() {
    const payload = {
      aplicativo: "Plano Alimentar Interativo",
      exportadoEm: new Date().toISOString(),
      metaDiariaMl: state.goal,
      historico: state.days
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-hidratacao-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function mount() {
    if (document.getElementById("agua-app")) return;

    ensureStyles();

    const app = document.createElement("div");
    app.id = "agua-app";

    /*
      O bloco é colocado no início do conteúdo principal para ficar
      visível sem depender de um elemento específico do index.html.
    */
    const main =
      document.querySelector("main") ||
      document.querySelector(".wrap") ||
      document.body;

    if (main === document.body) {
      const first = document.body.firstElementChild;
      document.body.insertBefore(app, first || null);
    } else {
      main.prepend(app);
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.PlanoAlimentarAgua = {
    adicionar: function (ml) {
      const amount = Number(ml);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const day = getDay();
      day.total += amount;
      day.entries.push({ amount, time: new Date().toISOString() });
      saveState();
      render();
    },
    obterHoje: function () {
      return JSON.parse(JSON.stringify(getDay()));
    },
    obterMeta: function () {
      return state.goal;
    },
    redefinirHoje: function () {
      state.days[todayKey()] = { total: 0, entries: [] };
      saveState();
      render();
    }
  };
})();
