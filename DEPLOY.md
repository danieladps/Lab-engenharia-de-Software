# Deploy do PetLume na nuvem

O site e a API ficam no **Render** (plano gratuito) e o banco Postgres fica no **Neon** (plano gratuito, os dados não expiram). O arquivo `render.yaml` na raiz já descreve os dois serviços.

```
Navegador ──> petlume-web (Render, site estático)
                 │  chamadas /api
                 ▼
             petlume-api (Render, FastAPI) ──> Postgres (Neon)
```

> **Quem faz:** o Render precisa de acesso ao repositório no GitHub. Quem for dono do repositório (`danieladps`) faz a conexão, ou dá acesso à conta que vai fazer.

## 1. Criar o banco no Neon

1. Crie uma conta em https://neon.tech e um projeto chamado `petlume`. Escolha uma região nos EUA (ex.: US East), perto da que você vai usar no Render.
2. Copie a **connection string**. Ela começa com `postgresql://` e termina com `?sslmode=require`.
3. Guarde essa URL só para colar no Render. **Não coloque no código, no README nem no chat do grupo**, porque ela contém a senha do banco.

## 2. Criar os serviços no Render

1. Crie uma conta em https://render.com entrando com o GitHub.
2. Crie um **Blueprint** apontando para o repositório `Lab-engenharia-de-Software`, branch `main`. O Render lê o `render.yaml` e mostra os dois serviços: `petlume-api` e `petlume-web`.
3. Ele vai pedir as variáveis marcadas como "preencher no painel":

| Serviço | Variável | O que colocar |
| --- | --- | --- |
| petlume-api | `DATABASE_URL` | A URL do Neon do passo 1 |
| petlume-api | `CORS_ORIGINS` | O endereço do site: `https://petlume-web.onrender.com` |
| petlume-api | `DEMO_USER_PASSWORD` | Uma senha para as contas de demonstração (mín. 8 caracteres) |
| petlume-web | `VITE_API_URL` | O endereço da API: `https://petlume-api.onrender.com` |

`JWT_SECRET` é gerada automaticamente pelo Render, não precisa preencher.

4. Confirme. O primeiro deploy leva alguns minutos. A API roda as migrações (`alembic upgrade head`) e cria as contas de demonstração sozinha.

## 3. Conferir os endereços

Se o nome `petlume-api` ou `petlume-web` já estiver em uso no Render, ele adiciona um sufixo ao endereço (ex.: `petlume-api-abc1.onrender.com`). Veja o endereço real no topo de cada serviço e, se for diferente do que você colou:

- Corrija `CORS_ORIGINS` na API. Ela reinicia sozinha.
- Corrija `VITE_API_URL` no site e faça um **novo deploy do site**. Essa variável entra no momento do build, então só trocar o valor não basta.

Pode colar os endereços com ou sem barra no final, e a `VITE_API_URL` com ou sem `/api`; o código ajusta.

## 4. Testar

1. Abra `https://petlume-api.onrender.com/api/health`. Deve aparecer `{"status":"ok","database":"connected"}`.
2. Abra o site, entre com `abrigo@petlume.example` ou `visitante@petlume.example` e a senha de `DEMO_USER_PASSWORD`.
3. Abra direto um endereço interno, como `/perfil`, e recarregue a página. Deve abrir normalmente.

## No dia da apresentação

No plano gratuito, a API **dorme depois de uns 15 minutos sem uso** e leva cerca de 1 minuto para acordar. Abra `/api/health` uns 5 minutos antes de apresentar.

## Atualizações

Cada merge na `main` gera um novo deploy automático dos dois serviços. As migrações novas rodam sozinhas quando a API inicia.

## Se der errado

| O que aparece | Causa provável |
| --- | --- |
| Site abre, mas diz "Sem conexão com a API" | `VITE_API_URL` errada, ou o site não foi publicado de novo depois de corrigir |
| No F12 → Console aparece erro de **CORS** | `CORS_ORIGINS` na API diferente do endereço do site |
| `/api/health` não responde ou dá erro 500 | `DATABASE_URL` errada; veja os logs da `petlume-api` no Render |
| Deploy da API falha logo no início | Veja os logs; a mensagem da `JWT_SECRET` ou do banco aparece ali |
