---
id: TASK-3
title: Adicionar perfis ao autenticador
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 22:59'
labels: []
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O mesmo login deve identificar quem pode consultar dados e quem também pode enviar fotos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O login e os JWTs permitem identificar os perfis cliente e administrador e preservam o fluxo de autenticação existente.
- [x] #2 O cadastro público cria somente clientes.
- [x] #3 A concessão do perfil de administrador é controlada e usuários não conseguem alterar o próprio perfil.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Incluir isAdmin no JWT de login, preservar tokens legados e usar /me para consultar o perfil atual.
2. Restringir cadastro e atualização de conta, preparar bancos existentes sem sobrescrever perfis e documentar a promoção pelo operador via Docker e psql.
3. Rodar build e validar cadastro, login, atualização, promoção, tokens legados e inicialização em bancos novos e existentes. Registrar evidências no Backlog.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
npm run build e git diff --check passaram. Teste HTTP com o autenticador compilado em modo de produção e PostgreSQL 16 temporário confirmou cadastro como cliente mesmo com isAdmin no corpo, JWTs assinados para ambos os perfis com validade de duas horas, /me com perfil atual, token legado e 401 sem token. PATCH alterou nome e senha sem mudar o perfil. O SQL do README promoveu a conta pelo e-mail exato. Foram verificados banco novo, migração da tabela sem is_admin e manutenção da promoção após reinício. A execução do comando via Docker Compose e a passagem pelo Nginx ficaram sem verificação neste ambiente por falta de acesso ao daemon do Docker e ao plugin Compose v2.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
O JWT de login agora inclui isAdmin, e /me informa o perfil atual. O cadastro público cria clientes, e a promoção de uma conta existente é feita pelo operador no PostgreSQL, conforme o README. O build e a validação HTTP com PostgreSQL local comprovaram os três critérios.
<!-- SECTION:FINAL_SUMMARY:END -->
