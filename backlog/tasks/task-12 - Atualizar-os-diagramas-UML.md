---
id: TASK-12
title: Atualizar os diagramas UML
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-22 00:49'
labels: []
dependencies: []
modified_files:
  - docs/diagramas/diagrama_estado_sessao.puml
  - docs/diagramas/diagrama_estado_sessao.png
  - docs/diagramas/diagrama_sequencia_visao_geral.puml
  - docs/diagramas/diagrama_sequencia_visao_geral.png
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os diagramas apresentados em 17/11 precisam refletir as definições que passaram a valer para a entrega.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Os diagramas de estado e sequência existentes refletem os perfis de cliente e administrador e a consulta ao InfluxDB.
- [x] #2 Os diagramas representam o envio, o armazenamento das fotos no SeaweedFS, o OCR condicionado à detecção e a consulta por período.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confrontar os diagramas de 17/11 com as rotas, as permissões e o fluxo de fotos implementados.
2. Atualizar as duas fontes PlantUML com o ciclo de sessão, as regras dos perfis e as interações de envio e consulta.
3. Regenerar os PNGs e revisar a legibilidade e a correspondência com a implementação.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
As duas imagens foram revisadas visualmente e reproduzidas a partir das fontes PlantUML. A revisão cruzou as permissões e rotas do autenticador e do serviço de dados, a consulta paralela ao InfluxDB e ao PostgreSQL, a recuperação do original por ID e a condição do Tesseract no serviço de visão. Os 10 testes do serviço de dados passaram.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Atualizados os diagramas de estados e de sequência apresentados em 17/11. Os diagramas mostram as permissões de cliente e administrador, a consulta por período no InfluxDB e no PostgreSQL, o JPEG original no SeaweedFS e a execução do OCR quando o YOLO retorna pelo menos uma detecção. As fontes PlantUML e os PNGs estão em docs/diagramas.
<!-- SECTION:FINAL_SUMMARY:END -->
