---
id: TASK-4
title: Consultar leituras do InfluxDB 2 OSS
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 23:38'
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
- [x] #1 Endereço, organização e token são configuráveis pelo .env, com valores de exemplo sem segredos.
- [x] #2 A consulta por período é validada em uma instância local do InfluxDB 2 OSS com o bucket horticultura, a measurement measurements e leituras espaçadas em 10 minutos.
- [x] #3 A consulta retorna temperature (°C), humidity (%), pressure (Pa) e rssi (sinal do sensor) e usa credenciais somente de leitura.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Implementar listMeasurements em TypeScript com o cliente oficial do InfluxDB 2 OSS e as três variáveis de conexão.
2. Adicionar a consulta de período sob demanda ao perfil tools do Compose e documentar o uso local e na VPS.
3. Compilar e verificar a amostra, os limites do intervalo, o período vazio, a validação de entrada e a permissão de leitura.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build TypeScript e build da imagem concluídos. Compose v2.40.3 com InfluxDB 2.7 local em projeto isolado retornou os seis pontos do bucket horticultura e da measurement measurements, com os valores exatos da amostra e espaçamento de 10 minutos. O subintervalo retornou apenas 12:10Z e 12:20Z. Período vazio, campo ausente e datas inválidas foram verificados. O token restrito leu o bucket e teve uma tentativa de escrita rejeitada. A configuração do Compose recebeu as três variáveis de um arquivo .env de teste, e o Git ignora o .env.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
O serviço de dados consulta medições por período e o comando influx-query retorna JSON. O README documenta o uso local e a troca para a VPS. Os três critérios de aceite foram validados no InfluxDB 2 OSS local. A validação na VPS depende das credenciais do professor.
<!-- SECTION:FINAL_SUMMARY:END -->
