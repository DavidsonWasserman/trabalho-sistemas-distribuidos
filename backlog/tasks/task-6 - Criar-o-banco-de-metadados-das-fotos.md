---
id: TASK-6
title: Criar o banco de metadados das fotos
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 23:54'
labels: []
dependencies: []
modified_files:
  - compose.yaml
  - .env.example
  - README.md
  - photo-db/init.sql
  - data-service/package.json
  - data-service/package-lock.json
  - data-service/tsconfig.json
  - data-service/src/photoMetadata.ts
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A consulta precisa recuperar os horários e os resultados da análise sem reler nem reprocessar cada arquivo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Os metadados são armazenados em um banco PostgreSQL separado do banco de usuários.
- [x] #2 Cada registro guarda data e hora da captura, referência ao original no SeaweedFS e resultados do YOLO e do Tesseract.
- [x] #3 Os registros podem ser consultados por período usando o horário da captura.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Adicionar photo-db ao Compose com volume, credencial própria, healthcheck e inicialização SQL.
2. Implementar no data-service o módulo Drizzle para inserir metadados completos e consultar por intervalo de captura [início, fim).
3. Documentar a configuração, compilar e validar o Compose, o esquema, a persistência e as consultas contra PostgreSQL.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A instalação limpa das dependências, a compilação do data-service e a validação do Compose passaram. O TypeScript usa skipLibCheck para as declarações do Drizzle, que incluem adaptadores opcionais, mantendo strict no código do serviço.

Em projeto isolado com Docker Compose v2.39.4 e postgres:17-alpine, os dois bancos ficaram saudáveis e a separação foi verificada. A integração do módulo comprovou a gravação dos metadados, NULL para OCR ausente, preservação de OCR executado com resultado vazio, unicidade de bucket e chave, início inclusivo, fim exclusivo, ordem por horário e ID, períodos vazios e rejeição de intervalos inválidos. Os registros permaneceram disponíveis após recriar o contêiner com o mesmo volume. O ambiente temporário foi removido.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Provisionado o PostgreSQL de metadados das fotos, separado da autenticação, com volume persistente e esquema inicial. O serviço de dados ganhou funções TypeScript para gravar resultados das análises e consultar registros pelo horário da captura. Os três critérios foram verificados em Docker Compose.
<!-- SECTION:FINAL_SUMMARY:END -->
