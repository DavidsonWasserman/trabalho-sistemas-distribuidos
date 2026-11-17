---
id: TASK-9
title: Integrar a consulta por período
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels: []
dependencies:
  - TASK-4
  - TASK-8
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A API deve reunir as medições do sensor e os registros fotográficos para que o cliente possa analisar o mesmo intervalo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A API autenticada funciona pelo Nginx e retorna as leituras e as fotos do intervalo, selecionadas pelo horário da captura, com os resultados de análise persistidos.
- [ ] #2 A API trata intervalos inválidos e períodos vazios.
- [ ] #3 Variações e diferenças são calculadas na consulta que as solicitar, sem reexecutar a análise da imagem.
<!-- AC:END -->
