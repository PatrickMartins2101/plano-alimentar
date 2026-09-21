/* MELHORIAS DIÁRIAS V4 — Plano Alimentar
   Correções incrementais sem remover módulos existentes:
   1) metas/progresso por dia local, com virada à meia-noite;
   2) horários sincronizados em plano, navegação e checklist;
   3) dashboard inicia em 7 dias e fica mais legível;
   4) fotos aceitam galeria/arquivo do dispositivo;
   5) checklist e atividade acompanham corretamente o novo dia.
*/
(() => {
  "use strict";

  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const WATER_MIGRATION_KEY = "planoAlimentar_hidratacao_local_v2";
  const CHECK_KEY = "planoAlimentar_checklist_v2";
  const OLD_CHECK_KEY = "planoAlimentar_v2";
  const EDITOR_KEY = "planoAlimentar_editorPlano_v4";
  const DASH_KEY = "planoAlimentar_dashboard_metas_v1";

  const MEALS = [
    { id: "cafe", title: "Café da manhã", time: "07:30", icon: "☀️", check: "cafe" },
    { id: "almoco", title: "Almoço", time: "12:00", icon: "🍽️", check: "almoco" },
    { id: "lanche", title: "Lanche da tarde", time: "15:00", icon: "🍎", check: "lanche" },
    { id: "jantar", title: "Jantar", time: "20:00", icon: "🌙", check: "jantar" },
    { id: "opcao", title: "Opção de jantar", time: "20:00", icon: "🍳" },
    { id: "whey", title: "Lanche com whey", time: "20:00", icon: "🥛" }
  ];

  const CHECK_ITEMS = ["cafe", "almoco", "lanche", "jantar", "plano", "atividade"];
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));

  function localKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn("Falha ao salvar", key, e); }
  }

  function emptyWaterDay() { return { total: 0, entries: [] }; }

  function ensureWaterMigration() {
    const state = readJSON(WATER_KEY, { goal: 2500, days: {}, settings: {} });
    state.days = state.days && typeof state.days === "object" ? state.days : {};
    const today = localKey();
    const marker = localStorage.getItem(WATER_MIGRATION_KEY);

    if (!marker) {
      const utcToday = new Date().toISOString().slice(0, 10);
      const candidate = state.days[today] || (utcToday !== today ? state.days[utcToday] : null) || emptyWaterDay();
      state.days[today] = {
        total: Number(candidate.total || 0),
        entries: Array.isArray(candidate.entries) ? candidate.entries : []
      };
      writeJSON(WATER_KEY, state);
      localStorage.setItem(WATER_MIGRATION_KEY, today);
    } else if (marker !== today) {
      state.days[today] = emptyWaterDay();
      writeJSON(WATER_KEY, state);
      localStorage.setItem(WATER_MIGRATION_KEY, today);
    }

    return state;
  }

  function waterState() {
    const state = ensureWaterMigration();
    state.days = state.days || {};
    if (!state.days[localKey()]) state.days[localKey()] = emptyWaterDay();
    return state;
  }

  function waterDay() {
    const state = waterState();
    const key = localKey();
    if (!Array.isArray(state.days[key].entries)) state.days[key].entries = [];
    return state.days[key];
  }

  function waterPercent(total, goal) {
    return goal > 0 ? Math.min(100, Math.round((Number(total || 0) / goal) * 100)) : 0;
  }

  function formatMl(value) { return `${Number(value || 0).toLocaleString("pt-BR")} ml`; }
  function formatL(value) { return `${(Number(value || 0) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L`; }

  function ensureWaterUI() {
    const app = document.getElementById("agua-app");
    if (!app || app.dataset.dailyFix === "1") return;
    app.dataset.dailyFix = "1";
    app.innerHTML = `
      <section class="agua-card agua-card-v4" aria-label="Controle de hidratação">
        <header class="agua-header">
          <div class="agua-title-wrap"><div class="agua-icon">💧</div><div><h2>Hidratação diária</h2><p>Acompanhe sua ingestão de água ao longo do dia.</p></div></div>
          <div class="agua-percent"><strong id="v4-water-percent">0%</strong><span id="v4-water-status">do objetivo</span></div>
        </header>
        <div class="agua-body">
          <div class="agua-summary"><div><div class="agua-values"><strong id="v4-water-total">0 L</strong><span id="v4-water-goal-text">de 2,5 L</span></div><div class="agua-progress"><div id="v4-water-bar" class="agua-progress-bar"></div></div></div><div class="agua-goal"><span>Meta diária</span><strong id="v4-water-goal">2.500 ml</strong></div></div>
          <div class="agua-actions">${[200,250,300,500,750].map(v => `<button class="agua-btn" data-v4-water-add="${v}">+ ${v} ml</button>`).join("")}</div>
          <div class="agua-lower">
            <div class="agua-panel"><h3>🕘 Registros de hoje</h3><div id="v4-water-entries" class="agua-entry-list"></div></div>
            <div class="agua-panel"><h3>⚙️ Configuração</h3><div class="agua-settings"><div><label for="v4-water-goal-input">Meta diária (ml)</label><input id="v4-water-goal-input" type="number" min="500" max="10000" step="100"></div><div class="agua-setting-row"><button class="agua-secondary" id="v4-water-save-goal">Salvar meta</button><button class="agua-danger" id="v4-water-reset">Zerar hoje</button></div><div><button class="agua-secondary" id="v4-water-export">Exportar histórico</button></div></div></div>
          </div>
          <div class="agua-panel agua-history"><h3>📅 Últimos 7 dias</h3><div id="v4-water-history" class="agua-history-grid"></div></div>
          <div class="agua-note">💡 A meta é configurável e o progresso é separado por dia. A virada acontece à meia-noite do horário local do dispositivo.</div>
        </div>
      </section>`;

    app.querySelectorAll("[data-v4-water-add]").forEach(button => button.addEventListener("click", () => {
      const amount = Number(button.dataset.v4WaterAdd);
      const state = waterState();
      const day = waterDay();
      day.total += amount;
      day.entries.push({ amount, time: new Date().toISOString() });
      writeJSON(WATER_KEY, state);
      renderWater();
      window.dispatchEvent(new CustomEvent("planoAlimentar:aguaAtualizada"));
    }));

    document.getElementById("v4-water-save-goal").addEventListener("click", () => {
      const state = waterState();
      const value = Math.min(10000, Math.max(500, Math.round(Number(document.getElementById("v4-water-goal-input").value) || 2500)));
      state.goal = value;
      writeJSON(WATER_KEY, state);
      renderWater();
      window.dispatchEvent(new CustomEvent("planoAlimentar:aguaAtualizada"));
    });

    document.getElementById("v4-water-reset").addEventListener("click", () => {
      if (!confirm("Zerar todos os registros de água de hoje?")) return;
      const state = waterState();
      state.days[localKey()] = emptyWaterDay();
      writeJSON(WATER_KEY, state);
      renderWater();
      window.dispatchEvent(new CustomEvent("planoAlimentar:aguaAtualizada"));
    });

    document.getElementById("v4-water-export").addEventListener("click", () => {
      const state = waterState();
      const blob = new Blob([JSON.stringify({ aplicativo: "Plano Alimentar Interativo", exportadoEm: new Date().toISOString(), metaDiariaMl: state.goal, historico: state.days }, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historico-hidratacao-${localKey()}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }

  function renderWater() {
    const app = document.getElementById("agua-app");
    if (!app) return;
    ensureWaterUI();
    const state = waterState();
    const day = waterDay();
    const goal = Number(state.goal || 2500);
    const pct = waterPercent(day.total, goal);
    const percentEl = document.getElementById("v4-water-percent");
    const statusEl = document.getElementById("v4-water-status");
    const totalEl = document.getElementById("v4-water-total");
    const goalText = document.getElementById("v4-water-goal-text");
    const goalEl = document.getElementById("v4-water-goal");
    const input = document.getElementById("v4-water-goal-input");
    const bar = document.getElementById("v4-water-bar");
    if (!percentEl) return;
    percentEl.textContent = `${pct}%`;
    statusEl.textContent = day.total >= goal ? "Meta atingida" : "do objetivo";
    totalEl.textContent = formatL(day.total);
    goalText.textContent = `de ${formatL(goal)}`;
    goalEl.textContent = formatMl(goal);
    input.value = goal;
    bar.style.width = `${pct}%`;

    const entries = [...day.entries].reverse();
    const entriesEl = document.getElementById("v4-water-entries");
    entriesEl.innerHTML = entries.length ? entries.map((entry, reverseIndex) => {
      const index = day.entries.length - 1 - reverseIndex;
      const time = new Date(entry.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `<div class="agua-entry"><span>💧 <strong>${formatMl(entry.amount)}</strong> — ${time}</span><button type="button" data-v4-water-remove="${index}">Remover</button></div>`;
    }).join("") : `<div class="agua-empty">Nenhum registro hoje. Adicione seu primeiro copo.</div>`;
    entriesEl.querySelectorAll("[data-v4-water-remove]").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.v4WaterRemove);
      const stateNow = waterState();
      const today = waterDay();
      if (!today.entries[index]) return;
      today.total = Math.max(0, today.total - Number(today.entries[index].amount || 0));
      today.entries.splice(index, 1);
      writeJSON(WATER_KEY, stateNow);
      renderWater();
      window.dispatchEvent(new CustomEvent("planoAlimentar:aguaAtualizada"));
    }));

    const history = document.getElementById("v4-water-history");
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - i);
      const key = localKey(d);
      const total = Number(state.days[key]?.total || 0);
      const isToday = key === localKey();
      cards.push(`<div class="agua-day ${isToday ? "today" : ""}"><small>${isToday ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" })}</small><strong>${formatL(total)}</strong><span style="font-size:11px;color:#71817a">${waterPercent(total, goal)}%</span></div>`);
    }
    history.innerHTML = cards.join("");
  }

  function overrideWaterAPI() {
    window.PlanoAlimentarAgua = {
      adicionar(ml) {
        const amount = Number(ml); if (!Number.isFinite(amount) || amount <= 0) return;
        const state = waterState(), day = waterDay();
        day.total += amount; day.entries.push({ amount, time: new Date().toISOString() });
        writeJSON(WATER_KEY, state); renderWater();
      },
      obterHoje() { return clone(waterDay()); },
      obterMeta() { return Number(waterState().goal || 2500); },
      redefinirHoje() { const state = waterState(); state.days[localKey()] = emptyWaterDay(); writeJSON(WATER_KEY, state); renderWater(); }
    };
  }

  function syncMealTimes() {
    const state = readJSON(EDITOR_KEY, { meals: {} });
    const overrides = state.meals && typeof state.meals === "object" ? state.meals : {};
    const effective = MEALS.map(base => ({ ...base, ...(overrides[base.id] || {}) }));

    effective.forEach(meal => {
      const section = document.getElementById(meal.id);
      if (section) {
        const title = section.querySelector("h2");
        const time = section.querySelector(".time");
        if (title && meal.title) title.textContent = meal.title;
        if (time && meal.time) time.textContent = `${meal.icon || baseIcon(meal.id)} ${meal.time}`;
      }
      if (meal.check) {
        const item = document.querySelector(`#checklistDiarioV2 [data-check="${meal.check}"]`);
        const detail = item?.querySelector(".cd-time");
        if (detail) detail.textContent = meal.time || "Hoje";
      }
    });

    const nav = document.getElementById("nav");
    const buttons = nav ? [...nav.querySelectorAll("button")].slice(1) : [];
    effective.forEach((meal, index) => {
      if (buttons[index]) buttons[index].textContent = `${meal.icon || baseIcon(meal.id)} ${meal.time || "—"} — ${meal.title}`;
    });
  }

  function baseIcon(id) { return MEALS.find(m => m.id === id)?.icon || "🍽️"; }

  function ensureChecklist() {
    const today = localKey();
    let state = readJSON(CHECK_KEY, { data: today, itens: {} });
    if (state.data !== today) state = { data: today, itens: {} };
    state.itens = state.itens && typeof state.itens === "object" ? state.itens : {};
    CHECK_ITEMS.forEach(id => { if (typeof state.itens[id] !== "boolean") state.itens[id] = false; });
    writeJSON(CHECK_KEY, state);

    let old = readJSON(OLD_CHECK_KEY, {});
    old.checklists = old.checklists && typeof old.checklists === "object" ? old.checklists : {};
    old.checklists[today] = old.checklists[today] && typeof old.checklists[today] === "object" ? old.checklists[today] : {};
    CHECK_ITEMS.forEach(id => { if (typeof old.checklists[today][id] !== "boolean") old.checklists[today][id] = state.itens[id]; });
    writeJSON(OLD_CHECK_KEY, old);
    return state;
  }

  function refreshChecklistDOM() {
    const state = ensureChecklist();
    const done = CHECK_ITEMS.filter(id => state.itens[id]).length;
    const pct = Math.round(done / CHECK_ITEMS.length * 100);
    const percent = document.getElementById("cdPercent");
    const count = document.getElementById("cdCount");
    const bar = document.getElementById("cdBar");
    if (percent) percent.textContent = `${pct}%`;
    if (count) count.textContent = `${done}/${CHECK_ITEMS.length}`;
    if (bar) bar.style.width = `${pct}%`;
    CHECK_ITEMS.forEach(id => {
      const item = document.querySelector(`#checklistDiarioV2 [data-check="${id}"]`);
      if (!item) return;
      const isDone = !!state.itens[id];
      item.classList.toggle("done", isDone);
      item.setAttribute("aria-pressed", isDone ? "true" : "false");
    });
  }

  function refreshActivityDOM() {
    const list = document.getElementById("atividade-list");
    const total = document.getElementById("atividade-total");
    const percent = document.getElementById("atividade-percent");
    const count = document.getElementById("atividade-count");
    const bar = document.getElementById("atividade-bar");
    const goal = Number(readJSON("planoAlimentar_atividade_v1", { goal: 30 }).goal || 30);
    if (list) list.innerHTML = `<div class="atividade-empty">Nenhum treino registrado hoje.</div>`;
    if (total) total.textContent = "0 min";
    if (percent) percent.textContent = "0%";
    if (count) count.textContent = `0 / ${goal} min`;
    if (bar) bar.style.width = "0%";
  }

  function fixPhotoPicker() {
    const input = document.getElementById("f-file");
    if (!input) return;
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.setAttribute("title", "Escolha uma foto da galeria ou dos arquivos do dispositivo");
  }

  function fixDashboardDefault() {
    const root = document.getElementById("dashboardProgressao");
    if (!root || root.dataset.default7Applied === "1") return;
    const button = root.querySelector('[data-range="7"]');
    if (!button) return;
    root.dataset.default7Applied = "1";
    button.click();
    if (!document.getElementById("dashboard-v4-style")) {
      const style = document.createElement("style");
      style.id = "dashboard-v4-style";
      style.textContent = `#dashboardProgressao .dp3chart{height:190px}#dashboardProgressao .dp3panel{padding:13px}#dashboardProgressao .dp3note{line-height:1.45}@media(max-width:700px){#dashboardProgressao{padding:0 10px}#dashboardProgressao .dp3body{padding:14px}#dashboardProgressao .dp3chart{height:175px}}`;
      document.head.appendChild(style);
    }
  }

  function applyDailyRollover() {
    const today = localKey();
    const marker = localStorage.getItem("planoAlimentar_diaAtual_v4");
    if (marker !== today) {
      localStorage.setItem("planoAlimentar_diaAtual_v4", today);
      const state = readJSON(WATER_KEY, { goal: 2500, days: {}, settings: {} });
      state.days = state.days || {};
      state.days[today] = emptyWaterDay();
      writeJSON(WATER_KEY, state);
      localStorage.setItem(WATER_MIGRATION_KEY, today);
      ensureChecklist();
      window.dispatchEvent(new CustomEvent("planoAlimentar:novoDia", { detail: { date: today } }));
    } else {
      ensureChecklist();
    }
    renderWater();
    refreshChecklistDOM();
    refreshActivityDOM();
    syncMealTimes();
    fixPhotoPicker();
    fixDashboardDefault();
  }

  function installStyles() {
    if (document.getElementById("melhorias-v4-style")) return;
    const style = document.createElement("style");
    style.id = "melhorias-v4-style";
    style.textContent = `#agua-app .agua-card-v4{margin:0}#agua-app .agua-note{line-height:1.5}#f-file{cursor:pointer}`;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    ensureWaterMigration();
    applyDailyRollover();
    overrideWaterAPI();

    setInterval(() => {
      const today = localKey();
      const marker = localStorage.getItem("planoAlimentar_diaAtual_v4");
      if (marker !== today) applyDailyRollover();
      else {
        syncMealTimes();
        fixPhotoPicker();
        fixDashboardDefault();
      }
    }, 1500);

    window.addEventListener("storage", event => {
      if ([EDITOR_KEY, WATER_KEY, CHECK_KEY].includes(event.key)) {
        setTimeout(() => { applyDailyRollover(); overrideWaterAPI(); }, 50);
      }
    });

    window.addEventListener("planoAlimentar:novoDia", () => {
      renderWater(); refreshChecklistDOM(); refreshActivityDOM(); syncMealTimes();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
