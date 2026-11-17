---
id: TASK-1
title: Preparar InfluxDB local com troca para a VPS do professor
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 22:40'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A equipe deve conseguir desenvolver e testar com um InfluxDB 2 OSS local enquanto o acesso à VPS do professor estiver pendente. Quando o professor fornecer as credenciais, a mesma integração deve consultar as leituras reais na VPS.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O InfluxDB 2 OSS local sobe pelo Docker Compose com o bucket horticultura e dados de teste na measurement measurements. As leituras são espaçadas em 10 minutos e incluem temperature (°C), humidity (%), pressure (Pa) e rssi (sinal do sensor).
- [ ] #2 O serviço consulta a instância local com um token de leitura. O endereço, a organização e o token são configuráveis pelo .env, com valores de exemplo sem segredos no .env.example.
- [ ] #3 A troca para a VPS está documentada e exige apenas preencher no .env o endereço, a organização e o token de leitura fornecidos pelo professor e recriar o serviço de dados. O código e a consulta ao bucket horticultura permanecem os mesmos.
- [ ] #4 Os tokens reais ficam fora do Git e do Backlog. A disponibilidade das credenciais da VPS não é condição para concluir esta tarefa.
<!-- AC:END -->
