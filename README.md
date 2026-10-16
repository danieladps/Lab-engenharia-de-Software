# PetLume

Aplicação web para aproximar pessoas interessadas em adotar de responsáveis por pets. O MVP concentra-se em três casos de uso, sem login ou cadastro de usuários:

1. **Publicar um pet:** informar os dados do animal e do responsável pelo anúncio.
2. **Buscar pets:** consultar anúncios disponíveis e filtrar por espécie, porte e cidade.
3. **Demonstrar interesse:** enviar nome, e-mail e mensagem ao responsável. Depois do primeiro envio, o anúncio deixa de aparecer na busca.

## Tecnologias

- **Front-end:** React, Vite, Axios e Lucide React.
- **Back-end:** Python, FastAPI, SQLAlchemy e Pydantic.
- **Banco de dados:** SQLite.

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
python -m app.seed_demo
uvicorn app.main:app --reload
```

No Windows PowerShell, ative o ambiente com `.venv\Scripts\Activate.ps1` e copie a configuração com `Copy-Item .env.example .env`.

O SQLite e as tabelas são criados automaticamente. Por padrão, o banco fica em `backend/petlume_mvp.db`. O comando de demonstração adiciona três anúncios somente quando o banco ainda não contém pets.

### 2. Iniciar o front-end

Em outro terminal, na raiz do repositório:

```bash
cd frontend
npm ci
npm run dev
```

Abra http://localhost:5173. A documentação interativa da API está em http://localhost:8000/docs e o health check em http://localhost:8000/api/health.

## Rotas da API

Todas as rotas são públicas e usam o prefixo `/api`.

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/pets` | Lista pets disponíveis; filtros `species`, `size` e `city` |
| `GET` | `/pets/{pet_id}` | Exibe os dados de um anúncio |
| `POST` | `/pets` | Publica anúncio de pet |
| `POST` | `/pets/{pet_id}/adoptions` | Registra interesse em um pet |
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
