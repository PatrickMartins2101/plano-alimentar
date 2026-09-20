/* ============================================================
   PLANO ALIMENTAR — MÓDULO DE ATIVIDADE FÍSICA
   Arquivo: atividade.js
   Versão: v2-progressao

   Recursos:
   - Meta diária de minutos
   - Registro de atividade, duração e intensidade
   - Histórico dos últimos 7 dias
   - Progresso diário
   - Edição/remoção de registros
   - Persistência em localStorage
   - Exportação do histórico em JSON
   - Interface criada automaticamente; não exige HTML adicional
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "planoAlimentar_atividade_v1";
  const DEFAULT_GOAL = 30;

  const state = loadState();

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        goal: Number(parsed?.goal) > 0 ? Number(parsed.goal) : DEFAULT_GOAL,
        records: Array.isArray(parsed?.records) ? parsed.records : []
      };
    } catch {
      return { goal: DEFAULT_GOAL, records: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function minutesToday() {
    const key = todayKey();
    return state.records
      .filter(r => r.date === key)
      .reduce((sum, r) => sum + Number(r.minutes || 0), 0);
  }

  function formatDate(dateKey) {
    const [y, m, d] = dateKey.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return "--:--";
    }
  }

  function injectStyles() {
    if (document.getElementById("atividade-module-style")) return;

    const style = document.createElement("style");
    style.id = "atividade-module-style";
    style.textContent = `
      .atividade-module {
        margin: 18px auto;
        max-width: 1200px;
        background: #fffdf8;
        border: 1px solid #d8d5c7;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 5px 18px rgba(23,53,45,.08);
        color: #17352d;
      }
      .atividade-head {
        padding: 20px 24px;
        background: linear-gradient(135deg,#176b52,#2d8a6a);
        color: white;
        display:flex;
        justify-content:space-between;
        gap:18px;
        align-items:center;
      }
      .atividade-title {
        margin:0;
        font-size:24px;
        font-weight:800;
      }
      .atividade-subtitle {
        margin:5px 0 0;
        opacity:.92;
        font-size:14px;
      }
      .atividade-badge {
        min-width:95px;
        text-align:center;
        background:rgba(255,255,255,.15);
        border-radius:14px;
        padding:10px 12px;
        font-weight:800;
      }
      .atividade-body { padding:20px 24px 24px; }
      .atividade-progress-row {
        display:flex;
        justify-content:space-between;
        align-items:end;
        gap:12px;
        margin-bottom:10px;
      }
      .atividade-big {
        font-size:28px;
        font-weight:900;
        color:#176b52;
      }
      .atividade-meta {
        font-size:13px;
        text-align:right;
        color:#60746c;
      }
      .atividade-progress {
        height:13px;
        background:#e8e5db;
        border-radius:999px;
        overflow:hidden;
        margin-bottom:18px;
      }
      .atividade-progress > div {
        height:100%;
        width:0;
        background:#176b52;
        border-radius:999px;
        transition:width .25s ease;
      }
      .atividade-grid {
        display:grid;
        grid-template-columns:1.25fr .75fr;
        gap:18px;
      }
      .atividade-card {
        border:1px solid #ddd9ca;
        border-radius:16px;
        padding:16px;
        background:#fff;
      }
      .atividade-card h3 {
        margin:0 0 14px;
        font-size:18px;
      }
      .atividade-form {
        display:grid;
        grid-template-columns:1.4fr .6fr .8fr auto;
        gap:10px;
        align-items:end;
      }
      .atividade-field label {
        display:block;
        font-size:12px;
        font-weight:800;
        margin-bottom:5px;
      }
      .atividade-field input,
      .atividade-field select {
        width:100%;
        border:1px solid #d6d2c5;
        border-radius:10px;
        padding:10px;
        box-sizing:border-box;
        background:white;
      }
      .atividade-btn {
        border:0;
        border-radius:10px;
        padding:11px 14px;
        cursor:pointer;
        font-weight:800;
      }
      .atividade-primary { background:#176b52; color:#fff; }
      .atividade-soft { background:#e7eee5; color:#176b52; }
      .atividade-danger { background:#f5e3de; color:#a13e2e; }
      .atividade-list {
        display:flex;
        flex-direction:column;
        gap:8px;
        max-height:300px;
        overflow:auto;
      }
      .atividade-item {
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:center;
        padding:11px;
        border:1px solid #e1ded3;
        border-radius:12px;
        background:#fffdf8;
      }
      .atividade-item-main strong { display:block; }
      .atividade-item-main small { color:#71827b; }
      .atividade-item-actions button {
        border:0;
        background:transparent;
        cursor:pointer;
        color:#a13e2e;
        font-weight:800;
      }
      .atividade-week {
        display:grid;
        grid-template-columns:repeat(7,1fr);
        gap:8px;
        margin-top:18px;
      }
      .atividade-day {
        background:#f1efe6;
        border-radius:12px;
        padding:10px 6px;
        text-align:center;
        border:1px solid transparent;
      }
      .atividade-day.today { border-color:#176b52; }
      .atividade-day strong { display:block; font-size:12px; }
      .atividade-day span { display:block; color:#176b52; font-weight:900; margin-top:5px; }
      .atividade-day small { color:#75857e; }
      .atividade-actions {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:14px;
      }
      .atividade-empty {
        color:#75857e;
        padding:10px 0;
      }
      @media (max-width: 850px) {
        .atividade-grid { grid-template-columns:1fr; }
        .atividade-form { grid-template-columns:1fr 1fr; }
        .atividade-form .atividade-add-wrap { grid-column:1 / -1; }
      }
      @media (max-width: 560px) {
        .atividade-head { padding:18px; }
        .atividade-body { padding:16px; }
        .atividade-title { font-size:20px; }
        .atividade-form { grid-template-columns:1fr; }
        .atividade-week { grid-template-columns:repeat(4,1fr); }
      }
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    if (document.getElementById("atividade-module")) return;

    injectStyles();

    const root = document.createElement("section");
    root.id = "atividade-module";
    root.className = "atividade-module";
    root.innerHTML = `
      <div class="atividade-head">
        <div>
          <h2 class="atividade-title">🏃 Atividade física</h2>
          <p class="atividade-subtitle">Registre seus treinos e acompanhe sua constância ao longo da semana.</p>
        </div>
        <div class="atividade-badge">
          <div id="atividade-percent">0%</div>
          <small id="atividade-count">0 / ${DEFAULT_GOAL} min</small>
        </div>
      </div>

      <div class="atividade-body">
        <div class="atividade-progress-row">
          <div><span class="atividade-big" id="atividade-total">0 min</span></div>
          <div class="atividade-meta">Meta diária<br><strong id="atividade-goal-label">${state.goal} min</strong></div>
        </div>
        <div class="atividade-progress"><div id="atividade-bar"></div></div>

        <div class="atividade-grid">
          <div class="atividade-card">
            <h3>➕ Registrar atividade</h3>
            <form class="atividade-form" id="atividade-form">
              <div class="atividade-field">
                <label for="atividade-name">Atividade</label>
                <input id="atividade-name" maxlength="60" placeholder="Ex.: caminhada" required>
              </div>
              <div class="atividade-field">
                <label for="atividade-minutes">Minutos</label>
                <input id="atividade-minutes" type="number" min="1" max="600" value="30" required>
              </div>
              <div class="atividade-field">
                <label for="atividade-intensity">Intensidade</label>
                <select id="atividade-intensity">
                  <option>Leve</option>
                  <option selected>Moderada</option>
                  <option>Intensa</option>
                </select>
              </div>
              <div class="atividade-add-wrap">
                <button class="atividade-btn atividade-primary" type="submit">Adicionar</button>
              </div>
            </form>

            <div class="atividade-actions">
              <button class="atividade-btn atividade-soft" id="atividade-save-goal">Salvar meta</button>
              <button class="atividade-btn atividade-danger" id="atividade-reset-day">Zerar hoje</button>
              <button class="atividade-btn atividade-soft" id="atividade-export">Exportar histórico</button>
              <label class="atividade-field" style="min-width:130px">
                <span style="font-size:12px;font-weight:800">Meta diária</span>
                <input id="atividade-goal" type="number" min="1" max="600" value="${state.goal}">
              </label>
            </div>
          </div>

          <div class="atividade-card">
            <h3>📋 Registros de hoje</h3>
            <div class="atividade-list" id="atividade-list"></div>
          </div>
        </div>

        <div class="atividade-card" style="margin-top:18px">
          <h3>📅 Últimos 7 dias</h3>
          <div class="atividade-week" id="atividade-week"></div>
        </div>
      </div>
    `;

    // Insere antes do rodapé, ou no final do body se não houver footer.
    const footer = document.querySelector("footer");
    if (footer) footer.parentNode.insertBefore(root, footer);
    else document.body.appendChild(root);

    bindEvents();
    render();
  }

  function bindEvents() {
    document.getElementById("atividade-form").addEventListener("submit", e => {
      e.preventDefault();

      const name = document.getElementById("atividade-name").value.trim();
      const minutes = Number(document.getElementById("atividade-minutes").value);
      const intensity = document.getElementById("atividade-intensity").value;

      if (!name || !Number.isFinite(minutes) || minutes < 1) return;

      state.records.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: todayKey(),
        createdAt: new Date().toISOString(),
        name,
        minutes,
        intensity
      });

      saveState();
      e.target.reset();
      document.getElementById("atividade-minutes").value = 30;
      document.getElementById("atividade-intensity").value = "Moderada";
      render();
    });

    document.getElementById("atividade-save-goal").addEventListener("click", () => {
      const goal = Number(document.getElementById("atividade-goal").value);
      if (!Number.isFinite(goal) || goal < 1) return;
      state.goal = Math.min(goal, 600);
      saveState();
      render();
    });

    document.getElementById("atividade-reset-day").addEventListener("click", () => {
      if (!confirm("Deseja apagar os registros de atividade de hoje?")) return;
      const key = todayKey();
      state.records = state.records.filter(r => r.date !== key);
      saveState();
      render();
    });

    document.getElementById("atividade-export").addEventListener("click", exportHistory);
  }

  function removeRecord(id) {
    state.records = state.records.filter(r => r.id !== id);
    saveState();
    render();
  }

  function renderToday() {
    const key = todayKey();
    const list = document.getElementById("atividade-list");
    const records = state.records
      .filter(r => r.date === key)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!records.length) {
      list.innerHTML = `<div class="atividade-empty">Nenhum treino registrado hoje.</div>`;
      return;
    }

    list.innerHTML = records.map(r => `
      <div class="atividade-item">
        <div class="atividade-item-main">
          <strong>${escapeHTML(r.name)} — ${r.minutes} min</strong>
          <small>${escapeHTML(r.intensity)} · ${formatTime(r.createdAt)}</small>
        </div>
        <div class="atividade-item-actions">
          <button type="button" data-remove="${escapeHTML(r.id)}">Excluir</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeRecord(btn.dataset.remove));
    });
  }

  function renderWeek() {
    const container = document.getElementById("atividade-week");
    const today = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setHours(12,0,0,0);
      d.setDate(today.getDate() - i);
      const key = todayKey(d);
      const total = state.records
        .filter(r => r.date === key)
        .reduce((sum, r) => sum + Number(r.minutes || 0), 0);

      const dayLabel = d.toLocaleDateString("pt-BR", { weekday:"short" }).replace(".", "");
      days.push(`
        <div class="atividade-day ${key === todayKey() ? "today" : ""}">
          <strong>${dayLabel}</strong>
          <span>${total} min</span>
          <small>${Math.min(100, Math.round(total / state.goal * 100))}%</small>
        </div>
      `);
    }

    container.innerHTML = days.join("");
  }

  function render() {
    const total = minutesToday();
    const percent = Math.min(100, Math.round(total / state.goal * 100));

    document.getElementById("atividade-total").textContent = `${total} min`;
    document.getElementById("atividade-goal-label").textContent = `${state.goal} min`;
    document.getElementById("atividade-percent").textContent = `${percent}%`;
    document.getElementById("atividade-count").textContent = `${total} / ${state.goal} min`;
    document.getElementById("atividade-bar").style.width = `${percent}%`;
    document.getElementById("atividade-goal").value = state.goal;

    renderToday();
    renderWeek();
  }

  function exportHistory() {
    const payload = {
      exportedAt: new Date().toISOString(),
      goalMinutes: state.goal,
      records: state.records
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atividade-fisica-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", buildUI, { once: true });
    } else {
      buildUI();
    }
  }

  init();
})();
