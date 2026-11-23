---
id: TASK-16
title: Montar painel de exploração
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-22 01:45'
labels:
  - extra
dependencies:
  - TASK-9
priority: low
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ponto extra para facilitar a exploração das medições e dos resultados da análise das fotos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Um painel em Grafana ou equivalente exibe séries de medidas e o detalhe de uma foto selecionada.
- [x] #2 O painel compara duas fotos e exibe um resumo do período com variações nas medidas e diferenças entre as fotos calculadas na consulta.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ampliar a consulta autenticada existente com gráficos de séries temporais e o resumo retornado pela API.
2. Exibir o JPEG e a análise da foto selecionada e permitir comparar duas fotos do mesmo período usando a API.
3. Documentar o fluxo e verificar gráficos, seleção, comparação e estados vazios.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Firefox headless com respostas de teste da API confirmou os quatro gráficos, a tabela, a carga dos JPEGs, os detalhes de análise, a comparação nos dois sentidos, os estados de foto única e período vazio e o encerramento da sessão. Os 10 testes do serviço de dados passaram na imagem local. A validação com a stack inteira ficou impedida pela criação da rede Docker neste ambiente.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A tela autenticada passou a funcionar como painel de exploração, com séries temporais, resumo das variações, detalhes da foto selecionada e comparação de duas fotos lado a lado. Variações e diferenças usam os resultados retornados pela consulta da API. O README descreve o fluxo. Interface verificada no Firefox com dados de teste e cálculos da API verificados pela suíte existente.
<!-- SECTION:FINAL_SUMMARY:END -->
