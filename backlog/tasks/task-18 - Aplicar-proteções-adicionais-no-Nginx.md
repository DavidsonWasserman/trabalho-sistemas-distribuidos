---
id: TASK-18
title: Aplicar proteções adicionais no Nginx
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels:
  - extra
dependencies:
  - TASK-9
priority: low
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ponto extra para proteger as rotas públicas depois de integrar a API ao proxy reverso.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O Nginx limita requisições por IP, bloqueia o acesso externo às rotas internas e oculta a versão do servidor.
- [ ] #2 As três proteções são verificadas no Nginx em execução.
<!-- AC:END -->
