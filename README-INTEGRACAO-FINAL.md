# Integração final — Painel Geral

Este módulo fecha a integração visual do Plano Alimentar.

## Arquivo

`painel-geral.js`

## O que ele integra

- 💧 Controle de hidratação
- 🏃 Atividade física
- ☑️ Checklist diário
- 📊 Progresso geral do dia

Ele lê os dados já gravados pelos módulos existentes no `localStorage` e não substitui os arquivos atuais.

## Como instalar no GitHub

1. Abra o repositório `plano-alimentar`.
2. Entre na branch `v2-progressao`.
3. Clique em **Add file → Upload files**.
4. Envie `painel-geral.js` para a raiz do projeto.
5. Abra `index.html` → editar.
6. No final, antes de `</body>`, acrescente:

```html
<script src="painel-geral.js"></script>
```

7. Faça o commit.
8. Aguarde o GitHub Pages publicar.
9. Atualize o aplicativo com `Ctrl + F5`.

## Importante

Não remova os scripts atuais. O painel é complementar.

Chaves utilizadas:

- `planoAlimentar_hidratacao_v1`
- `planoAlimentar_atividade_v1`
- `planoAlimentar_checklist_v2`
