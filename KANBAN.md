# Kanban — Sprint 3

**Projeto:** PetLume — MVP de adoção responsável  
**Escopo da sprint:** três casos de uso simples, sem login, administração ou integrações externas.

## Casos de uso do MVP

| ID | Caso de uso | Ator | Objetivo | Status |
| --- | --- | --- | --- | --- |
| UC01 | Publicar anúncio de pet | Responsável pelo pet | Cadastrar o pet e os dados de contato do responsável. | Concluído |
| UC02 | Buscar e visualizar pets disponíveis | Pessoa interessada em adotar | Consultar anúncios, filtrar por espécie, porte e cidade e ver os dados do pet. | Concluído |
| UC03 | Demonstrar interesse em um pet | Pessoa interessada em adotar | Enviar nome, e-mail e mensagem para o responsável; o anúncio fica indisponível para novos pedidos. | Concluído: envio, bloqueio e consulta pelo responsável via link de gerenciamento. |

## Casos de uso do documento original

O documento de requisitos lista os casos abaixo. UC01–UC03 são o recorte escolhido para esta sprint; os demais estão identificados como fora do escopo atual, não como trabalho já implementado.

| ID original | Caso de uso | Situação no projeto |
| --- | --- | --- |
| UC-A1 | Cadastrar pet para adoção | Incluído em UC01 — concluído. |
| UC-A2 | Editar/remover anúncio de pet | Fora do escopo desta sprint. |
| UC-A3 | Buscar/filtrar pets | Incluído em UC02 — concluído. |
| UC-A4 | Visualizar perfil detalhado do pet | Incluído em UC02 — dados são exibidos nos cartões; não há uma tela de detalhes separada. |
| UC-A5 | Solicitar adoção | Incluído em UC03 — concluído; o responsável consulta os interesses pelo link de gerenciamento. |
| UC-A6 | Aprovar/recusar solicitação de adoção | Fora do escopo desta sprint. |
| UC-A7 | Acompanhar status da adoção | Fora do escopo desta sprint. |
| UC-A8 | Avaliar processo de adoção | Fora do escopo desta sprint. |
| UC-A9 | Favoritar pet | Fora do escopo desta sprint. |
| UC-T1 | Cadastrar-se | Fora do escopo; MVP sem contas. |
| UC-T2 | Login/logout | Fora do escopo; MVP sem contas. |
| UC-T3 | Editar perfil | Fora do escopo; MVP sem contas. |
| UC-T4 | Receber notificações | Fora do escopo desta sprint. |
| UC-T5 | Gerenciar usuários e permissões | Fora do escopo; MVP sem painel administrativo. |

## Tarefas da sprint

| A fazer | Em andamento | Concluído |
| --- | --- | --- |
| Validar manualmente os três casos de uso pela interface e conferir a persistência após reiniciar a API. | — | Estrutura React/Vite e API FastAPI organizadas. |
| Preparar os anúncios de exemplo e ensaiar a demonstração. | — | SQLite configurado, tabelas criadas automaticamente e carga de exemplos disponível. |
| Registrar evidências da demonstração e atualizar o quadro ao concluir as tarefas. | — | Testes automatizados da API, lint e build do front-end aprovados. |
| — | — | Consulta dos interesses pelo responsável com link de gerenciamento (UC03). |

## Critérios para concluir a sprint

- UC01, UC02 e UC03 são demonstrados pela interface usando o SQLite.
- O responsável pelo anúncio consegue consultar os dados enviados em UC03.
- Após reiniciar a API, os anúncios e interesses continuam persistidos.
- O roteiro e este quadro refletem o estado final apresentado.

## Roteiro da demonstração

1. Publicar um anúncio com os dados do pet e do responsável.
2. Encontrar o anúncio e testar filtros de espécie, porte e cidade.
3. Enviar interesse com nome, e-mail e mensagem.
4. Mostrar ao responsável os dados recebidos e confirmar que o pet não aparece mais entre os disponíveis.

## Fora do escopo desta sprint

Login e cadastro de contas, painel administrativo, aprovação/recusa de pedidos, notificações por e-mail, marketplace, eventos, campanhas e feed da comunidade.
