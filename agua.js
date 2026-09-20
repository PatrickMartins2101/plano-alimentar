/* =========================================================
   CONTROLE DE ÁGUA — Plano Alimentar v2
   Arquivo: agua.js
   Não altera o plano alimentar. Funciona de forma independente.
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "planoAlimentar_agua_v1";
  const DEFAULT_GOAL = 2000; // ml — valor inicial editável pelo usuário
  const STEP = 250;

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.date === todayKey()) {
        return {
          date: saved.date,
          goal: Number(saved.goal) || DEFAULT_GOAL,
          consumed: Math.max(0, Number(saved.consumed) || 0)
        };
      }
    } catch (_) {}
    return {
      date: todayKey(),
      goal: DEFAULT_GOAL,
      consumed: 0
    };
  }

  let data = loadData();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function formatMl(value) {
    return value >= 1000
      ? `${(value / 1000).toLocaleString("pt-BR", {
          minimumFractionDigits: value % 1000 === 0 ? 0 : 1,
          maximumFractionDigits: 2
        })} L`
      : `${value} ml`;
  }

  function createCard() {
    if (document.getElementById("aguaControle")) return;

    const card = document.createElement("section");
    card.id = "aguaControle";
    card.className = "agua-card";
    card.innerHTML = `
      <div class="agua-topo">
        <div>
          <div class="agua-titulo">💧 Controle de água</div>
          <div class="agua-subtitulo">Acompanhe sua hidratação ao longo do dia.</div>
        </div>
        <button type="button" class="agua-config" id="aguaConfig">
          Meta
        </button>
      </div>

      <div class="agua-resumo">
        <div class="agua-copo">
          <div class="agua-copo-icon">💧</div>
          <strong id="aguaConsumida">0 ml</strong>
          <span>consumidos</span>
        </div>

        <div class="agua-meta">
          <strong id="aguaMeta">2 L</strong>
          <span>meta diária</span>
        </div>

        <div class="agua-restante">
          <strong id="aguaRestante">2 L</strong>
          <span>restantes</span>
        </div>
      </div>

      <div class="agua-barra">
        <div id="aguaBarra" class="agua-barra-preenchida"></div>
      </div>

      <div class="agua-percentual" id="aguaPercentual">0%</div>

      <div class="agua-acoes">
        <button type="button" class="agua-btn agua-menos" id="aguaMenos">− 250 ml</button>
        <button type="button" class="agua-btn agua-add" id="aguaMais">+ 250 ml</button>
      </div>

      <div class="agua-atalhos">
        <button type="button" data-agua="500">+ 500 ml</button>
        <button type="button" data-agua="750">+ 750 ml</button>
        <button type="button" data-agua="1000">+ 1 L</button>
      </div>

      <div class="agua-rodape">
        <span id="aguaMensagem">Comece registrando seu primeiro copo.</span>
        <button type="button" id="aguaReset">Zerar hoje</button>
      </div>
    `;

    const style = document.createElement("style");
    style.id = "aguaEstilos";
    style.textContent = `
      .agua-card{
        margin:18px 0;
        padding:20px;
        border:1px solid #d8e3d7;
        border-radius:20px;
        background:#f8fcf8;
        box-shadow:0 5px 18px rgba(23,53,45,.08);
        color:#17352d;
      }
      .agua-topo{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:16px;
      }
      .agua-titulo{
        font-size:21px;
        font-weight:800;
      }
      .agua-subtitulo{
        margin-top:4px;
        color:#507368;
        font-size:14px;
      }
      .agua-config,#aguaReset{
        border:0;
        background:#e7f0e5;
        color:#176b52;
        border-radius:10px;
        padding:9px 12px;
        font-weight:800;
        cursor:pointer;
      }
      .agua-resumo{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
        margin-bottom:16px;
      }
      .agua-resumo>div{
        padding:14px 10px;
        border-radius:14px;
        background:#fff;
        text-align:center;
        border:1px solid #e2e9df;
      }
      .agua-copo-icon{
        font-size:28px;
        margin-bottom:3px;
      }
      .agua-resumo strong{
        display:block;
        font-size:20px;
      }
      .agua-resumo span{
        color:#60776f;
        font-size:12px;
      }
      .agua-barra{
        height:14px;
        border-radius:999px;
        overflow:hidden;
        background:#dce8e1;
      }
      .agua-barra-preenchida{
        width:0%;
        height:100%;
        border-radius:999px;
        background:#176b52;
        transition:width .25s ease;
      }
      .agua-percentual{
        text-align:right;
        margin-top:6px;
        font-weight:800;
        font-size:13px;
      }
      .agua-acoes{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:15px;
      }
      .agua-btn{
        border:0;
        border-radius:12px;
        padding:12px;
        font-weight:800;
        cursor:pointer;
      }
      .agua-menos{
        background:#eef1ed;
        color:#52645d;
      }
      .agua-add{
        background:#176b52;
        color:#fff;
      }
      .agua-atalhos{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:10px;
      }
      .agua-atalhos button{
        border:1px solid #cbdacf;
        background:#fff;
        color:#176b52;
        border-radius:10px;
        padding:8px 11px;
        font-weight:700;
        cursor:pointer;
      }
      .agua-rodape{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-top:14px;
        color:#60776f;
        font-size:13px;
      }
      @media(max-width:600px){
        .agua-resumo{grid-template-columns:1fr 1fr;}
        .agua-copo{grid-column:1/-1;}
        .agua-topo{align-items:flex-start;}
        .agua-rodape{align-items:flex-start;flex-direction:column;}
      }
    `;

    document.head.appendChild(style);

    const anchor =
      document.querySelector(".meal") ||
      document.querySelector(".hero") ||
      document.querySelector("nav") ||
      document.querySelector("main") ||
      document.body.firstElementChild;

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(card, anchor);
    } else {
      document.body.prepend(card);
    }

    bindEvents();
    render();
  }

  function bindEvents() {
    document.getElementById("aguaMais").addEventListener("click", () => addWater(STEP));
    document.getElementById("aguaMenos").addEventListener("click", () => addWater(-STEP));

    document.querySelectorAll("[data-agua]").forEach(btn => {
      btn.addEventListener("click", () => addWater(Number(btn.dataset.agua)));
    });

    document.getElementById("aguaReset").addEventListener("click", () => {
      if (confirm("Zerar o consumo de água registrado hoje?")) {
        data.consumed = 0;
        save();
        render();
      }
    });

    document.getElementById("aguaConfig").addEventListener("click", () => {
      const current = data.goal;
      const answer = prompt(
        "Informe sua meta diária de água em ml.\nExemplo: 2000 para 2 litros.",
        current
      );

      if (answer === null) return;

      const goal = Number(String(answer).replace(",", "."));
      if (!Number.isFinite(goal) || goal < 250) {
        alert("Informe uma meta válida, de pelo menos 250 ml.");
        return;
      }

      data.goal = Math.round(goal);
      if (data.consumed > data.goal) data.consumed = data.goal;
      save();
      render();
    });
  }

  function addWater(amount) {
    data.consumed = Math.max(0, Math.min(data.goal, data.consumed + amount));
    save();
    render();
  }

  function render() {
    const consumed = data.consumed;
    const goal = data.goal;
    const remaining = Math.max(0, goal - consumed);
    const percent = Math.min(100, Math.round((consumed / goal) * 100));

    document.getElementById("aguaConsumida").textContent = formatMl(consumed);
    document.getElementById("aguaMeta").textContent = formatMl(goal);
    document.getElementById("aguaRestante").textContent =
      remaining === 0 ? "Meta atingida" : formatMl(remaining);

    document.getElementById("aguaBarra").style.width = `${percent}%`;
    document.getElementById("aguaPercentual").textContent = `${percent}%`;

    const msg = document.getElementById("aguaMensagem");
    if (percent === 0) msg.textContent = "Comece registrando seu primeiro copo.";
    else if (percent < 50) msg.textContent = "Bom começo. Continue ao longo do dia.";
    else if (percent < 100) msg.textContent = "Muito bem! Você está avançando.";
    else msg.textContent = "💧 Meta diária registrada!";
  }

  function init() {
    createCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
