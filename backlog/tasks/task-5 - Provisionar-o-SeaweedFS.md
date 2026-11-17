---
id: TASK-5
title: Provisionar o SeaweedFS
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 23:43'
labels: []
dependencies: []
modified_files:
  - compose.yaml
  - seaweedfs/s3.example.json
  - README.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os originais das fotos precisam permanecer disponíveis para consulta após reiniciar a aplicação.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O SeaweedFS sobe no Docker Compose com armazenamento persistente.
- [x] #2 O armazenamento tem credenciais distintas de leitura e escrita. A de consulta recupera fotos e tem a escrita negada, enquanto a de envio consegue gravar arquivos.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Adicionar o SeaweedFS ao Compose com volume persistente, bucket de fotos criado na inicialização e endpoint S3 interno.
2. Configurar duas identidades S3 limitadas ao bucket e documentar a criação das credenciais locais.
3. Verificar upload, leitura, negação de escrita e persistência após recriar o serviço.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Teste com Docker Compose v2.39.4 em projeto isolado. Serviço saudável, PUT com envio retornou HTTP 200, consulta listou e baixou o JPEG, PUT com consulta retornou HTTP 403 AccessDenied e GET anônimo retornou HTTP 403. Após recriar o contêiner mantendo o volume, o JPEG baixado permaneceu idêntico byte a byte.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Provisionado SeaweedFS 4.54 com bucket S3 fotos, volume persistente e duas identidades restritas ao bucket. A configuração local está documentada no README. Os dois critérios foram verificados no Docker Compose com um JPEG e recriação do contêiner.
<!-- SECTION:FINAL_SUMMARY:END -->
