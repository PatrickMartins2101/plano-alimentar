/* checklist-app.js
   Integra automaticamente checklist.html + checklist.css ao index.html.
   Basta adicionar este script ao final do <body>:
   <script src="checklist-app.js"></script>
*/

(async function iniciarChecklist() {
  try {
    // 1) Carrega o CSS da funcionalidade
    if (!document.querySelector('link[data-checklist-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "checklist.css";
      link.dataset.checklistCss = "true";
      document.head.appendChild(link);
    }

    // 2) Cria o local onde o checklist será exibido
    let container = document.getElementById("checklist-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "checklist-container";
      document.body.appendChild(container);
    }

    // 3) Carrega o HTML do checklist
    const resposta = await fetch("checklist.html", { cache: "no-cache" });

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar checklist.html");
    }

    container.innerHTML = await resposta.text();

    // 4) Usa as funções de armazenamento existentes, se houver.
    function obterDados() {
      if (typeof window.getData === "function") {
        return window.getData();
      }

      const chave = "planoAlimentar_v2";
      try {
        return JSON.parse(localStorage.getItem(chave)) || {};
      } catch {
        return {};
      }
    }

    function salvarDados(data) {
      if (typeof window.saveData === "function") {
        window.saveData(data);
        return;
      }

      localStorage.setItem(
        "planoAlimentar_v2",
        JSON.stringify(data)
      );
    }

    const itens = [
      "agua",
      "refeicoes",
      "exercicio",
      "sono",
      "plano"
    ];

    function dataDoDia() {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const dia = String(agora.getDate()).padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    }

    function atualizarProgresso() {
      const data = obterDados();
      const hoje = dataDoDia();
      const checklist = data.checklists?.[hoje] || {};

      let concluido = 0;

      itens.forEach(item => {
        if (checklist[item] === true) {
          concluido++;
        }
      });

      const total = itens.length;
      const percentual = (concluido / total) * 100;

      const texto = document.getElementById(
        "check-progress-text"
      );

      const barra = document.getElementById(
        "check-progress-fill"
      );

      if (texto) {
        texto.textContent =
          `${concluido} de ${total} concluídos`;
      }

      if (barra) {
        barra.style.width = `${percentual}%`;
      }
    }

    function iniciarEventos() {
      const data = obterDados();

      if (!data.checklists) {
        data.checklists = {};
      }

      const hoje = dataDoDia();

      if (!data.checklists[hoje]) {
        data.checklists[hoje] = {};
      }

      itens.forEach(item => {
        const checkbox = document.getElementById(
          `check-${item}`
        );

        if (!checkbox) return;

        checkbox.checked =
          data.checklists[hoje][item] === true;

        checkbox.addEventListener("change", () => {
          const dadosAtualizados = obterDados();

          if (!dadosAtualizados.checklists) {
            dadosAtualizados.checklists = {};
          }

          if (!dadosAtualizados.checklists[hoje]) {
            dadosAtualizados.checklists[hoje] = {};
          }

          dadosAtualizados.checklists[hoje][item] =
            checkbox.checked;

          salvarDados(dadosAtualizados);
          atualizarProgresso();
        });
      });

      atualizarProgresso();
    }

    iniciarEventos();

    console.log("Checklist diário carregado com sucesso.");
  } catch (erro) {
    console.error("Erro ao carregar o checklist:", erro);
  }
})();
