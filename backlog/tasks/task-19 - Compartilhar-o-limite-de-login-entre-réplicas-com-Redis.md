---
id: TASK-19
title: Compartilhar o limite de login entre réplicas com Redis
status: To Do
assignee: []
created_date: '2026-11-17 23:09'
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
- [ ] #1 O Redis roda na rede interna do Docker Compose, sem porta publicada no host, e as réplicas do auth-service usam a mesma instância para contar tentativas de login.
- [ ] #2 O POST /api/user/login aceita até 10 requisições por IP na janela de 15 minutos iniciada pela primeira tentativa. A partir da 11ª devolve HTTP 429 até expirar. Tentativas seguintes não renovam a janela.
- [ ] #3 Com pelo menos duas réplicas e requisições simultâneas, a cota é única por IP, a contagem e a expiração são atômicas e um IP não consome a cota de outro.
<!-- AC:END -->
