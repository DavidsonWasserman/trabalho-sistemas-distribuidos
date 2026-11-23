---
id: TASK-19
title: Compartilhar o limite de login entre réplicas com Redis
status: Done
assignee:
  - '@codex'
created_date: '2026-11-17 23:09'
updated_date: '2026-11-23 23:16'
labels: []
dependencies: []
references:
  - auth-service/src/common/utils/middleware/rate_limit.ts
type: enhancement
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hoje cada processo do auth-service mantém seu próprio contador em memória. Ao distribuir os logins entre réplicas, um mesmo IP ganha uma cota por réplica. Usar Redis para manter uma única cota por IP quando o serviço de autenticação for escalado.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O Redis roda na rede interna do Docker Compose, sem porta publicada no host, e as réplicas do auth-service usam a mesma instância para contar tentativas de login.
- [x] #2 O POST /api/user/login aceita até 10 requisições por IP na janela de 15 minutos iniciada pela primeira tentativa. A partir da 11ª devolve HTTP 429 até expirar. Tentativas seguintes não renovam a janela.
- [x] #3 Com pelo menos duas réplicas e requisições simultâneas, a cota é única por IP, a contagem e a expiração são atômicas e um IP não consome a cota de outro.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Adicionar Redis saudável em rede interna e compartilhar a janela fixa de login via operação atômica.
2. Usar o IP observado pelo Nginx, balancear réplicas por DNS e serializar a preparação do PostgreSQL.
3. Validar simultaneidade, IPs distintos, expiração e recuperação com duas réplicas no Compose.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
As duas réplicas iniciaram juntas em PostgreSQL novo. Redis saudável, rede interna dedicada, sem porta publicada. Dos 20 logins simultâneos com o mesmo IP, dez chegaram à validação de credenciais e dez receberam HTTP 429 do autenticador. Os logs confirmaram as duas réplicas. IPs distintos mantiveram contadores próprios e os cabeçalhos do cliente não alteraram a cota. Corpo JSON malformado consumiu uma tentativa. PTTL inicial de 899813 ms e PEXPIRETIME estável entre tentativas. A expiração foi antecipada apenas no teste para conferir a recriação da janela de 900 s. Redis lento ou parado retornou 503 em 1038 ms ou 36 ms, respectivamente. O perfil autenticado seguiu disponível. A cota sobreviveu ao reinício do Redis, sem reenvio de comandos. Uma terceira réplica recebeu tráfego sem reiniciar o Nginx. Build e type-check do autenticador e dez testes do serviço de dados passaram. A auditoria npm manteve os mesmos 34 alertas preexistentes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
O login tem cota atômica de dez tentativas por IP em janela fixa de 15 minutos, compartilhada pelas réplicas no Redis privado. Concorrência, IPs independentes, expiração e recuperação foram verificadas em Compose.
<!-- SECTION:FINAL_SUMMARY:END -->
