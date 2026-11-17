---
id: TASK-6
title: Criar o banco de metadados das fotos
status: To Do
assignee: []
created_date: '2026-11-17 22:38'
labels: []
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A consulta precisa recuperar os horários e os resultados da análise sem reler nem reprocessar cada arquivo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Os metadados são armazenados em um banco PostgreSQL separado do banco de usuários.
- [ ] #2 Cada registro guarda data e hora da captura, referência ao original no SeaweedFS e resultados do YOLO e do Tesseract.
- [ ] #3 Os registros podem ser consultados por período usando o horário da captura.
<!-- AC:END -->
