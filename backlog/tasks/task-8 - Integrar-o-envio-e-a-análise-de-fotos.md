---
id: TASK-8
title: Integrar o envio e a análise de fotos
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-18 08:00'
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
- [x] #1 Somente administradores autenticados conseguem enviar JPEG pelo endereço do Nginx.
- [x] #2 O horário usado pelo sistema é extraído dos metadados de captura. JPEG sem data de captura recebe um erro claro.
- [x] #3 O envio guarda o JPEG original no SeaweedFS, dispara uma análise por foto e persiste o resultado para consultas posteriores.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Publicar POST /api/photos no Nginx, validar o administrador via /me e limitar o corpo JPEG a 10 MiB.
2. Extrair DateTimeOriginal e OffsetTimeOriginal; usar America/Sao_Paulo quando faltar offset.
3. Guardar os bytes no SeaweedFS com chave UTC e UUID, chamar /analyze uma vez e persistir via repositório existente. Tratar falhas e compensação conforme o resultado da gravação.
4. Integrar o data-service ao Compose, preservar influx-query e documentar as credenciais e o upload.
5. Testar os contratos e comprovar os três critérios com Nginx, SeaweedFS, Vision e PostgreSQL antes de concluir.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build do data-service, 8 testes HTTP do upload e 8 testes do vision-service passaram. Docker Compose v2.39.4 em projeto isolado com Nginx, autenticador, SeaweedFS 4.54, PostgreSQL e imagem existente do serviço de visão. O Nginx retornou 401 sem token ou com token adulterado e 403 para cliente, inclusive após revogar a permissão sem trocar o JWT. JPEG sem DateTimeOriginal e JPEG truncado retornaram 400, tipo incorreto 415 e excesso de tamanho 413. Três uploads aceitos, incluindo reenvio e EXIF com offset, geraram três chamadas reais ao analisador, com detecção cup e resposta do OCR. Os três objetos recuperados foram idênticos aos enviados e as três linhas do PostgreSQL corresponderam às respostas 201. A compensação removeu o original de JPEG rejeitado e de INSERT rejeitado. influx-query retornou as seis leituras esperadas.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Administradores podem enviar JPEGs em POST /api/photos pelo Nginx. O serviço usa o horário de captura do EXIF, guarda o original no SeaweedFS, chama YOLO/Tesseract uma vez por envio e persiste o resultado no PostgreSQL. Os três critérios foram verificados de ponta a ponta com Docker Compose.
<!-- SECTION:FINAL_SUMMARY:END -->
