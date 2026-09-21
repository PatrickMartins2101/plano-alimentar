/* ROTINA DIÁRIA — reset visual e sincronização à meia-noite */
(() => {
  "use strict";

  const dateKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  let ultimoDia = dateKey();

  function atualizarAtividade() {
    const raw = localStorage.getItem("planoAlimentar_atividade_v1");
    let state = {};
    try { state = raw ? JSON.parse(raw) : {}; } catch { state = {}; }
    const meta = Number(state.goal) || 30;
    const hoje = dateKey();
    const total = (Array.isArray(state.records) ? state.records : [])
      .filter(r => r.date === hoje)
      .reduce((s, r) => s + Number(r.minutes || 0), 0);
    const pct = Math.min(100, Math.round(total / meta * 100));
    const totalEl = document.getElementById("atividade-total");
    const goalEl = document.getElementById("atividade-goal-label");
    const pctEl = document.getElementById("atividade-percent");
    const countEl = document.getElementById("atividade-count");
    const bar = document.getElementById("atividade-bar");
    if (totalEl) totalEl.textContent = `${total} min`;
    if (goalEl) goalEl.textContent = `${meta} min`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (countEl) countEl.textContent = `${total} / ${meta} min`;
    if (bar) bar.style.width = `${pct}%`;
    const list = document.getElementById("atividade-list");
    if (list) {
      const records = (Array.isArray(state.records) ? state.records : [])
        .filter(r => r.date === hoje)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      list.innerHTML = records.length
        ? records.map(r => `<div class="atividade-item"><div class="atividade-item-main"><strong>${String(r.name || "Atividade") } — ${Number(r.minutes || 0)} min</strong><small>${String(r.intensity || "")} · ${new Date(r.createdAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</small></div></div>`).join("")
        : `<div class="atividade-empty">Nenhum treino registrado hoje.</div>`;
    }
  }

  function novoDia() {
    const agora = dateKey();
    if (agora === ultimoDia) return;
    ultimoDia = agora;
    window.dispatchEvent(new CustomEvent("planoAlimentar:novoDia", { detail: { data: agora } }));
    atualizarAtividade();
  }

  function agendar() {
    const agora = new Date();
    const proxima = new Date(agora);
    proxima.setHours(24, 0, 0, 0);
    setTimeout(() => { novoDia(); agendar(); }, Math.max(1000, proxima.getTime() - agora.getTime() + 250));
  }

  window.PlanoAlimentarDia = { hoje: dateKey, verificar: novoDia };
  setInterval(novoDia, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) novoDia(); });
  window.addEventListener("focus", novoDia);
  agendar();
})();
