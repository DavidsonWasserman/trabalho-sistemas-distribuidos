---
id: TASK-18
title: Aplicar proteções adicionais no Nginx
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-23 23:16'
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
- [x] #1 O Nginx limita requisições por IP, bloqueia o acesso externo às rotas internas e oculta a versão do servidor.
- [x] #2 As três proteções são verificadas no Nginx em execução.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Limitar a API pública por IP com Nginx e ocultar a versão.
2. Publicar só as rotas documentadas e manter a busca na rede interna.
3. Verificar a configuração, as três proteções e os fluxos públicos no Compose.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validação em Compose isolado com Nginx em execução. nginx -t passou. O limite de 20 r/s com rajada de 60 encaminhou 61 de 100 requisições de um IP e devolveu 39 HTTP 429. Outro IP passou durante a rajada. As rotas internas retornaram 404 no proxy e a busca e o healthcheck do serviço de visão permaneceram disponíveis na rede interna. Cabeçalho Server e páginas de erro sem versão. Página e JS públicos, perfil autenticado, consulta com seis leituras, envio e retorno do JPEG com SHA-256 idêntico e rejeição acima de 10 MiB confirmados.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
O Nginx limita as rotas públicas da API por IP, encaminha apenas as rotas documentadas e oculta a versão. As três proteções e os fluxos públicos foram verificados em execução.
<!-- SECTION:FINAL_SUMMARY:END -->
