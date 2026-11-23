---
id: TASK-10
title: Criar a tela simples do cliente
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-20 20:27'
labels: []
dependencies:
  - TASK-9
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O cliente precisa de uma interface para consultar os dados do sistema durante a demonstração.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pelo endereço do Nginx, o cliente consegue entrar e escolher o período de consulta.
- [x] #2 A tela mostra as leituras, as fotos e o que foi identificado em cada foto.
- [x] #3 A tela informa quando o período não tem dados.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Servir pelo Nginx uma tela de login e consulta por intervalo UTC, usando as APIs existentes.
2. Exibir leituras e análise por foto; servir o JPEG por ID após validação do token, com credencial de leitura do SeaweedFS.
3. Documentar a configuração e verificar autenticação, consulta com dados, resultado vazio e recuperação do JPEG.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificado no Firefox headless via Nginx com uma conta cliente e serviços locais do Compose. O teste consultou três leituras do InfluxDB, exibiu um JPEG do SeaweedFS com detecção e OCR semeados no PostgreSQL e confirmou o aviso para intervalo vazio. Também testou credenciais inválidas, intervalo invertido, JPEG indisponível, layout de 390 px e logout. Os 10 testes do serviço de dados passaram.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tela do cliente servida na raiz do Nginx, com login, seleção de período em UTC, leituras, fotos com objetos detectados e OCR, e aviso de ausência de dados. O JPEG original é servido por ID após autenticação, com credencial de leitura separada no SeaweedFS. Configuração documentada no README e fluxo verificado no navegador com dados de demonstração.
<!-- SECTION:FINAL_SUMMARY:END -->
