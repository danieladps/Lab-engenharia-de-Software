# PetLume — MVP

Plataforma web enxuta para aproximar responsáveis por pets e pessoas interessadas em adoção. Cada pessoa tem uma conta (e-mail e senha) e pode tanto anunciar quanto adotar. Não há painel administrativo.

## Casos de uso

0. **Criar conta e entrar:** nome, e-mail, senha (mínimo de 8 caracteres) e cidade. A senha é guardada só como hash (Argon2).
1. **Publicar anúncio de pet:** com login, o responsável informa nome, espécie, raça, porte, idade, cidade, descrição e foto por URL.
2. **Buscar e visualizar pets:** qualquer pessoa pode listar anúncios disponíveis e filtrar por espécie, porte e cidade.
3. **Enviar interesse em adoção:** com login, a pessoa escreve uma mensagem; nome e e-mail vêm da conta. Não é possível pedir o próprio pet. O anúncio deixa de aparecer na busca depois do primeiro interesse enviado.

## Tecnologias e estrutura

- **Front-end:** React, Vite, React Router, Axios e Lucide React.
- **Back-end:** Python, FastAPI, Pydantic, SQLAlchemy, Uvicorn, PyJWT e pwdlib (Argon2).
- **Banco:** SQLite no computador (arquivo `backend/petlume_mvp.db`) e Postgres na nuvem, com migrações pelo Alembic. O deploy está descrito em [DEPLOY.md](DEPLOY.md).
- **Testes:** pytest, httpx e FastAPI TestClient com SQLite em memória.

```text
backend/
├── app/
│   ├── api/deps.py       # Descobre o usuário logado pelo token
│   ├── api/routes/       # Conta, meus anúncios, pets e solicitações
│   ├── core/             # Configuração e segurança (senha e token)
│   ├── db/               # Engine e sessões SQLAlchemy
│   ├── models/           # Usuário, pet e solicitação de adoção
│   ├── schemas.py        # Validação de entrada e saída
│   ├── main.py           # Aplicação FastAPI
│   └── seed_demo.py      # Contas e anúncios fictícios para demonstração
├── migrations/           # Migrações versionadas do banco (Alembic)
└── tests/
frontend/
└── src/
    ├── components/       # Moldura com menu inferior, cartão de pet, painel, etc.
    ├── lib/              # Login (auth.jsx), avisos (toast.jsx) e textos dos pets
    ├── pages/            # Uma tela por arquivo: início, detalhes, entrar, perfil...
    └── App.jsx           # Rotas
```

## Instalação e execução

Requisitos: Python 3.12 ou superior e Node.js 22 ou superior.

Na raiz do projeto, prepare e inicie a API:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Abra o `backend/.env` e preencha `JWT_SECRET` com uma chave gerada assim (a API não inicia sem ela):

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Depois crie as tabelas, carregue os dados de exemplo e inicie a API:

```bash
alembic upgrade head
python -m app.seed_demo
uvicorn app.main:app --reload
```

No Windows PowerShell, use `.venv\Scripts\Activate.ps1` para ativar o ambiente e `Copy-Item .env.example .env` para copiar a configuração.

Em outro terminal, inicie o front-end:

```bash
cd frontend
npm ci
npm run dev
```

A interface fica em http://localhost:5173, a API em http://localhost:8000 e o Swagger em http://localhost:8000/docs. O Vite encaminha `/api` para a API local.

As tabelas são criadas e alteradas **somente** por migração: `alembic upgrade head`. Ao mudar um modelo, gere uma nova com `alembic revision --autogenerate -m "descrição"`, revise o arquivo em `migrations/versions/` e suba junto no PR; o teste `test_migrations.py` falha se um modelo mudar sem migração. Para mudar o endereço do banco, edite `DATABASE_URL` no arquivo `backend/.env`. O arquivo `.env` e o banco local não devem ser enviados ao Git.

`python -m app.seed_demo` cria duas contas fictícias, `abrigo@petlume.example` (com três anúncios) e `visitante@petlume.example`, se o banco ainda não tiver usuários. A senha das duas é `DEMO_USER_PASSWORD` do `.env` ou, se estiver vazia, uma gerada e mostrada no terminal. Rodar de novo não duplica nada.

## Telas

| Endereço | Tela | Precisa de login |
| --- | --- | --- |
| `/` | Início: busca por nome ou raça, filtros de espécie, porte e cidade | Não |
| `/pets/:id` | Detalhes do pet e botão "Quero adotar" | Só para enviar o pedido |
| `/entrar` e `/cadastro` | Entrar e criar conta | Não |
| `/anunciar` | Formulário de anúncio | Sim |
| `/meus-anuncios` | Anúncios da conta, pedidos recebidos, editar e remover | Sim |
| `/meus-anuncios/:id/editar` | Editar um anúncio | Sim (só o dono) |
| `/perfil` | Dados da conta, editar nome e cidade, sair | Sim |
| `/favoritos` | Pets salvos com o coração | Sim |
| `/minhas-solicitacoes` | Pedidos de adoção que você enviou e o status de cada um | Sim |
| `/mensagens` | Lista de conversas, com as não lidas | Sim |
| `/mensagens/:id` | Conversa de um pedido | Sim (só quem pediu e o dono do pet) |

No celular, a navegação fica no menu inferior; a partir de 900 px de largura, vai para uma barra no topo. Se for publicar o front em um servidor, configure para que qualquer endereço sirva o `index.html` (as rotas são do React Router).

## Endpoints

Todas as rotas usam o prefixo `/api`. As marcadas com 🔒 exigem `Authorization: Bearer <token>`. No Swagger, use o botão **Authorize** e cole o token devolvido pelo login.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica a conexão com o banco |
| `POST` | `/auth/cadastro` | Cria conta (`name`, `email`, `password`, `city`) e devolve o token |
| `POST` | `/auth/login` | Entra com `email` e `password` e devolve o token |
| `GET` | `/auth/me` 🔒 | Dados da conta logada |
| `GET` | `/me/pets` 🔒 | Anúncios da conta logada, cada um com os interesses recebidos |
| `GET` | `/me/adoptions` 🔒 | Pedidos que a conta logada enviou, cada um com o pet |
| `GET` | `/me/favorites` 🔒 | Pets salvos pela conta logada, do mais recente para o mais antigo |
| `PUT` | `/me/favorites/{pet_id}` 🔒 | Salva o pet nos favoritos (repetir não duplica) |
| `DELETE` | `/me/favorites/{pet_id}` 🔒 | Remove o pet dos favoritos |
| `PATCH` | `/auth/me` 🔒 | Edita `name` e `city` (o e-mail não muda) |
| `GET` | `/pets` | Lista pets disponíveis; aceita `species`, `size` e `city` |
| `GET` | `/pets/{pet_id}` | Consulta os detalhes de um anúncio |
| `POST` | `/pets` 🔒 | Publica um anúncio com `donor_name` e dados do pet |
| `PATCH` | `/pets/{pet_id}` 🔒 | O dono edita qualquer dado do anúncio (os campos não enviados ficam iguais); o status não muda por aqui |
| `DELETE` | `/pets/{pet_id}` 🔒 | O dono remove o anúncio; só vale para pets disponíveis |
| `POST` | `/pets/{pet_id}/adoptions` 🔒 | Registra a mensagem de interesse |
| `PATCH` | `/adoptions/{adoption_id}` 🔒 | O dono do anúncio responde um pedido em aberto com `{"status": "approved"}` ou `{"status": "rejected"}` |
| `GET` | `/me/conversations` 🔒 | Conversas da conta (como quem pediu ou como dono), da mais recente para a mais antiga, com `unread` |
| `GET` | `/adoptions/{adoption_id}/messages` 🔒 | Mensagens do pedido; marca as recebidas como lidas |
| `POST` | `/adoptions/{adoption_id}/messages` 🔒 | Envia `{"body": "..."}` (até 2000 caracteres) |

Uma solicitação só pode ser registrada para um pet disponível. Após o envio, o anúncio muda para `adoption_pending` e sai da busca pública.

### Ciclo do pedido de adoção

1. Alguém envia um pedido: o pedido fica **Aguardando resposta** (`pending`) e o pet sai da busca (**Pedido recebido**).
2. O dono do anúncio responde em **Meus anúncios**:
   - **Aprovar** (`approved`): o pet fica **Adotado** e não volta para a busca. Quem pediu passa a ver o e-mail do dono em **Minhas solicitações**, para combinarem a adoção.
   - **Recusar** (`rejected`): o pet volta para a busca e pode receber pedido de outra pessoa.
3. A resposta não pode ser desfeita, e só o dono do anúncio pode responder.

### Mensagens

Cada pedido de adoção tem uma conversa entre quem pediu e o dono do pet. A mensagem do pedido aparece no topo. Só essas duas pessoas leem e escrevem; para as outras contas, a conversa "não existe" (404). Se o pedido for recusado, a conversa fica só para leitura.

As mensagens novas aparecem sozinhas: a tela da conversa confere a cada 5 segundos, e o número de não lidas no menu a cada 30 segundos (só com a aba aberta). Não é tempo real (WebSocket), que não funciona bem no plano gratuito do Render.

### Editar e remover anúncio

Só o dono do anúncio edita ou remove; para as outras contas, o pet "não existe" (404). Para **remover**, o pet precisa estar disponível:

- com pedido em aberto, é preciso aprovar ou recusar antes;
- se já foi adotado, o anúncio fica, para não apagar o pedido aprovado de quem adotou.

Ao remover, o pet sai da busca e dos favoritos de quem salvou, e os pedidos recusados dele são apagados junto.

Regras garantidas pelo banco: um pet tem no máximo um pedido em aberto ou aprovado, e cada pessoa pede cada pet uma única vez (mesmo depois de recusada).

### Login e privacidade

O login devolve um token (JWT) que vale por `JWT_EXPIRE_MINUTES` (padrão: 1 dia). O front guarda o token no navegador e o envia em cada chamada; ao sair da conta, ele é apagado. Errar a senha e usar um e-mail sem conta dão a mesma mensagem, para não revelar quem está cadastrado.

O e-mail de quem pediu um pet aparece **somente** para o dono daquele anúncio, em `/me/pets`. A busca pública e os detalhes do pet não mostram e-mail nem o id do dono. Favoritos e solicitações também são de cada conta: ninguém vê os de outra pessoa. O e-mail do dono só aparece para quem teve o pedido aprovado.

Se o login vencer com o site aberto, a próxima ação que precisa de login avisa "Seu login expirou" e a pessoa volta a aparecer como deslogada.

> Quem já tinha o arquivo `backend/petlume_mvp.db` da versão sem login precisa apagá-lo e rodar `alembic upgrade head` e `python -m app.seed_demo` de novo.

## Testes e validações

Para conferir as migrações também num Postgres de verdade, crie um banco **vazio** de teste e rode:

```bash
TEST_POSTGRES_URL=postgresql://usuario:senha@localhost:5432/petlume_teste python -m pytest -q tests/test_migrations.py
```

Sem essa variável, o teste de Postgres é pulado.


```bash
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

Para validar a interface:

```bash
cd frontend
npm run lint
npm run build
```
