/* MELHORIAS DIÁRIAS V6 — estabilidade, virada diária, câmera/galeria e dashboard */
(() => {
  "use strict";

  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const WATER_MARKER = "planoAlimentar_water_day_v6";
  const CHECK_KEY = "planoAlimentar_checklist_v2";
  const CHECK_HISTORY_KEY = "planoAlimentar_checklist_historico_v1";
  const EDITOR_KEY = "planoAlimentar_editorPlano_v4";

  const MEALS = [
    { id: "cafe", title: "Café da manhã", time: "07:30", icon: "☀️", check: "cafe" },
    { id: "almoco", title: "Almoço", time: "12:00", icon: "🍽️", check: "almoco" },
    { id: "lanche", title: "Lanche da tarde", time: "15:00", icon: "🍎", check: "lanche" },
    { id: "jantar", title: "Jantar", time: "20:00", icon: "🌙", check: "jantar" },
    { id: "opcao", title: "Opção de jantar", time: "20:00", icon: "🍳" },
    { id: "whey", title: "Lanche com whey", time: "20:00", icon: "🥛" }
  ];

  const clone = v => JSON.parse(JSON.stringify(v));
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : clone(fallback); }
    catch { return clone(fallback); }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const localKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const emptyWaterDay = () => ({ total: 0, entries: [] });

  function checklistPct(state) {
    if (!state || !state.itens || typeof state.itens !== "object") return 0;
    const vals = Object.values(state.itens);
    return vals.length ? Math.round(vals.filter(Boolean).length / vals.length * 100) : 0;
  }

  function saveChecklistHistory(date, state) {
    if (!date || !state || state.data !== date) return;
    const history = read(CHECK_HISTORY_KEY, {});
    history[date] = checklistPct(state);
    write(CHECK_HISTORY_KEY, history);
  }

  function resetChecklistUI() {
    const root = document.getElementById("checklistDiarioV2");
    if (!root) return;
    root.querySelectorAll("[data-check]").forEach(el => {
      el.classList.remove("done");
      el.setAttribute("aria-pressed", "false");
      if (el.matches("input[type=checkbox]")) el.checked = false;
    });
    const p = root.querySelector("#cdPercent");
    const c = root.querySelector("#cdCount");
    const b = root.querySelector("#cdBar");
    if (p) p.textContent = "0%";
    if (c) c.textContent = "0/6";
    if (b) b.style.width = "0%";
  }

  function resetDailyStoresIfNeeded() {
    const today = localKey();
    let changed = false;
    const water = read(WATER_KEY, { goal: 2500, days: {}, settings: {} });
    water.days = water.days && typeof water.days === "object" ? water.days : {};
    const marker = localStorage.getItem(WATER_MARKER);
    if (!marker) {
      if (!water.days[today]) water.days[today] = emptyWaterDay();
      write(WATER_KEY, water);
      localStorage.setItem(WATER_MARKER, today);
    } else if (marker !== today) {
      water.days[today] = emptyWaterDay();
      write(WATER_KEY, water);
      localStorage.setItem(WATER_MARKER, today);
      changed = true;
    }

    const check = read(CHECK_KEY, { data: today, itens: {} });
    if (check.data !== today) {
      saveChecklistHistory(check.data, check);
      write(CHECK_KEY, { data: today, itens: {} });
      resetChecklistUI();
      changed = true;
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent("planoAlimentar:diaMudou", { detail: { data: today } }));
      window.dispatchEvent(new CustomEvent("planoAlimentar:checklistNovoDia", { detail: { data: today } }));
      window.dispatchEvent(new CustomEvent("planoAlimentar:dashboardAtualizar"));
    }
  }

  function scheduleMidnightReset() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 1, 0);
    window.setTimeout(() => {
      resetDailyStoresIfNeeded();
      refreshDailyUI();
      scheduleMidnightReset();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function getEditorState() {
    const x = read(EDITOR_KEY, { meals: {} });
    x.meals = x.meals && typeof x.meals === "object" ? x.meals : {};
    return x;
  }

  function baseIcon(id) { return MEALS.find(m => m.id === id)?.icon || "🍽️"; }

  function syncMealTimes() {
    const state = getEditorState();
    const effective = MEALS.map(base => ({ ...base, ...(state.meals[base.id] || {}) }));

    effective.forEach(meal => {
      const section = document.getElementById(meal.id);
      if (section) {
        const title = section.querySelector(".meal-head h2");
        const time = section.querySelector(".meal-head .time");
        if (title && meal.title) title.textContent = meal.title;
        if (time && meal.time) time.textContent = `${meal.icon || baseIcon(meal.id)} ${meal.time}`;
      }
      if (meal.check) {
        const item = document.querySelector(`#checklistDiarioV2 [data-check="${meal.check}"]`);
        const detail = item?.querySelector(".cd-time");
        if (detail && meal.time) detail.textContent = meal.time;
      }
    });

    const nav = document.getElementById("nav");
    if (nav) {
      const buttons = [...nav.querySelectorAll("button")];
      effective.forEach((meal, index) => {
        const button = buttons[index + 1] || buttons[index];
        const desired = `${meal.icon || baseIcon(meal.id)} ${meal.time || "—"} — ${meal.title}`;
        if (button) button.textContent = desired;
      });
    }
    document.querySelectorAll("[data-meal-time]").forEach(el => {
      const meal = effective.find(m => m.id === el.dataset.mealTime);
      if (meal && meal.time) el.textContent = meal.time;
    });
  }

  function fixPhotoInputs() {
    const camera = document.getElementById("f-camera");
    const gallery = document.getElementById("f-gallery");
    if (camera) {
      camera.setAttribute("type", "file");
      camera.setAttribute("accept", "image/*");
      camera.setAttribute("capture", "environment");
    }
    if (gallery) {
      gallery.setAttribute("type", "file");
      gallery.setAttribute("accept", "image/*");
      gallery.removeAttribute("capture");
    }
  }

  function patchCameraButton() {
    const btn = document.getElementById("f-camera-btn");
    const input = document.getElementById("f-camera");
    if (!btn || !input || btn.dataset.v6Bound) return;
    btn.dataset.v6Bound = "1";
    btn.addEventListener("click", () => {
      fixPhotoInputs();
      try {
        if (typeof input.showPicker === "function") input.showPicker();
        else input.click();
      } catch { input.click(); }
    }, true);
  }

  function refreshDailyUI() {
    resetDailyStoresIfNeeded();
    syncMealTimes();
    fixPhotoInputs();
    patchCameraButton();
    window.dispatchEvent(new CustomEvent("planoAlimentar:dashboardAtualizar"));
  }

  function start() {
    refreshDailyUI();
    scheduleMidnightReset();
    window.setInterval(refreshDailyUI, 2500);
    window.addEventListener("storage", refreshDailyUI);
    window.addEventListener("planoAlimentar:diaMudou", refreshDailyUI);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
