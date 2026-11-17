---
id: TASK-4
title: Consultar leituras do InfluxDB 2 OSS
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels: []
dependencies:
  - TASK-2
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O sistema precisa ler as medições do sensor por período e permitir desenvolvimento local enquanto o acesso à VPS estiver pendente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endereço, organização e token são configuráveis pelo .env, com valores de exemplo sem segredos.
- [ ] #2 A consulta por período é validada em uma instância local do InfluxDB 2 OSS com o bucket horticultura, a measurement measurements e leituras espaçadas em 10 minutos.
- [ ] #3 A consulta retorna temperature (°C), humidity (%), pressure (Pa) e rssi (sinal do sensor) e usa credenciais somente de leitura.
<!-- AC:END -->
