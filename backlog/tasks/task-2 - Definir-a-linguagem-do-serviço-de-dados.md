---
id: TASK-2
title: Definir a linguagem do serviço de dados
status: Done
assignee: []
created_date: '2026-11-17 22:38'
updated_date: '2026-11-17 22:52'
labels: []
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A equipe precisa escolher uma linguagem para as integrações com os bancos e o armazenamento de fotos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Registrar a escolha entre TypeScript e Python, considerando as bibliotecas necessárias e a familiaridade da equipe.
- [x] #2 Registrar a divisão de responsabilidades entre o serviço de dados, o autenticador existente em TypeScript e o serviço de visão em Python.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A equipe escolheu TypeScript (Node.js) para o serviço de dados. O autenticador existente oferece uma referência local de Express, TypeScript e Drizzle com PostgreSQL, o que permite seguir padrões que a equipe já tem no projeto. A comparação confirmou clientes oficiais de Flux para InfluxDB 2 OSS em TypeScript e Python. Para TypeScript, `@influxdata/influxdb-client` atende às consultas Flux, Drizzle com `postgres` atende ao PostgreSQL e `@aws-sdk/client-s3` pode acessar o SeaweedFS via gateway S3. A consulta Flux e os dados de exemplo da TASK-1 servem de base para a TASK-4.

- Autenticador (TypeScript). Mantém cadastro, login, emissão e validação de JWT e os perfis previstos na TASK-3. O serviço de dados consulta `GET /api/user/me` para identificar o usuário.
- Serviço de dados (TypeScript). Aplica as permissões das rotas, consulta o InfluxDB por período com credencial de leitura, recebe JPEGs, extrai a data de captura, armazena os originais no SeaweedFS e solicita a análise ao serviço de visão. Persiste o horário de captura, a referência ao original e os resultados em um PostgreSQL separado do banco de usuários. A API reúne as medições e os registros de fotos do intervalo consultado.
- Serviço de visão (Python). Analisa cada foto com YOLOv8 para detectar copo, vaso e vaso com planta. Quando detecta um objeto de interesse, executa o OCR com Tesseract e devolve o resultado ao serviço de dados.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A equipe escolheu TypeScript para o serviço de dados. A decisão registra os padrões do autenticador que servem de referência, as bibliotecas para as integrações e as responsabilidades dos três serviços. Os dois critérios foram verificados no registro do Backlog.
<!-- SECTION:FINAL_SUMMARY:END -->
