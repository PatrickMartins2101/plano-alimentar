<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="theme-color"
        content="#16745C"
    >

    <meta
        name="description"
        content="Plano alimentar interativo"
    >

    <title>Plano Alimentar</title>

    <link
        rel="manifest"
        href="manifest.webmanifest"
    >

    <link
        rel="icon"
        type="image/png"
        href="icons/icon-192.png"
    >

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background: #f5f3e8;
            color: #173c35;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: #fffdf7;
            border-radius: 24px;
            padding: 25px;
            margin-bottom: 20px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 20px;

            box-shadow:
                0 5px 20px rgba(0, 0, 0, 0.08);
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            width: 70px;
            height: 70px;

            background: #16745c;
            color: white;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 34px;
        }

        .title h1 {
            font-family: Georgia, serif;
            font-size: 38px;
            color: #173c35;
        }

        .title p {
            margin-top: 5px;
            letter-spacing: 3px;
            color: #648078;
            font-size: 13px;
        }

        .phrase {
            max-width: 260px;
            text-align: right;

            font-family: Georgia, serif;
            font-style: italic;

            font-size: 18px;
            color: #173c35;
        }

        .menu {
            background: #fffdf7;
            border-radius: 20px;
            padding: 12px;

            display: flex;
            flex-wrap: wrap;
            gap: 10px;

            margin-bottom: 20px;

            box-shadow:
                0 5px 20px rgba(0, 0, 0, 0.06);
        }

        .menu button {
            border: 1px solid #cbd5cf;

            background: white;
            color: #173c35;

            padding: 13px 18px;

            border-radius: 15px;

            font-weight: bold;
            font-size: 15px;

            cursor: pointer;

            transition: 0.2s;
        }

        .menu button:hover {
            background: #e7f1eb;
        }

        .menu button.active {
            background: #16745c;
            color: white;
            border-color: #16745c;
        }

        .welcome {
            background: #dceee2;

            border-radius: 20px;

            padding: 20px;

            margin-bottom: 20px;

            font-size: 17px;
            font-weight: bold;

            line-height: 1.5;
        }

        .meal {
            background: #fffdf7;

            border-radius: 24px;

            overflow: hidden;

            box-shadow:
                0 5px 20px rgba(0, 0, 0, 0.07);
        }

        .meal-header {
            padding: 20px;

            background: #f3f1e7;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 15px;
        }

        .meal-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .time {
            background: #16745c;
            color: white;

            border-radius: 14px;

            padding: 10px 15px;

            font-weight: bold;
        }

        .meal-title h2 {
            font-size: 25px;
        }

        .meal-content {
            padding: 25px;

            display: grid;

            grid-template-columns:
                repeat(auto-fit, minmax(150px, 1fr));

            gap: 20px;
        }

        .food {
            text-align: center;

            border-right: 1px solid #e4e1d7;

            padding: 10px;
        }

        .food:last-child {
            border-right: none;
        }

        .food-icon {
            font-size: 48px;
            margin-bottom: 8px;
        }

        .food h3 {
            font-size: 16px;
            margin-bottom: 8px;
        }

        .food p {
            color: #777;
            font-size: 14px;
            line-height: 1.4;
        }

        .substitute {
            margin-top: 15px;

            border: none;

            background: #16745c;
            color: white;

            padding: 10px 18px;

            border-radius: 10px;

            cursor: pointer;

            font-weight: bold;
        }

        .observations {
            background: #fff8e8;

            padding: 20px;

            border-top: 1px solid #e8dfc8;

            line-height: 1.6;
        }

        @media (max-width: 700px) {

            .container {
                padding: 10px;
            }

            header {
                flex-direction: column;
                text-align: center;
            }

            .logo-area {
                flex-direction: column;
            }

            .phrase {
                text-align: center;
            }

            .title h1 {
                font-size: 30px;
            }

            .menu {
                overflow-x: auto;
                flex-wrap: nowrap;
            }

            .menu button {
                white-space: nowrap;
            }

            .meal-content {
                grid-template-columns: 1fr 1fr;
            }

            .food {
                border-right: none;
                border-bottom: 1px solid #e4e1d7;
                padding-bottom: 20px;
            }

            .food:last-child {
                border-bottom: none;
            }
        }
    </style>
</head>

<body>

<div class="container">

    <header>

        <div class="logo-area">

            <div class="logo">
                ♡
            </div>

            <div class="title">

                <h1>
                    Plano Alimentar
                </h1>

                <p>
                    SAÚDE HOJE, MAIS CONQUISTAS AMANHÃ
                </p>

            </div>

        </div>

        <div class="phrase">

            “Disciplina hoje,
            resultados amanhã.”

        </div>

    </header>


    <nav class="menu">

        <button class="active">
            🏠 Visão geral
        </button>

        <button>
            🌅 07:30 — Café da manhã
        </button>

        <button>
            🍽️ 12:00 — Almoço
        </button>

        <button>
            🍎 15:00 — Lanche da tarde
        </button>

        <button>
            🌙 20:00 — Jantar
        </button>

        <button>
            🍳 20:00 — Opção de jantar
        </button>

        <button>
            🥛 20:00 — Lanche com whey
        </button>

    </nav>


    <section class="welcome">

        🌿 Use os botões acima para navegar entre as
        refeições do seu plano alimentar.

    </section>


    <section class="meal">

        <div class="meal-header">

            <div class="meal-title">

                <span class="time">
                    🌅 07:30
                </span>

                <h2>
                    Café da manhã
                </h2>

            </div>

            <button class="substitute">
                Ver substituições
            </button>

        </div>


        <div class="meal-content">


            <div class="food">

                <div class="food-icon">
                    🥛
                </div>

                <h3>
                    Leite de vaca UHT desnatado
                </h3>

                <p>
                    1 copo americano duplo
                    (240 ml)
                </p>

                <button class="substitute">
                    Substituir
                </button>

            </div>


            <div class="food">

                <div class="food-icon">
                    💪
                </div>

                <h3>
                    Whey Protein isolado
                </h3>

                <p>
                    0,5 colher de medida
                    (12,5 g)
                </p>

            </div>


            <div class="food">

                <div class="food-icon">
                    🍞
                </div>

                <h3>
                    Pão de forma 100% integral
                </h3>

                <p>
                    1 fatia (25 g)
                </p>

                <button class="substitute">
                    Substituir
                </button>

            </div>


            <div class="food">

                <div class="food-icon">
                    🧀
                </div>

                <h3>
                    Queijo minas frescal
                </h3>

                <p>
                    2 fatias (60 g)
                </p>

                <button class="substitute">
                    Substituir
                </button>

            </div>


            <div class="food">

                <div class="food-icon">
                    🍌
                </div>

                <h3>
                    Banana
                </h3>

                <p>
                    1 unidade média
                    (90 g)
                </p>

                <button class="substitute">
                    Substituir
                </button>

            </div>


            <div class="food">

                <div class="food-icon">
                    🌾
                </div>

                <h3>
                    Aveia
                </h3>

                <p>
                    1 colher de sopa cheia
                    (15 g)
                </p>

                <button class="substitute">
                    Substituir
                </button>

            </div>

        </div>


        <div class="observations">

            <strong>
                Observações
            </strong>

            <p>
                • Evitar tapioca diariamente;
                consumir no máximo 2x/semana
                (baixa fibra, alto índice glicêmico).
            </p>

        </div>

    </section>

</div>


<script>

    // Registro básico do Service Worker
    // para transformar o site em PWA.

    if ("serviceWorker" in navigator) {

        window.addEventListener(
            "load",
            function () {

                navigator.serviceWorker
                    .register("sw.js")
                    .catch(
                        function (error) {

                            console.log(
                                "Erro ao registrar Service Worker:",
                                error
                            );

                        }
                    );

            }
        );

    }

</script>

</body>
</html>
