/* MELHORIAS DIÁRIAS V5 — correção integrada de rotina diária
   - Virada real à meia-noite no horário local do dispositivo.
   - Checklist começa novamente a cada novo dia.
   - Água fica separada por dia e zera no novo dia.
   - Horários editados são refletidos no plano, navegação e checklist.
   - Fotos podem ser escolhidas da galeria/arquivos do dispositivo.
   - Não altera o Dashboard V4.
*/
(() => {
  "use strict";

  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const WATER_MARKER = "planoAlimentar_water_day_v5";
  const CHECK_KEY = "planoAlimentar_checklist_v2";
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

  function localKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function emptyWaterDay() { return { total: 0, entries: [] }; }

  function resetDailyStoresIfNeeded() {
    const today = localKey();

    const water = read(WATER_KEY, { goal: 2500, days: {}, settings: {} });
    water.days = water.days && typeof water.days === "object" ? water.days : {};
    const marker = localStorage.getItem(WATER_MARKER);
    if (marker !== today) {
      if (!water.days[today]) water.days[today] = emptyWaterDay();
      else water.days[today] = { total: 0, entries: [] };
      write(WATER_KEY, water);
      localStorage.setItem(WATER_MARKER, today);
      window.dispatchEvent(new CustomEvent("planoAlimentar:diaMudou"));
    }

    const check = read(CHECK_KEY, {});
    if (check.data !== today) {
      write(CHECK_KEY, { data: today, itens: {} });
      window.dispatchEvent(new CustomEvent("planoAlimentar:checklistNovoDia"));
    }
  }

  function scheduleMidnightReset() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 1, 0);
    const delay = Math.max(1000, next.getTime() - now.getTime());
    setTimeout(() => {
      resetDailyStoresIfNeeded();
      // Recarregar uma única vez garante que módulos com estado em memória
      // (como o checklist) também iniciem o novo dia corretamente.
      location.reload();
    }, delay);
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
        if (detail) detail.textContent = meal.time || "Hoje";
      }
    });

    const nav = document.getElementById("nav");
    if (nav) {
      const buttons = [...nav.querySelectorAll("button")];
      effective.forEach((meal, index) => {
        const button = buttons[index + 1] || buttons[index];
        if (button) button.textContent = `${meal.icon || baseIcon(meal.id)} ${meal.time || "—"} — ${meal.title}`;
      });
    }

    // Também mantém o resumo/checklist textual que possa existir fora do módulo principal.
    document.querySelectorAll("[data-meal-time]").forEach(el => {
      const meal = effective.find(m => m.id === el.dataset.mealTime);
      if (meal) el.textContent = meal.time;
    });
  }

  function fixPhotoInput() {
    document.querySelectorAll('input[type="file"][accept*="image"]').forEach(input => {
      // Não usar capture: no Android isso pode forçar a câmera e esconder a galeria.
      input.removeAttribute("capture");
      input.setAttribute("accept", "image/*");
      input.setAttribute("title", "Escolha uma foto da galeria ou dos arquivos do dispositivo");
    });
  }

  function refreshDailyUI() {
    resetDailyStoresIfNeeded();
    fixPhotoInput();
    syncMealTimes();
  }

  function start() {
    refreshDailyUI();
    scheduleMidnightReset();

    // O editor salva no localStorage na mesma aba, então o evento storage não é suficiente.
    // A verificação curta garante que qualquer alteração de horário apareça em todos os pontos.
    setInterval(() => {
      refreshDailyUI();
    }, 1000);

    const observer = new MutationObserver(() => {
      fixPhotoInput();
      syncMealTimes();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
