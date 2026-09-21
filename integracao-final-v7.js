/* INTEGRAÇÃO FINAL V7 — horários do plano + metas do dashboard
   Camada leve e segura: não substitui módulos existentes.
*/
(() => {
  "use strict";

  const EDITOR_KEY = "planoAlimentar_editorPlano_v4";
  const GOALS_KEY = "planoAlimentar_dashboard_metas_v1";
  const WATER_KEY = "planoAlimentar_hidratacao_v1";
  const ACTIVITY_KEY = "planoAlimentar_atividade_v1";
  const PROFILE_KEY = "planoAlimentar_perfil_v1";
  const DEFAULTS = {
    cafe: { title: "Café da manhã", time: "07:30", icon: "☀️" },
    almoco: { title: "Almoço", time: "12:00", icon: "🍽️" },
    lanche: { title: "Lanche da tarde", time: "15:00", icon: "🍎" },
    jantar: { title: "Jantar", time: "20:00", icon: "🌙" },
    opcao: { title: "Opção de jantar", time: "20:00", icon: "🍳" },
    whey: { title: "Lanche com whey", time: "20:00", icon: "🥛" }
  };

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  };

  function editorState() {
    const state = read(EDITOR_KEY, {});
    return state && typeof state === "object" ? state : {};
  }

  function mealData(id) {
    const edited = editorState().meals?.[id];
    const base = DEFAULTS[id];
    if (!base) return null;
    return {
      title: String(edited?.title || base.title),
      time: String(edited?.time || base.time).match(/\d{2}:\d{2}/)?.[0] || base.time,
      icon: String(edited?.icon || base.icon)
    };
  }

  function syncPlanTimes() {
    const nav = document.getElementById("nav");
    const ids = Object.keys(DEFAULTS);

    ids.forEach((id, index) => {
      const m = mealData(id);
      if (!m) return;
      const section = document.getElementById(id);
      if (section) {
        const time = section.querySelector(".time");
        const title = section.querySelector(".meal-head h2");
        if (time) time.textContent = m.time;
        if (title) title.textContent = m.title;
      }

      if (nav) {
        const button = nav.querySelectorAll("button")[index + 1];
        if (button) button.textContent = `${m.icon} ${m.time} — ${m.title}`;
      }
    });

    // Reenvia um evento para módulos que acompanham o plano.
    window.dispatchEvent(new CustomEvent("planoAlimentar:horariosSincronizados"));
  }

  function goalValues() {
    const goals = read(GOALS_KEY, {});
    const water = read(WATER_KEY, { goal: 2500 });
    const activity = read(ACTIVITY_KEY, { goal: 30 });
    const profile = read(PROFILE_KEY, {});
    return {
      water: Number(goals.water ?? water.goal ?? 2500),
      activity: Number(goals.activity ?? activity.goal ?? 30),
      weight: Number(goals.weight ?? profile.pesoMeta ?? 0),
      checklist: Number(goals.checklist ?? 100)
    };
  }

  function ensureDashboardGoals() {
    const root = document.getElementById("dashboardProgressao");
    if (!root) return;

    // O dashboard oficial já possui este módulo. Só recuperamos se alguma
    // versão/camada antiga tiver removido a área de metas.
    if (root.querySelector(".dp4goals")) {
      if (!root.dataset.range) root.dataset.range = "7";
      return;
    }

    const body = root.querySelector(".dp4body");
    if (!body) return;

    const goals = goalValues();
    const wrap = document.createElement("div");
    wrap.className = "dp4goals dp4goals-recovery";
    wrap.innerHTML = `
      <div class="dp4goal"><b>💧 Água</b><strong>${goals.water || 0} ml/dia</strong></div>
      <div class="dp4goal"><b>🏃 Atividade</b><strong>${goals.activity || 0} min/dia</strong></div>
      <div class="dp4goal"><b>⚖️ Peso</b><strong>${goals.weight || "—"} kg</strong></div>
      <div class="dp4goal"><b>☑️ Checklist</b><strong>${goals.checklist || 100}%</strong></div>`;

    const heading = body.querySelector("h3");
    if (heading) heading.insertAdjacentElement("afterend", wrap);
    else body.prepend(wrap);
  }

  function forceDashboard7Days() {
    const root = document.getElementById("dashboardProgressao");
    if (!root) return;
    if (!root.dataset.range) root.dataset.range = "7";
    const btn = root.querySelector('[data-range="7"]');
    if (btn && !btn.classList.contains("on")) btn.click();
  }

  function run() {
    syncPlanTimes();
    ensureDashboardGoals();
    forceDashboard7Days();
  }

  function start() {
    run();
    setTimeout(run, 400);
    setTimeout(run, 1200);
    setInterval(run, 1500);
    window.addEventListener("storage", run);
    window.addEventListener("planoAlimentar:planoAtualizado", run);
    window.addEventListener("planoAlimentar:backupRestaurado", () => setTimeout(run, 300));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
