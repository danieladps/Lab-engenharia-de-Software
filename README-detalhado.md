# PetLume — MVP

Plataforma web enxuta para aproximar responsáveis por pets e pessoas interessadas em adoção. Nesta etapa, o projeto implementa somente os três casos de uso abaixo; não há login, cadastro de usuários ou painel administrativo.

## Casos de uso

1. **Publicar anúncio de pet:** o responsável informa nome, espécie, raça, porte, idade, cidade, descrição e foto por URL.
2. **Buscar e visualizar pets:** qualquer pessoa pode listar anúncios disponíveis e filtrar por espécie, porte e cidade.
3. **Enviar interesse em adoção:** a pessoa informa nome, e-mail e uma mensagem. O anúncio deixa de aparecer na busca depois do primeiro interesse enviado.

## Tecnologias e estrutura

- **Front-end:** React, Vite, Axios e Lucide React.
- **Back-end:** Python, FastAPI, Pydantic, SQLAlchemy e Uvicorn.
- **Banco:** SQLite, no arquivo `backend/petlume_mvp.db` por padrão.
- **Testes:** pytest, httpx e FastAPI TestClient com SQLite em memória.

```text
backend/
├── app/
│   ├── api/routes/       # Rotas públicas para pets e solicitações
│   ├── core/             # Configuração da aplicação
│   ├── db/               # Engine e sessões SQLAlchemy
│   ├── models/           # Pet e solicitação de adoção
│   ├── schemas.py        # Validação de entrada e saída
│   ├── main.py           # Aplicação FastAPI
│   └── seed_demo.py      # Anúncios para demonstração
└── tests/
frontend/
└── src/                  # Interface React
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

O banco SQLite e as tabelas são criados automaticamente no primeiro início da API. Para mudar o endereço do banco, edite `DATABASE_URL` no arquivo `backend/.env`. O arquivo `.env` e o banco local não devem ser enviados ao Git.

`python -m app.seed_demo` inclui três anúncios se o banco ainda não tiver nenhum pet. O comando pode ser executado novamente sem duplicar os anúncios.

## Endpoints

Todas as rotas usam o prefixo `/api`; não é necessário autenticar.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica a conexão com o banco |
| `GET` | `/pets` | Lista pets disponíveis; aceita `species`, `size` e `city` |
| `GET` | `/pets/{pet_id}` | Consulta os detalhes de um anúncio |
| `POST` | `/pets` | Publica um anúncio com `donor_name` e dados do pet |
| `POST` | `/pets/{pet_id}/adoptions` | Registra nome, e-mail e mensagem de interesse |

Uma solicitação só pode ser registrada para um pet disponível. Após o envio, o anúncio muda para `adoption_pending` e sai da busca pública.

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
