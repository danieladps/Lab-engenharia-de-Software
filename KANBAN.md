# Kanban — Sprint 3

**Projeto:** PetLume — MVP de adoção responsável  
**Escopo da sprint:** três casos de uso do MVP, agora com conta e login. Sem administração ou integrações externas.

## Casos de uso do MVP

| ID | Caso de uso | Ator | Objetivo | Status |
| --- | --- | --- | --- | --- |
| UC01 | Publicar anúncio de pet | Responsável pelo pet | Cadastrar o pet e os dados de contato do responsável. | Concluído |
| UC02 | Buscar e visualizar pets disponíveis | Pessoa interessada em adotar | Consultar anúncios, filtrar por espécie, porte e cidade e ver os dados do pet. | Concluído |
| UC03 | Demonstrar interesse em um pet | Pessoa interessada em adotar | Com login, enviar uma mensagem ao responsável; o anúncio fica indisponível para novos pedidos. | Concluído: envio, bloqueio e consulta pelo responsável em Meus anúncios. |

## Casos de uso do documento original

O documento de requisitos lista os casos abaixo. UC01–UC03 são o recorte escolhido para esta sprint; os demais estão identificados como fora do escopo atual, não como trabalho já implementado.

| ID original | Caso de uso | Situação no projeto |
| --- | --- | --- |
| UC-A1 | Cadastrar pet para adoção | Incluído em UC01 — concluído. |
| UC-A2 | Editar/remover anúncio de pet | Fora do escopo desta sprint. |
| UC-A3 | Buscar/filtrar pets | Incluído em UC02 — concluído. |
| UC-A4 | Visualizar perfil detalhado do pet | Concluído (PR feat/layout-figma): tela de detalhes em `/pets/:id`. |
| UC-A5 | Solicitar adoção | Incluído em UC03 — concluído; o responsável consulta os interesses em Meus anúncios. |
| UC-A6 | Aprovar/recusar solicitação de adoção | Planejado (PR feat/status-solicitacao). |
| UC-A7 | Acompanhar status da adoção | Planejado (PR feat/status-solicitacao). |
| UC-A8 | Avaliar processo de adoção | Fora do escopo desta sprint. |
| UC-A9 | Favoritar pet | Planejado (PR feat/favoritos-perfil). |
| UC-T1 | Cadastrar-se | Concluído (PR feat/auth). |
| UC-T2 | Login/logout | Concluído (PR feat/auth). |
| UC-T3 | Editar perfil | Planejado (PR feat/favoritos-perfil). |
| UC-T4 | Receber notificações | Fora do escopo desta sprint. |
| UC-T5 | Gerenciar usuários e permissões | Fora do escopo; MVP sem painel administrativo. |

## Tarefas da sprint

| A fazer | Em andamento | Concluído |
| --- | --- | --- |
| Validar manualmente os três casos de uso pela interface e conferir a persistência após reiniciar a API. | — | Estrutura React/Vite e API FastAPI organizadas. |
| Preparar os anúncios de exemplo e ensaiar a demonstração. | — | SQLite configurado, tabelas criadas automaticamente e carga de exemplos disponível. |
| Registrar evidências da demonstração e atualizar o quadro ao concluir as tarefas. | — | Testes automatizados da API, lint e build do front-end aprovados. |
| — | — | Cadastro, login e logout; consulta dos interesses em Meus anúncios (UC03, UC-T1, UC-T2). |
| — | — | Novo layout mobile-first dos protótipos do Figma, com tela de detalhes do pet (UC-A4). |

## Critérios para concluir a sprint

- UC01, UC02 e UC03 são demonstrados pela interface usando o SQLite.
- O responsável pelo anúncio consegue consultar os dados enviados em UC03.
- Após reiniciar a API, os anúncios e interesses continuam persistidos.
- O roteiro e este quadro refletem o estado final apresentado.

## Roteiro da demonstração

1. Criar uma conta (ou entrar com a conta do abrigo de demonstração) e publicar um anúncio.
2. Encontrar o anúncio e testar filtros de espécie, porte e cidade.
3. Entrar com outra conta (o visitante de demonstração) e enviar interesse com uma mensagem.
4. Entrar como responsável, abrir Meus anúncios, mostrar os dados recebidos e confirmar que o pet não aparece mais entre os disponíveis.

## Fora do escopo desta sprint

Painel administrativo, notificações por e-mail, marketplace, eventos, campanhas e feed da comunidade.
