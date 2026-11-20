---
id: TASK-9
title: Integrar a consulta por período
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-20 20:20'
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
- [x] #1 A API autenticada funciona pelo Nginx e retorna as leituras e as fotos do intervalo, selecionadas pelo horário da captura, com os resultados de análise persistidos.
- [x] #2 A API trata intervalos inválidos e períodos vazios.
- [x] #3 Variações e diferenças são calculadas na consulta que as solicitar, sem reexecutar a análise da imagem.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compartilhar a validação do token e das datas UTC e publicar GET /api/period pelo Nginx.
2. Consultar InfluxDB e PostgreSQL em paralelo pelo mesmo intervalo [início, fim), preservando os resultados de análise.
3. Calcular sob demanda a variação por campo e a diferença de contagens por classe e de texto OCR entre duas fotos do período.
4. Documentar o contrato e verificar autenticação, limites, ausência de dados e comparação.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Docker Compose isolado com Nginx, autenticador, InfluxDB 2 OSS com token de leitura e PostgreSQL com metadados de teste. A rota aceitou o token de cliente, recusou tokens ausentes ou inválidos e retornou leituras e fotos com início inclusivo e fim exclusivo. Foram verificados intervalos inválidos, períodos vazios, IDs fora do intervalo e os valores da variação, das contagens YOLO e do OCR com os serviços de visão e SeaweedFS desligados. Os nove testes do serviço de dados passaram, incluindo a regressão para campos ausentes e OCR vazio.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementado GET /api/period pelo Nginx para reunir leituras e fotos pelo horário de captura. A consulta pode calcular a variação de cada medida e comparar os resultados YOLO e OCR persistidos de duas fotos do período. O contrato está no README. Os três critérios foram verificados em Docker Compose com dados locais.
<!-- SECTION:FINAL_SUMMARY:END -->
