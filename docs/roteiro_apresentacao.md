# Roteiro da apresentação de terça (17/11)

O que levar: os diagramas UML (estado e sequência), o guia do trabalho em PDF e o
microsserviço de autenticação rodando no notebook.

Ordem sugerida:

1. O sistema em uma frase
2. Diagrama de sequência
3. Diagrama de estados
4. Demonstração do autenticador
5. Decisões técnicas
6. Próximos passos
7. Perguntas ao professor

As falas abaixo são uma base. Não precisa decorar, só cobrir os pontos.

---

## Antes da apresentação

### Revisão em grupo

- [ ] Todos conseguem explicar o diagrama de sequência sem ler.
- [ ] Concordamos com as propostas que ainda não foram confirmadas pelo professor:
  - um "Serviço de Dados e Análise" separado do autenticador;
  - a foto é analisada (YOLO + Tesseract) no momento do envio, e o resultado fica
    guardado no InfluxDB junto com o horário da foto;
  - RustFS como primeira opção para substituir o MinIO.
- [ ] Decidimos quem fala cada parte.
- [ ] Ensaiamos a demonstração do zero pelo menos uma vez (comandos abaixo).

### Preparar o notebook (na véspera e de novo no dia)

```bash
cd ~/UFRRJ/SistemasDistribuidos/Trabalho
docker compose down          # para tudo (os usuários cadastrados continuam salvos)
docker compose up -d         # sobe de novo
docker compose ps            # auth-db, auth-service e nginx devem estar "running"
```

Deixe abertos antes de começar:

- o terminal já na pasta `Trabalho`;
- o VS Code com os dois `.puml` em pré-visualização (Alt+D);
- o PDF do guia.

---

## 1. O sistema em uma frase

> "O sistema guarda leituras de um sensor de estufa num banco de série temporal e fotos do
> que o sensor está observando num armazenamento de objetos. O usuário faz login uma vez e,
> com essa credencial, consulta as leituras e envia fotos. As fotos passam por YOLO e OCR
> e, para qualquer período escolhido, o sistema mostra as leituras junto das fotos daquele
> horário e do que foi identificado nelas. Tudo roda em contêineres Docker, atrás de um
> Nginx."

---

## 2. Diagrama de sequência (visão geral)

Explique um bloco por vez, apontando no diagrama.

**Participantes**

- Usuário, interface, Nginx.
- Serviço de autenticação e serviço de dados e análise.
- InfluxDB e armazenamento de fotos.
- YOLO e Tesseract.

**Bloco 1: login**

> "O usuário informa e-mail e senha uma única vez. O pedido passa pelo Nginx, o serviço de
> autenticação confere a senha e devolve um token JWT válido por 2 horas. A interface
> guarda esse token e passa a enviá-lo em todas as requisições."

**Bloco 2: consulta das leituras**

> "Cada requisição leva o token. Antes de consultar o InfluxDB, o serviço de dados pergunta
> ao serviço de autenticação se o token é válido e o que o usuário pode fazer. Se não for
> válido, a resposta é 401; se o usuário não tiver permissão, 403. O usuário só consulta as
> leituras: elas já vêm carregadas no banco."

**Bloco 3: envio e análise de foto**

> "A mesma credencial vale aqui, então o login serve para os dois bancos. O serviço lê a
> data e a hora nos metadados da foto, guarda o arquivo, passa a foto pelo YOLO para achar
> o objeto e pelo Tesseract para ler o texto, e registra o resultado com o horário da foto."

**Bloco 4: consulta de um período**

> "O usuário escolhe um intervalo, por exemplo de 00:30 a 00:40. O sistema devolve as
> leituras, as fotos daquele intervalo e o que foi identificado nelas, tendo havido alerta
> do sensor ou não."

**Legenda.** Mostrar que as propostas do grupo estão marcadas e que vamos confirmar com o
professor.

---

## 3. Diagrama de estados (sessão do usuário)

> "Este diagrama mostra os estados de uma sessão no serviço de autenticação."

- **Não autenticado → Autenticando:** o usuário envia e-mail e senha.
- **Credenciais inválidas:** volta para "não autenticado".
- **Mais de 10 tentativas em 15 minutos:** vai para "bloqueado temporariamente" (resposta
  429) e só libera quando a janela de 15 minutos acaba. Isso protege contra quem tenta
  adivinhar senhas.
- **Credenciais válidas:** o serviço emite o token e a sessão fica ativa.
- **Dentro de "sessão ativa"**, cada requisição segue o mesmo caminho: validar o token,
  verificar a permissão e acessar o recurso. Sem permissão, a resposta é 403 e a sessão
  continua ativa.
- **Saídas da sessão:**
  - depois de 2 horas o token expira (estado "sessão expirada");
  - logout;
  - token rejeitado: adulterado, ou de um usuário que não existe mais.

  Todas voltam para "não autenticado".

---

## 4. Demonstração do autenticador

> "O professor pediu o autenticador rodando. Ele está em Docker, junto com o banco de
> usuários e o Nginx."

```bash
docker compose ps
```

> "São três contêineres. Só o Nginx tem porta aberta para fora (8080). O autenticador e o
> banco ficam na rede interna do Docker e não podem ser acessados diretamente."

Os comandos abaixo podem ser colados de uma vez. Cada um imprime um título antes do
resultado, para a tela ficar legível.

```bash
echo "== 1. Cadastro =="
curl -s -X POST localhost:8080/api/user -H 'Content-Type: application/json' \
     -d '{"name":"Ana","email":"ana@teste.com","password":"Senha123"}'; echo

echo "== 2. Senha fraca é recusada =="
curl -s -X POST localhost:8080/api/user -H 'Content-Type: application/json' \
     -d '{"name":"Bia","email":"bia@teste.com","password":"fraca"}'; echo

echo "== 3. Login com senha errada =="
curl -s -X POST localhost:8080/api/user/login -H 'Content-Type: application/json' \
     -d '{"email":"ana@teste.com","password":"Errada123"}'; echo

echo "== 4. Login correto: guarda o token =="
T=$(curl -s -X POST localhost:8080/api/user/login -H 'Content-Type: application/json' \
     -d '{"email":"ana@teste.com","password":"Senha123"}' \
     | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "token: ${T:0:40}..."

echo "== 5. Acesso com o token, sem informar a senha de novo =="
curl -s localhost:8080/api/user/me -H "Authorization: Bearer $T"; echo

echo "== 6. Acesso sem token =="
curl -s -w "  [HTTP %{http_code}]" localhost:8080/api/user/me; echo

echo "== 7. Acesso com token adulterado =="
curl -s -w "  [HTTP %{http_code}]" localhost:8080/api/user/me -H "Authorization: Bearer ${T}x"; echo

echo "== 8. Senha guardada no banco =="
docker compose exec auth-db psql -U auth -d auth -c "select id, email, password from users;"
```

Se a Ana já estiver cadastrada, o passo 1 responde `user already exists`. Não tem
problema: o resto funciona igual.

O que falar em cada passo:

| Passo | Fala |
|---|---|
| 1 | "Cadastro: o serviço devolve os dados do usuário, sem a senha." |
| 2 | "A senha precisa ter 8 caracteres, uma maiúscula e um número." |
| 3 | "Senha errada não gera token." |
| 4 | "Com a senha certa o serviço devolve o token JWT, válido por 2 horas." |
| 5 | "Este é o ponto pedido pelo professor: com o token o usuário acessa sem se autenticar de novo. Os outros serviços vão usar esta mesma rota (`/api/user/me`) para conferir o token antes de acessar os bancos." |
| 6 e 7 | "Sem token ou com um token alterado, a resposta é 401. A assinatura do JWT impede que alguém altere o token." |
| 8 | "A senha nunca é guardada em texto: guardamos um hash bcrypt. Nem quem tem acesso ao banco descobre a senha." |

Opcional: mostrar os arquivos `compose.yaml` e `nginx/nginx.conf` enquanto explica a
seção 5.

---

## 5. Decisões técnicas e por quê

| Decisão | Por quê |
|---|---|
| Autenticação em um microsserviço separado | Os dois bancos usam o mesmo login. Qualquer serviço novo só precisa perguntar a ele se o token vale. |
| Token JWT com validade de 2 horas | O usuário não se autentica a cada requisição. Se o token vazar, ele para de valer sozinho. |
| Senha com hash bcrypt | Se o banco vazar, as senhas não aparecem. |
| Limite de 10 tentativas de login em 15 minutos por IP | Dificulta descobrir senhas por tentativa e erro. |
| Nginx como proxy reverso | É a única entrada do sistema; os serviços e bancos ficam escondidos na rede interna. |
| Docker Compose | O sistema inteiro sobe com um comando, igual em qualquer computador. |
| Senhas e segredos no arquivo `.env`, fora do Git | Nenhuma senha fica no repositório. |
| O serviço cria a tabela de usuários ao iniciar | Funciona com um banco novo ou com um que já tenha dados. |
| Projeto do Compose com nome próprio (`sistemas-distribuidos`) | Não se mistura com outros projetos Docker do computador. |

---

## 6. Próximos passos

Mesma ordem da seção 8 do guia:

1. Subir o InfluxDB e carregar as leituras (simuladas até chegarem as reais).
2. Proteger a consulta das leituras com o autenticador.
3. Subir o armazenamento de fotos e o envio de fotos, lendo o horário dos metadados.
4. Reutilizar a mesma autenticação nas fotos.
5. Integrar YOLO e Tesseract e guardar o resultado.
6. Fazer a consulta por período: leituras, fotos e o que foi identificado.
7. Colocar todos os serviços atrás do Nginx.
8. Ensaiar a demonstração em outro computador.

---

## 7. Perguntas ao professor

Da seção 12 do guia. As primeiras são as que mais travam o trabalho.

1. O MinIO gratuito foi descontinuado e a imagem oficial não está mais no Docker Hub
   (confirmamos ao tentar baixar). Podemos usar um substituto compatível? Sugerimos o
   RustFS (seção 9 do guia).
2. Qual versão do InfluxDB: 2 ou 3? Em qual versão estão os dados do sensor?
3. Podemos guardar o resultado do YOLO e do Tesseract no próprio InfluxDB, com o horário da
   foto?
4. A autenticação dos dois bancos pode ser como mostramos: só os nossos serviços acessam os
   bancos, e só depois de o autenticador confirmar o token?
5. Quais papéis de usuário existem? Quem pode consultar e quem pode enviar fotos?
6. Como reconhecer uma leitura com problema ou alerta?
7. O Nginx só encaminha requisições ou também deve cuidar de HTTPS e balanceamento?
8. Dados simulados valem para a avaliação final?

Pedidos de dados (seção 11 do guia):

- arquivo com as leituras reais do sensor e a descrição das medidas;
- o modelo YOLO e como executá-lo;
- fotos de exemplo das jarras, se houver.

Lembrete: a avaliação final é em 08/12. Para apresentar antes, é preciso avisar o
professor com 3 dias de antecedência.

---

## Perguntas que podem aparecer (e respostas)

**"Como os outros serviços sabem que o token é válido?"**
Eles chamam `GET /api/user/me` no autenticador com o token. O autenticador confere a
assinatura e a validade e diz de quem é o token. Assim o segredo de assinatura fica só no
autenticador.

**"E o logout?"**
O JWT não fica guardado no servidor: o logout é a interface apagar o token. Ele também
expira sozinho em 2 horas. Revogar na hora exigiria uma lista de tokens bloqueados, e
isso pode ser uma melhoria futura.

**"Onde entra o cookie do diagrama de estados?"**
Na interface, que ainda vamos fazer: ela guarda o token em cookie. Hoje o serviço devolve
o token na resposta do login.

**"Por que não deixar o banco acessível direto?"**
Porque aí a autorização ficaria só no banco. Com os bancos na rede interna, todo acesso
passa pelo nosso serviço, que confere o token e a permissão.

**"O que acontece se o autenticador cair?"**
Ninguém consegue fazer login nem validar tokens, então os outros serviços passam a
recusar as requisições. Isso evita acesso sem autorização. Uma melhoria futura seria rodar
mais de uma cópia dele atrás do Nginx.

**"Por que série temporal para o sensor e armazenamento de objetos para as fotos?"**
As leituras são números com data e hora, consultados por intervalo: é o caso de uso do
InfluxDB. Foto é arquivo grande: o armazenamento de objetos guarda o arquivo e devolve pelo
nome.

---

## Se algo der errado na hora

| Problema | Comando |
|---|---|
| Ver o estado dos serviços | `docker compose ps` |
| Ver o erro de um serviço | `docker compose logs auth-service` (ou `auth-db`, `nginx`) |
| Reiniciar tudo | `docker compose down && docker compose up -d` |
| Recomeçar com o banco vazio (apaga os usuários) | `docker compose down -v && docker compose up -d` |
| Porta 8080 ocupada | Trocar `8080:80` por outra porta no `compose.yaml` e usar essa porta nos comandos |
