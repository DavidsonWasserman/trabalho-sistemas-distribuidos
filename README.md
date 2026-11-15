# Trabalho de Sistemas Distribuídos

Sistema em contêineres Docker com um microsserviço de autenticação, um banco de
série temporal (InfluxDB) e um armazenamento de fotos, atrás de um Nginx.
O planejamento e os diagramas UML estão em `docs/`.

## O que já roda

| Serviço        | O que é                                                     | Acesso                     |
|----------------|-------------------------------------------------------------|----------------------------|
| `nginx`        | Proxy reverso, única porta aberta para fora                 | http://localhost:8080      |
| `auth-service` | Microsserviço de autenticação (adaptado do Nooneurose)      | só pela rede interna       |
| `auth-db`      | PostgreSQL com a tabela de usuários                         | só pela rede interna       |

## Como subir

```bash
cp .env.example .env      # depois edite o .env e troque as duas senhas
docker compose up -d --build
docker compose ps         # os três serviços devem aparecer como "running"
```

Para parar: `docker compose down`. Para apagar também os usuários cadastrados:
`docker compose down -v`.

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