/* ============================================================
   PLANO ALIMENTAR — LEITURA E ATUALIZAÇÃO DO PLANO PRESCRITO
   Exibe a prescrição estruturada e permite registrar ajustes
   previamente orientados pela profissional, sem alterar a base.
   ============================================================ */
(() => {
  "use strict";

  const KEY = "planoAlimentar_ajustes_prescricao_v1";
  const ID = "planoPrescritoApp";

  const esc = (v) => String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  };

  let ajustes = load();

  const save = () => localStorage.setItem(KEY, JSON.stringify(ajustes));

  const hoje = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const fmtData = (v) => {
    if (!v) return "";
    const d = new Date(`${v}T12:00:00`);
    return d.toLocaleDateString("pt-BR");
  };

  function getPlan() {
    return [...document.querySelectorAll("#content .meal")].map(section => {
      const id = section.id;
      const title = section.querySelector(".meal-head h2")?.textContent.trim() || id;
      const time = section.querySelector(".time")?.textContent.trim() || "";
      const foods = [...section.querySelectorAll(".food")].map((food, index) => ({
        key: `${id}-${index}`,
        name: food.querySelector(".food-name")?.textContent.trim() || "Alimento",
        qty: food.querySelector(".food-qty")?.textContent.trim() || "",
        icon: food.querySelector(".food-icon")?.textContent.trim() || "🍽️"
      }));
      return { id, title, time, foods };
    });
  }

  function styles() {
    if (document.getElementById("plano-prescrito-style")) return;
    const s = document.createElement("style");
    s.id = "plano-prescrito-style";
    s.textContent = `
      #${ID}{max-width:1200px;margin:18px auto;padding:0 20px;color:#17352d;font-family:Arial,Helvetica,sans-serif}
      #${ID} *{box-sizing:border-box}
      .pp-card{background:#fffdf8;border:1px solid #d8d5c7;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(23,53,45,.08)}
      .pp-head{padding:18px 20px;background:#f1f0e7;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .pp-head h2{margin:0;font-size:22px}.pp-head p{margin:5px 0 0;color:#60746c;font-size:13px;line-height:1.45}
      .pp-badge{background:#dcecdf;border:1px solid #c4d8c8;border-radius:12px;padding:9px 12px;font-size:12px;font-weight:800;white-space:nowrap}
      .pp-body{padding:18px 20px}.pp-note{padding:12px 14px;background:#fff9e9;border:1px solid #eadfbd;border-radius:12px;font-size:12px;color:#53675f;margin-bottom:14px}
      .pp-tools{display:flex;gap:10px;align-items:center;margin-bottom:14px}.pp-search{flex:1;padding:11px 13px;border:1px solid #d8d5c7;border-radius:11px;font-size:14px;background:#fff}
      .pp-count{font-size:12px;color:#71817a;white-space:nowrap}
      .pp-meals{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .pp-meal{border:1px solid #dedacf;border-radius:15px;background:#fff;overflow:hidden}.pp-meal-head{padding:12px 14px;background:#f6f4ec;display:flex;gap:9px;align-items:center}.pp-meal-head strong{font-size:15px}.pp-meal-time{margin-left:auto;color:#176b52;font-weight:800;font-size:12px}
      .pp-food{padding:11px 13px;border-top:1px solid #eeeade}.pp-food-top{display:flex;gap:9px;align-items:flex-start}.pp-icon{font-size:22px;line-height:1}.pp-food-main{flex:1}.pp-name{font-weight:800;font-size:13px;line-height:1.3}.pp-original{margin-top:3px;color:#657770;font-size:12px}.pp-adjusted{margin-top:7px;padding:7px 8px;background:#eaf4ed;border-radius:8px;font-size:11px;color:#176b52}.pp-adjusted b{font-size:12px}
      .pp-edit{border:0;background:#176b52;color:#fff;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}.pp-edit:hover{background:#2d8a6a}.pp-empty{padding:18px;color:#71817a;font-size:13px;text-align:center;grid-column:1/-1}
      .pp-modal{display:none;position:fixed;inset:0;background:#0008;z-index:80;align-items:center;justify-content:center;padding:18px}.pp-modal.show{display:flex}.pp-modal-box{background:#fffdf8;width:min(560px,100%);max-height:88vh;overflow:auto;border-radius:18px;padding:20px;box-shadow:0 20px 60px #0005}.pp-modal-box h3{margin:0 35px 6px 0}.pp-modal-sub{font-size:12px;color:#657770;line-height:1.4}.pp-close{float:right;border:0;background:#eee;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer}.pp-field{display:grid;gap:5px;margin-top:13px}.pp-field label{font-size:12px;font-weight:800}.pp-field input,.pp-field textarea{width:100%;padding:10px;border:1px solid #d8d5c7;border-radius:10px;font:inherit}.pp-field textarea{min-height:90px;resize:vertical}.pp-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}.pp-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.pp-save{background:#176b52;color:#fff}.pp-remove{background:#f5e5e1;color:#8b3e31}.pp-cancel{background:#e9ece5;color:#176b52}
      @media(max-width:760px){#${ID}{padding:0 10px}.pp-head{display:block}.pp-badge{display:inline-block;margin-top:10px}.pp-tools{align-items:stretch}.pp-search{min-width:0}.pp-meals{grid-template-columns:1fr}.pp-count{display:none}}
    `;
    document.head.appendChild(s);
  }

  function openModal(item, meal) {
    const modal = document.getElementById("pp-modal");
    const current = ajustes[item.key] || {};
    modal.dataset.key = item.key;
    modal.querySelector("#pp-title").textContent = `Atualizar: ${item.name}`;
    modal.querySelector("#pp-subtitle").textContent = `${meal.title} • ${meal.time} • Prescrito: ${item.qty || "não informado"}`;
    modal.querySelector("#pp-new-qty").value = current.quantidade || "";
    modal.querySelector("#pp-note").value = current.observacao || "";
    modal.classList.add("show");
  }

  function closeModal() {
    document.getElementById("pp-modal")?.classList.remove("show");
  }

  function render(plan) {
    let app = document.getElementById(ID);
    if (!app) {
      app = document.createElement("section");
      app.id = ID;
      (document.querySelector(".wrap") || document.body).appendChild(app);
    }

    const activeAdjustments = Object.keys(ajustes).length;
    app.innerHTML = `
      <div class="pp-card">
        <div class="pp-head">
          <div><h2>📋 Plano prescrito</h2><p>Leitura organizada da prescrição exibida no aplicativo, com registro local de ajustes já orientados pela profissional.</p></div>
          <div class="pp-badge">${activeAdjustments} ajuste${activeAdjustments === 1 ? "" : "s"} registrado${activeAdjustments === 1 ? "" : "s"}</div>
        </div>
        <div class="pp-body">
          <div class="pp-note">ℹ️ A prescrição original permanece preservada. Os ajustes abaixo são apenas registros locais para refletir alterações que já tenham sido orientadas pela profissional; o aplicativo não cria uma nova prescrição.</div>
          <div class="pp-tools"><input class="pp-search" id="pp-search" placeholder="Pesquisar alimento ou refeição..."><span class="pp-count" id="pp-count"></span></div>
          <div class="pp-meals" id="pp-meals"></div>
        </div>
      </div>
      <div class="pp-modal" id="pp-modal" onclick="if(event.target===this)this.classList.remove('show')">
        <div class="pp-modal-box">
          <button class="pp-close" id="pp-close" type="button">×</button>
          <h3 id="pp-title">Atualizar alimento</h3>
          <div class="pp-modal-sub" id="pp-subtitle"></div>
          <div class="pp-field"><label for="pp-new-qty">Nova quantidade / forma de uso</label><input id="pp-new-qty" maxlength="160" placeholder="Ex.: 2 fatias (40 g)"></div>
          <div class="pp-field"><label for="pp-note">Observação do ajuste</label><textarea id="pp-note" maxlength="500" placeholder="Ex.: ajuste informado na consulta de retorno."></textarea></div>
          <div class="pp-actions"><button class="pp-btn pp-cancel" id="pp-cancel" type="button">Cancelar</button><button class="pp-btn pp-remove" id="pp-remove" type="button">Remover ajuste</button><button class="pp-btn pp-save" id="pp-save" type="button">Salvar ajuste</button></div>
        </div>
      </div>`;

    const list = app.querySelector("#pp-meals");

    function paint(filter = "") {
      const q = filter.trim().toLocaleLowerCase("pt-BR");
      let shown = 0;
      list.innerHTML = plan.map(meal => {
        const foods = meal.foods.filter(item => !q || `${meal.title} ${item.name} ${item.qty}`.toLocaleLowerCase("pt-BR").includes(q));
        if (!foods.length) return "";
        shown += foods.length;
        return `<div class="pp-meal"><div class="pp-meal-head"><strong>${esc(meal.title)}</strong><span class="pp-meal-time">${esc(meal.time)}</span></div>${foods.map(item => {
          const adj = ajustes[item.key];
          return `<div class="pp-food"><div class="pp-food-top"><span class="pp-icon">${esc(item.icon)}</span><div class="pp-food-main"><div class="pp-name">${esc(item.name)}</div><div class="pp-original">Prescrito: ${esc(item.qty || "não informado")}</div>${adj ? `<div class="pp-adjusted"><b>Ajuste registrado:</b> ${esc(adj.quantidade || "sem nova quantidade")}${adj.observacao ? `<br>${esc(adj.observacao)}` : ""}<br><small>${esc(fmtData(adj.data))}</small></div>` : ""}</div><button class="pp-edit" type="button" data-key="${esc(item.key)}">${adj ? "Editar" : "Registrar ajuste"}</button></div></div>`;
        }).join("")}</div>`;
      }).join("") || `<div class="pp-empty">Nenhum item encontrado.</div>`;
      app.querySelector("#pp-count").textContent = `${shown} item${shown === 1 ? "" : "s"}`;
      app.querySelectorAll(".pp-edit").forEach(btn => {
        const item = plan.flatMap(m => m.foods).find(x => x.key === btn.dataset.key);
        const meal = plan.find(m => m.foods.some(x => x.key === btn.dataset.key));
        if (item && meal) btn.onclick = () => openModal(item, meal);
      });
    }

    paint();
    app.querySelector("#pp-search").oninput = e => paint(e.target.value);
    app.querySelector("#pp-close").onclick = closeModal;
    app.querySelector("#pp-cancel").onclick = closeModal;
    app.querySelector("#pp-save").onclick = () => {
      const key = document.getElementById("pp-modal").dataset.key;
      const quantidade = app.querySelector("#pp-new-qty").value.trim();
      const observacao = app.querySelector("#pp-note").value.trim();
      if (!quantidade && !observacao) {
        alert("Informe a nova quantidade ou uma observação para registrar o ajuste.");
        return;
      }
      ajustes[key] = { quantidade, observacao, data: hoje() };
      save();
      closeModal();
      paint(app.querySelector("#pp-search").value);
      document.querySelector("#painel-geral-final")?.dispatchEvent(new Event("planoPrescritoAtualizado"));
    };
    app.querySelector("#pp-remove").onclick = () => {
      const key = document.getElementById("pp-modal").dataset.key;
      if (!ajustes[key]) { closeModal(); return; }
      if (!confirm("Remover o ajuste local e voltar a exibir somente a prescrição original?")) return;
      delete ajustes[key];
      save();
      closeModal();
      paint(app.querySelector("#pp-search").value);
    };
  }

  function start() {
    const plan = getPlan();
    if (!plan.length) return;
    styles();
    render(plan);
    window.addEventListener("storage", () => { ajustes = load(); render(plan); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
