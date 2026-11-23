# JPEGs do ensaio da TASK-11

Os três JPEGs foram baixados pelo link de arquivo original do Wikimedia Commons. Os nomes locais foram alterados e os bytes foram preservados.

| Arquivo | Autor | Licença | Fonte |
| --- | --- | --- | --- |
| `caneca-com-inscricao.jpg` | Miia “Myrtti” Ranta | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Ceramic mug with a monogram and date.jpg](https://commons.wikimedia.org/wiki/File:Ceramic_mug_with_a_monogram_and_date.jpg) |
| `vaso-de-terracota.jpg` | Si Griffiths | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Terraccotta Flower Pot.jpg](https://commons.wikimedia.org/wiki/File:Terraccotta_Flower_Pot.jpg) |
| `planta-em-vaso.jpg` | Alabama Extension (foto de Janet Guynn) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Potted Plant.jpg](https://commons.wikimedia.org/wiki/File:Potted_Plant.jpg) |

## Validação na stack local

Todos os arquivos ficaram abaixo de 10 MiB. Os três contêm `DateTimeOriginal` e o campo `OffsetTimeOriginal` está ausente. A API converteu as datas para UTC usando `America/Sao_Paulo`, conforme o comportamento documentado. As datas em UTC abaixo refletem essa regra da aplicação.

| Arquivo | Captura no EXIF | `capturedAt` na API | ID | YOLO | OCR |
| --- | --- | --- | --- | --- | --- |
| Caneca com inscrição | 2007-11-13 15:30:06 | `2007-11-13T17:30:06.000Z` | 1 | `vase` (51,3%) e `cup` (27,4%) | Texto vazio |
| Vaso de terracota | 2005-02-28 10:56:44 | `2005-02-28T13:56:44.000Z` | 2 | Sem detecções | Não executado |
| Planta em vaso | 2020-06-05 18:03:14 | `2020-06-05T21:03:14.000Z` | 3 | Sem detecções | Não executado |

Os três uploads responderam `201`. O SHA-256 de cada original recuperado pela API coincidiu com o do JPEG baixado. A consulta de `2005-02-28T13:56:44.000Z` até `2020-06-05T21:03:15.000Z` respondeu `200` com as três fotos do lote e zero leituras do InfluxDB. Os hashes, tamanhos e resultados da API estão em [resultado.json](resultado.json).
