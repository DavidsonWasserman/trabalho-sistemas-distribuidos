---
id: TASK-7
title: Implementar a análise de imagens
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-18 00:27'
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
- [x] #1 O serviço de visão roda em Python no Docker e usa o modelo YOLOv8 pronto para detectar copo, vaso e vaso com planta.
- [x] #2 O serviço executa a versão estável mais recente do Tesseract na data da implementação somente quando o YOLOv8 detecta um objeto de interesse.
- [x] #3 Os testes distinguem ausência de objeto, objeto sem texto e objeto com texto.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Adicionar vision-service Python ao Compose, com YOLOv8n COCO em CPU e Tesseract estável com por+eng.
2. Implementar POST /analyze e healthcheck, aplicar orientação EXIF e acionar OCR uma vez por foto com detecção de interesse.
3. Documentar o contrato e validar os três resultados com testes automatizados e imagens reais no contêiner.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Usados os pesos públicos yolov8n.pt (COCO), conforme confirmado, com CPU, conf=0,25 e OCR na foto inteira. O contrato HTTP interno foi documentado no README.
O Compose v2.39.4 validou a configuração, construiu a imagem e confirmou o serviço saudável sem porta publicada. GET /health respondeu de outro contêiner pelo nome vision-service. Tesseract 5.5.4 foi confirmado no contêiner com eng e por.
Oito testes da API passaram localmente e no contêiner, incluindo zero chamadas ao OCR sem detecção e uma chamada na presença de múltiplas detecções. Em POST /analyze com o modelo e OCR reais, um JPEG branco retornou tesseractResult null, o COCO128 000000000030 retornou potted plant e vase com texto vazio, o 000000000113 retornou cup, e uma cópia de 000000000030 com HORTA 42 acrescentado à foto retornou esse texto. Algumas amostras anotadas ficaram sem detecção no limiar adotado. O ambiente Compose de teste foi removido.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Serviço de visão Python em Docker com YOLOv8n em CPU e OCR condicional com Tesseract 5.5.4. Contrato HTTP interno e os três critérios verificados com testes da API e JPEGs em contêiner.
<!-- SECTION:FINAL_SUMMARY:END -->
