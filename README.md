# Trabalho de Sistemas Distribuídos

Sistema em contêineres Docker com um microsserviço de autenticação, um banco de
série temporal (InfluxDB) e um armazenamento de fotos, atrás de um Nginx.
O planejamento e os diagramas UML estão em `docs/`.

## Requisito de escalabilidade horizontal

Os serviços devem poder operar com múltiplas réplicas sem perda de
funcionalidade. As operações, os dados e as regras do sistema devem permanecer
consistentes quando as requisições forem distribuídas entre réplicas.

## O que já roda

| Serviço        | O que é                                                     | Acesso                     |
|----------------|-------------------------------------------------------------|----------------------------|
| `nginx`        | Proxy reverso, única porta aberta para fora                 | http://localhost:8080      |
| `auth-service` | Microsserviço de autenticação (adaptado do Nooneurose)      | só pela rede interna       |
| `auth-db`      | PostgreSQL com a tabela de usuários                         | só pela rede interna       |
| `influxdb`     | InfluxDB 2 OSS com leituras sintéticas                      | só pela rede interna       |
| `influx-check` | Consulta de teste executada sob demanda pelo Compose       | saída no terminal          |
| `influx-query` | Consulta de leituras por período pelo serviço de dados     | JSON no terminal           |
| `seaweedfs`    | Armazenamento dos originais das fotos via API S3            | só pela rede interna       |

## Como subir

```bash
cp -n .env.example .env
```

No `.env`, preencha as credenciais do autenticador,
`INFLUX_LOCAL_ADMIN_PASSWORD` (ao menos 8 caracteres) e
`INFLUX_LOCAL_ADMIN_TOKEN` (por exemplo, gerado com `openssl rand -hex 32`).
Prepare também as credenciais do SeaweedFS conforme a seção
[Armazenamento de fotos](#armazenamento-de-fotos). Em seguida, use o Docker Compose v2.

```bash
docker compose up -d --build --wait
docker compose ps
```

Use `docker compose down` para parar os serviços. A opção `-v` também apaga
os usuários cadastrados, os dados e credenciais locais do InfluxDB e as fotos
armazenadas no SeaweedFS.

## Armazenamento de fotos

```bash
mkdir -p secrets
cp -n seaweedfs/s3.example.json secrets/seaweedfs-s3.json
```

Em `secrets/seaweedfs-s3.json`, substitua cada `secretKey` por um valor
diferente, gerado com `openssl rand -hex 32`. O arquivo local é ignorado
pelo Git e precisa ser legível pelo usuário `seaweed` do contêiner (UID 1000).

Para subir somente o armazenamento, execute `docker compose up -d --wait seaweedfs`.
O SeaweedFS cria o bucket `fotos` na inicialização e mantém os arquivos e os
metadados no volume `seaweedfs-data`.

Os serviços da rede interna usam o endpoint `http://seaweedfs:8333` com
endereçamento S3 por caminho (path-style). Use a identidade `envio` para
gravar objetos e a identidade `consulta` para listar e recuperar objetos
do bucket. Uma tentativa de gravação com `consulta` recebe `403 AccessDenied`.

## Leituras do InfluxDB

Para subir somente o banco de leituras, execute
`docker compose up -d --wait influxdb`. Na primeira inicialização, o bucket
`horticultura` recebe seis pontos na measurement `measurements`, de
`2026-11-17T12:00:00Z` a `2026-11-17T12:50:00Z`, a cada 10 minutos.
Cada ponto contém `temperature` em °C, `humidity` em %, `pressure` em Pa
e `rssi` (sinal do sensor).

Emita um token com permissão apenas de leitura do bucket. O comando usa a
configuração administrativa criada dentro do contêiner na inicialização.

```bash
docker compose exec -T influxdb sh -ec '
  bucket_id=$(influx bucket list --org horticultura-local --name horticultura --hide-headers | cut -f1)
  influx auth create --org horticultura-local --read-bucket "${bucket_id:?bucket horticultura ausente}" --description influx-check
'
```

Copie o token retornado para `INFLUX_TOKEN` no `.env`. Guarde as
credenciais locais e da VPS somente no `.env`, que é ignorado pelo Git.

```bash
docker compose run --rm influx-check
```

A consulta exibe a última leitura de cada campo por série. Na amostra local,
os quatro resultados têm o horário `2026-11-17T12:50:00Z`.

Para consultar um período pelo serviço de dados, informe o início e o fim em
ISO 8601 UTC. Este comando retorna as seis leituras da amostra.

```bash
docker compose --profile tools build influx-query
docker compose run --rm -T influx-query 2026-11-17T12:00:00Z 2026-11-17T13:00:00Z
```

Cada leitura traz `timestamp`, `temperature` (°C), `humidity` (% de umidade
relativa), `pressure` (Pa) e `rssi` (sinal do sensor). O início é inclusivo e o
fim é exclusivo. Campos ausentes aparecem como `null` e períodos vazios
retornam `[]`.

### Usar a VPS do professor

Preencha `INFLUX_HOST` com o endereço da VPS, `INFLUX_ORG` com a organização
e `INFLUX_TOKEN` com o token de leitura fornecido pelo professor. Execute
`docker compose run --rm -T influx-query` com as datas desejadas. O Compose cria
um contêiner com os valores do `.env` e consulta o bucket `horticultura`.

## Rotas do autenticador

Todas passam pelo Nginx em `http://localhost:8080`.

| Método | Rota                | Precisa de token | O que faz                                   |
|--------|---------------------|------------------|---------------------------------------------|
| POST   | `/api/user`         | não              | Cadastra usuário (senha: 8+ caracteres, uma maiúscula e um número) |
| POST   | `/api/user/login`   | não              | Faz login e devolve o token JWT (vale 2 h)  |
| GET    | `/api/user/me`      | sim              | Diz de quem é o token; os outros serviços usam para validar |
| GET    | `/api/user/byId/:id`| sim              | Dados de um usuário                         |
| PATCH  | `/api/user`         | sim              | Altera nome ou senha do usuário logado      |

O token vai no cabeçalho `Authorization: Bearer <token>`.
O login aceita no máximo 10 tentativas a cada 15 minutos por IP.

## Roteiro de demonstração

```bash
# 1. Cadastro
curl -X POST localhost:8080/api/user -H 'Content-Type: application/json' \
     -d '{"name":"Ana","email":"ana@teste.com","password":"Senha123"}'

# 2. Login: guarda o token na variável T
T=$(curl -s -X POST localhost:8080/api/user/login -H 'Content-Type: application/json' \
     -d '{"email":"ana@teste.com","password":"Senha123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 3. Acesso com o token: funciona sem informar a senha de novo
curl localhost:8080/api/user/me -H "Authorization: Bearer $T"

# 4. Sem token ou com token adulterado: recusado (401)
curl -i localhost:8080/api/user/me
curl -i localhost:8080/api/user/me -H "Authorization: Bearer ${T}x"

# 5. Senha guardada com hash (bcrypt), nunca em texto
docker compose exec auth-db psql -U auth -d auth -c "select id, email, password from users;"
```
