---
id: TASK-11
title: Preparar os JPEGs da demonstração
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-20 21:00'
labels: []
dependencies: []
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O ensaio precisa de fotos capturadas pelo grupo com metadados originais preservados.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reunir JPEGs originais de copos, vasos e vasos com plantas, com e sem texto.
- [ ] #2 Conferir data e hora de captura após copiar os originais ou compartilhá-los como documentos. Evitar envio como imagem pelo WhatsApp, que pode remover os metadados.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Baixar os três JPEGs originais do Wikimedia Commons e registrar as licenças.
2. Validar tamanhos, EXIF, upload e consulta na stack local e registrar os resultados do ensaio.
3. Quando o grupo disponibilizar os seis originais, copiá-los, validar e concluir os critérios de aceite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ensaio concluído na stack local pelo Nginx. Três JPEGs públicos originais, créditos e evidências em output/task-11/ensaio/. Todos têm DateTimeOriginal, estão dentro do limite de 10 MiB e responderam 201 com capturedAt coerente com a regra de fuso da aplicação. O SHA-256 de cada original recuperado é idêntico ao do JPEG baixado. A consulta de 2005-02-28T13:56:44.000Z até 2020-06-05T21:03:15.000Z respondeu 200 com as três fotos e zero leituras do InfluxDB. O YOLO classificou a caneca como cup e vase e não detectou o vaso de terracota nem a planta em vaso. O OCR da caneca retornou texto vazio.
Pendente para a conclusão: receber os seis JPEGs originais capturados pelo grupo, um com texto e um sem texto por categoria, e validar seus metadados após a transferência.
<!-- SECTION:NOTES:END -->
