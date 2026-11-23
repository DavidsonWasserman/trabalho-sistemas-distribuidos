---
id: TASK-17
title: Mostrar alertas no período consultado
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-23 23:01'
labels:
  - extra
dependencies:
  - TASK-9
priority: low
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ponto extra para destacar condições relevantes do sensor durante a consulta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Os limites escolhidos pela equipe para temperatura, umidade e pressão estão documentados.
- [x] #2 Os alertas exibidos correspondem às condições atingidas dentro do período consultado.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Calcular alertas no painel usando as leituras retornadas pela consulta autenticada. Disparar ao atingir os limites inferiores/superiores de 22/24 °C, 66/70% e 101 270/101 300 Pa.
2. Exibir por condição a contagem, o valor mais extremo e o horário UTC da primeira ocorrência desse extremo. Tratar ausência de alertas, ausência de valores e limpeza ao trocar de consulta ou sair.
3. Documentar os limites de demonstração no README e verificar a amostra local, as fronteiras, os campos ausentes e o ciclo de consulta no navegador.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
O README foi conferido contra os seis limites do painel, incluindo as unidades e a igualdade. No Firefox headless, respostas simuladas com as seis leituras de influxdb/measurements.lp confirmaram os três alertas esperados no intervalo de 12:00 a 13:00 UTC, nenhum até 12:40 UTC e um alerta de pressão ao iniciar às 12:40 UTC. Os casos controlados cobriram os seis limites exatos, valores imediatamente dentro da faixa, empate de extremos, campos ausentes, intervalo vazio, substituição e falha de consulta e encerramento da sessão. Node --check, git diff --check e docker compose config --quiet passaram. O ambiente bloqueou o acesso ao socket do Docker, por isso a verificação de navegador usou respostas simuladas.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
O painel exibe os alertas de temperatura, umidade e pressão atingidos no período consultado, com limite, contagem, valor extremo e horário UTC. Os limites inclusivos de demonstração estão no README. O fluxo foi validado no Firefox com a amostra local e casos controlados servidos por respostas simuladas.
<!-- SECTION:FINAL_SUMMARY:END -->
