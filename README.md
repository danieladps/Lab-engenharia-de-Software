# PetLume

Aplicação web para aproximar pessoas interessadas em adotar de responsáveis por pets. Cada pessoa cria uma conta para anunciar pets e demonstrar interesse. Casos de uso:

0. **Criar conta e entrar:** nome, e-mail, senha e cidade.
1. **Publicar um pet:** com login, informar os dados do animal e o nome exibido no anúncio.
2. **Buscar pets:** consultar anúncios disponíveis e filtrar por espécie, porte e cidade.
3. **Demonstrar interesse:** com login, enviar uma mensagem ao responsável (nome e e-mail vêm da conta). Depois do primeiro envio, o anúncio sai da busca. O responsável vê os interesses em **Meus anúncios**.

## Tecnologias

- **Front-end:** React, Vite, Axios e Lucide React.
- **Back-end:** Python, FastAPI, SQLAlchemy, Pydantic e PyJWT (login com token).
- **Banco de dados:** SQLite, com migrações versionadas pelo Alembic.

## Requisitos

- Python 3.12 ou superior.
- Node.js 22 ou superior com npm.

## Executar localmente

### 1. Iniciar a API

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

No Windows PowerShell, ative o ambiente com `.venv\Scripts\Activate.ps1` e copie a configuração com `Copy-Item .env.example .env`.

Por padrão, o banco fica em `backend/petlume_mvp.db`. O seed cria duas contas fictícias (um abrigo com três anúncios e um visitante) e mostra no terminal como entrar; a senha vem de `DEMO_USER_PASSWORD` no `.env` ou é gerada na hora.

> Quem já tinha um `petlume_mvp.db` da versão sem login precisa apagá-lo antes do `alembic upgrade head`: as tabelas mudaram e os dados antigos eram só de exemplo.

### 2. Iniciar o front-end

Em outro terminal, na raiz do repositório:

```bash
cd frontend
npm ci
npm run dev
```

Abra http://localhost:5173. A documentação interativa da API está em http://localhost:8000/docs e o health check em http://localhost:8000/api/health.

## Rotas da API

Todas as rotas usam o prefixo `/api`. As marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>` recebido no login.

| Método | Rota | Função |
| --- | --- | --- |
| `POST` | `/auth/cadastro` | Cria a conta e já devolve o token |
| `POST` | `/auth/login` | Entra com e-mail e senha e devolve o token |
| `GET` | `/auth/me` 🔒 | Dados da conta logada |
| `GET` | `/me/pets` 🔒 | Anúncios da conta logada com os interesses recebidos |
| `GET` | `/pets` | Lista pets disponíveis; filtros `species`, `size` e `city` |
| `GET` | `/pets/{pet_id}` | Exibe os dados de um anúncio |
| `POST` | `/pets` 🔒 | Publica anúncio de pet |
| `POST` | `/pets/{pet_id}/adoptions` 🔒 | Registra interesse em um pet |
| `GET` | `/health` | Verifica a conexão com o banco |

## Testes

```bash
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

Para verificar o front-end:

```bash
cd frontend
npm run lint
npm run build
```

Consulte [README-detalhado.md](README-detalhado.md) para estrutura do projeto, detalhes dos dados e documentação complementar.

O quadro da sprint está em [KANBAN.md](KANBAN.md).
