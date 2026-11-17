---
id: TASK-7
title: Implementar a análise de imagens
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cada foto enviada precisa passar pelo modelo de detecção fornecido para o trabalho e, quando aplicável, pelo OCR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O serviço de visão roda em Python no Docker e usa o modelo YOLOv8 pronto para detectar copo, vaso e vaso com planta.
- [ ] #2 O serviço executa a versão estável mais recente do Tesseract na data da implementação somente quando o YOLOv8 detecta um objeto de interesse.
- [ ] #3 Os testes distinguem ausência de objeto, objeto sem texto e objeto com texto.
<!-- AC:END -->
