---
id: TASK-8
title: Integrar o envio e a análise de fotos
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels: []
dependencies:
  - TASK-3
  - TASK-5
  - TASK-6
  - TASK-7
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O administrador precisa inserir fotos no sistema para que o cliente possa consultá-las junto das leituras do sensor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Somente administradores autenticados conseguem enviar JPEG pelo endereço do Nginx.
- [ ] #2 O horário usado pelo sistema é extraído dos metadados de captura. JPEG sem data de captura recebe um erro claro.
- [ ] #3 O envio guarda o JPEG original no SeaweedFS, dispara uma análise por foto e persiste o resultado para consultas posteriores.
<!-- AC:END -->
