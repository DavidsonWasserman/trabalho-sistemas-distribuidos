---
id: TASK-1
title: Preparar InfluxDB local com troca para a VPS do professor
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 22:46'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A equipe deve conseguir desenvolver e testar com um InfluxDB 2 OSS local enquanto o acesso à VPS do professor estiver pendente. Quando o professor fornecer as credenciais, a mesma integração deve consultar as leituras reais na VPS.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O InfluxDB 2 OSS local sobe pelo Docker Compose com o bucket horticultura e dados de teste na measurement measurements. As leituras são espaçadas em 10 minutos e incluem temperature (°C), humidity (%), pressure (Pa) e rssi (sinal do sensor).
- [x] #2 O serviço consulta a instância local com um token de leitura. O endereço, a organização e o token são configuráveis pelo .env, com valores de exemplo sem segredos no .env.example.
- [x] #3 A troca para a VPS está documentada e exige apenas preencher no .env o endereço, a organização e o token de leitura fornecidos pelo professor e recriar o serviço de dados. O código e a consulta ao bucket horticultura permanecem os mesmos.
- [x] #4 Os tokens reais ficam fora do Git e do Backlog. A disponibilidade das credenciais da VPS não é condição para concluir esta tarefa.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Subir InfluxDB 2 OSS com volumes persistentes e sem porta publicada. Popular horticultura/measurements com seis pontos a cada 10 minutos.
2. Adicionar influx-check sob demanda, conforme aprovado, para exercitar uma consulta Flux fixa com token somente de leitura. A linguagem do serviço de dados e a consulta por período seguem nas TASK-2 e TASK-4.
3. Documentar a emissão do token local e a troca para a VPS pelo .env.
4. Validar Compose, amostra, persistência e rejeição de escrita em um projeto isolado.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validação com Docker Compose v2.40.3 em um projeto isolado com volumes novos. O banco ficou saudável, e a consulta leu seis instantes a cada 10 minutos com os quatro campos. A CLI criou o token restrito ao bucket conforme o README. O token leu os dados e recebeu HTTP 403 ao tentar escrever. Os mesmos valores foram lidos após recriar o banco. A troca do endereço no .env foi exercitada com outro endereço local e a consulta Flux existente. O .env foi confirmado como ignorado e as credenciais descartáveis ficaram fora dos arquivos do projeto e do Backlog.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
InfluxDB 2 OSS inicializa o bucket horticultura com seis leituras sintéticas. O contêiner influx-check valida o acesso somente de leitura e usa as três variáveis de conexão documentadas no README. Inicialização, persistência, consulta, rejeição de escrita e troca do endereço foram verificadas em Docker Compose. A validação na VPS aguarda as credenciais do professor.
<!-- SECTION:FINAL_SUMMARY:END -->
