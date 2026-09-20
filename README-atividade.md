# Módulo de Atividade Física — Plano Alimentar

Arquivo principal: `atividade.js`

## Recursos

- Meta diária de minutos.
- Registro de atividade, duração e intensidade.
- Histórico dos últimos 7 dias.
- Progresso diário em porcentagem.
- Exclusão individual de registros.
- Botão para zerar os registros do dia.
- Persistência automática no navegador (`localStorage`).
- Exportação do histórico em JSON.
- Interface responsiva.
- Não exige criação de HTML adicional: o módulo cria a própria interface.

## Integração

No final do `index.html`, junto dos outros scripts, adicione:

```html
<script src="atividade.js"></script>
```

Se já existir um script semelhante, não substitua os demais; apenas acrescente essa linha.

## Meta inicial

A meta inicial é de **30 minutos por dia**, podendo ser alterada pelo usuário.

## Observação

Este módulo registra atividade física e não calcula gasto calórico. Isso evita apresentar estimativas de calorias como se fossem medidas precisas.
