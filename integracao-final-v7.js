/* INTEGRAÇÃO FINAL V7 — horários do plano + metas do dashboard
   Correção V8:
   - sincroniza horário sem apagar o ícone do cabeçalho;
   - evita escrita repetitiva no DOM quando nada mudou;
   - mantém as substituições funcionando por delegação de eventos;
   - modal de substituições recebe prioridade visual;
   - preserva as integrações de metas e horários.
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
    const editedTime = String(edited?.time || base.time).match(/\d{2}:\d{2}/)?.[0];
    return {
      title: String(edited?.title || base.title),
      time: editedTime || base.time,
      icon: String(edited?.icon || base.icon)
    };
  }

  function syncPlanTimes() {
    const nav = document.getElementById("nav");
    const ids = Object.keys(DEFAULTS);
    let changed = false;

    ids.forEach((id, index) => {
      const m = mealData(id);
      if (!m) return;

      const section = document.getElementById(id);
      if (section) {
        const time = section.querySelector(".time");
        const title = section.querySelector(".meal-head h2");

        // IMPORTANTE: o ícone faz parte do mesmo elemento .time.
        // A versão anterior escrevia apenas m.time e apagava o ícone
        // a cada ciclo de sincronização.
        const expectedTime = `${m.icon} ${m.time}`;
        if (time && time.textContent !== expectedTime) {
          time.textContent = expectedTime;
          changed = true;
        }
        if (title && title.textContent !== m.title) {
          title.textContent = m.title;
          changed = true;
        }
      }

      if (nav) {
        const button = nav.querySelectorAll("button")[index + 1];
        const expectedNav = `${m.icon} ${m.time} — ${m.title}`;
        if (button && button.textContent !== expectedNav) {
          button.textContent = expectedNav;
          changed = true;
        }
      }
    });

    // Só dispara o evento quando houve uma alteração real.
    if (changed) {
      window.dispatchEvent(new CustomEvent("planoAlimentar:horariosSincronizados"));
    }
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

  function parseSubstitutions(button) {
    const raw = button?.getAttribute("data-subs") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      // Fallback defensivo para dados antigos eventualmente mal codificados.
      return raw
        .replace(/^\[|\]$/g, "")
        .split(/\s*,\s*/)
        .map(v => v.replace(/^['\"]|['\"]$/g, "").trim())
        .filter(Boolean);
    }
  }

  function openSubstitutionModal(button) {
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");
    if (!modal || !title || !body) return false;

    const subs = parseSubstitutions(button);
    if (!subs.length) return false;

    title.textContent = "Opções de substituição";
    body.replaceChildren();
    subs.forEach(sub => {
      const item = document.createElement("div");
      item.className = "subitem";
      item.textContent = `• ${sub}`;
      body.appendChild(item);
    });
    modal.classList.add("show");
    document.body.classList.add("substitution-modal-open");
    return true;
  }

  function installSubstitutionFix() {
    if (window.__substitutionFixV8Installed) return;
    window.__substitutionFixV8Installed = true;

    // API global robusta para compatibilidade com os onclick existentes.
    window.showSubs = openSubstitutionModal;
    window.closeModal = function () {
      const modal = document.getElementById("modal");
      if (modal) modal.classList.remove("show");
      document.body.classList.remove("substitution-modal-open");
    };

    // Delegação em capture: continua funcionando mesmo se algum módulo
    // reconstruir um card ou botão posteriormente.
    document.addEventListener("click", event => {
      const button = event.target?.closest?.("button.swap");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      openSubstitutionModal(button);
    }, true);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") window.closeModal();
    });

    const styleId = "substitution-fix-v8-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        #modal{z-index:9999!important;pointer-events:none}
        #modal.show{display:flex!important;pointer-events:auto!important}
        #modal .modal-box{position:relative;z-index:10000}
        body.substitution-modal-open{overflow:hidden}
      `;
      document.head.appendChild(style);
    }
  }

  function run() {
    syncPlanTimes();
    ensureDashboardGoals();
    forceDashboard7Days();
    installSubstitutionFix();
  }

  function start() {
    run();
    setTimeout(run, 400);
    setTimeout(run, 1200);

    // A atualização continua existindo para refletir alterações feitas pelo
    // editor, mas agora não reescreve o DOM quando nada mudou.
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
