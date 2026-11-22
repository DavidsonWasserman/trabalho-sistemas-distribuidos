---
id: TASK-13
title: Criar a coleção de testes no Bruno
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-22 01:37'
labels: []
dependencies:
  - TASK-9
modified_files:
  - README.md
  - bruno/
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A equipe precisa repetir as verificações dos endpoints pelo mesmo endereço que será usado na demonstração.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A coleção do Bruno está versionada, roda pelo Nginx e usa configuração de exemplo sem credenciais reais.
- [x] #2 Os casos cobrem login, permissões de cliente e administrador, upload de fotos, consulta por período e respostas de erro.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Criar uma coleção Bruno com ambiente de exemplo apontando para o Nginx, perfis separados e JPEG de teste com EXIF conhecido.
2. Encadear login, verificação de perfis, upload, consulta e recuperação do original, com verificações para as respostas de erro.
3. Documentar configuração e execução e rodar a coleção contra uma stack local pelo Nginx.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Usei um JPEG sintético com EXIF fixo e duas contas temporárias. Como o host não criou interfaces veth, rodei a stack em um namespace de rede isolado, com os mesmos serviços e rotas do Nginx conectados por loopback. O ambiente de exemplo contém valores fictícios, e o arquivo local de credenciais é ignorado pelo Git.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Coleção Bruno e instruções adicionadas para repetir os testes pelo Nginx. O Bruno CLI 4.3.0 aprovou 16 de 16 casos de login, perfis, envio e recuperação do JPEG, consulta por período e erros HTTP. Uma verificação adicional confirmou as seis leituras semeadas e a igualdade byte a byte do JPEG recuperado.
<!-- SECTION:FINAL_SUMMARY:END -->
