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
- **Banco:** SQLite, no arquivo `backend/petlume_mvp.db` por padrão, com migrações pelo Alembic.
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
| `/meus-anuncios` | Anúncios da conta e pedidos recebidos | Sim |
| `/perfil` | Dados da conta e sair | Sim |
| `/favoritos` e `/mensagens` | Ainda sem função ("em breve") | — |

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
| `GET` | `/pets` | Lista pets disponíveis; aceita `species`, `size` e `city` |
| `GET` | `/pets/{pet_id}` | Consulta os detalhes de um anúncio |
| `POST` | `/pets` 🔒 | Publica um anúncio com `donor_name` e dados do pet |
| `POST` | `/pets/{pet_id}/adoptions` 🔒 | Registra a mensagem de interesse |

Uma solicitação só pode ser registrada para um pet disponível. Após o envio, o anúncio muda para `adoption_pending` e sai da busca pública.

### Login e privacidade

O login devolve um token (JWT) que vale por `JWT_EXPIRE_MINUTES` (padrão: 1 dia). O front guarda o token no navegador e o envia em cada chamada; ao sair da conta, ele é apagado. Errar a senha e usar um e-mail sem conta dão a mesma mensagem, para não revelar quem está cadastrado.

O e-mail de quem pediu um pet aparece **somente** para o dono daquele anúncio, em `/me/pets`. A busca pública e os detalhes do pet não mostram e-mail nem o id do dono.

> Quem já tinha o arquivo `backend/petlume_mvp.db` da versão sem login precisa apagá-lo e rodar `alembic upgrade head` e `python -m app.seed_demo` de novo.

## Testes e validações

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
