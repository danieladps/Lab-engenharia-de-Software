# Kanban — Sprint 4

**Projeto:** PetLume — MVP de adoção responsável  
**Escopo da sprint:** fechar os casos de uso que faltam do documento original, automatizar a verificação no GitHub e preparar a apresentação com o site publicado na nuvem.

## Casos de uso do documento original

| ID original | Caso de uso | Situação no projeto |
| --- | --- | --- |
| UC-A1 | Cadastrar pet para adoção | Concluído (UC01). |
| UC-A2 | Editar/remover anúncio de pet | Concluído (PR #22, feat/editar-anuncio). |
| UC-A3 | Buscar/filtrar pets | Concluído (UC02): espécie, porte e cidade. |
| UC-A4 | Visualizar perfil detalhado do pet | Concluído (PR #18, feat/layout-figma): tela `/pets/:id`. |
| UC-A5 | Solicitar adoção | Concluído (UC03); o responsável vê os pedidos em Meus anúncios (PR #16). |
| UC-A6 | Aprovar/recusar solicitação de adoção | Concluído (PR #20, feat/status-solicitacao). |
| UC-A7 | Acompanhar status da adoção | Concluído (PR #20): Minhas solicitações mostra aguardando, aprovado ou recusado. |
| UC-A8 | Avaliar processo de adoção | Concluído (PR #29): quem adotou dá nota de 1 a 5 e comentário; quem anunciou vê em Meus anúncios. |
| UC-A9 | Favoritar pet | Concluído (PR #19, feat/favoritos-perfil). |
| UC-T1 | Cadastrar-se | Concluído (PR #17, feat/auth). |
| UC-T2 | Login/logout | Concluído (PR #17, feat/auth). |
| UC-T3 | Editar perfil | Concluído (PR #19): nome e cidade. |
| UC-T4 | Receber notificações | Concluído (PR #27): tela Avisos com pedido novo e resposta ao pedido, e número no menu. |
| UC-T5 | Gerenciar usuários e permissões | Fora do escopo; MVP sem painel administrativo. |

## Tarefas da sprint

| A fazer | Em andamento | Concluído |
| --- | --- | --- |
| Preparar os anúncios de exemplo e ensaiar a demonstração (issue #9). | Validar os casos de uso no site publicado (issue #8). | Site publicado: https://petlume-web.onrender.com (Render + banco no Neon). |
| Registrar evidências da demonstração (issue #10). | — | Pets perto de mim: localização de quem procura e distância até a cidade de cada anúncio (PR #35). |
| — | — | Senha do banco e chave JWT do Docker no `.env` (PR #33). |
| — | — | Upload de foto do pet: o site reduz a imagem e a guarda no banco (PR #31). |
| — | — | Avaliar a adoção: nota de 1 a 5 e comentário depois de aprovado (PR #29). |
| — | — | Notificações dentro do app: pedido novo, pedido aprovado ou recusado (PR #27). |
| — | — | Integração contínua no GitHub Actions (PR #25). |
| — | — | Kanban da Sprint 4 e issues resolvidas fechadas (PR #25). |
| — | — | Docker: `docker-compose.yml` com API, site e Postgres. |
| — | — | Mensagens entre quem pediu e quem anunciou, com não lidas no menu (PR #23). |
| — | — | Editar e remover anúncio (PR #22). |
| — | — | Deploy na nuvem: site e API no Render, banco Postgres no Neon (PR #21, DEPLOY.md). |
| — | — | Aprovar ou recusar pedidos e acompanhar o status (PR #20). |
| — | — | Favoritos, Minhas solicitações e edição de perfil (PR #19). |
| — | — | Novo layout mobile-first dos protótipos do Figma (PR #18). |
| — | — | Cadastro, login e logout (PR #17). |
| — | — | Consulta dos interesses em Meus anúncios (PR #16). |

## Critérios para concluir a sprint

- Todos os casos de uso concluídos são demonstrados no site publicado (Render + Neon), não só no computador.
- O GitHub Actions passa (testes, lint e build) em todos os PRs da sprint.
- Cada tarefa tem uma issue, uma branch `feat/*`, `fix/*` ou `chore/*` e um PR ligado à issue.
- Este quadro reflete o estado final apresentado.

## Roteiro da demonstração

1. Uns 5 minutos antes, abrir https://petlume-api.onrender.com/api/health para acordar a API (plano gratuito do Render). O site fica em https://petlume-web.onrender.com.
2. Entrar com a conta do abrigo de demonstração e publicar um anúncio; editar um dado do anúncio.
3. Encontrar o anúncio e testar os filtros de espécie, porte e cidade; tocar em **Ver pets perto de mim** e mostrar a distância; favoritar um pet.
4. Entrar com a conta do visitante e enviar interesse com uma mensagem.
5. Voltar para o abrigo, abrir Meus anúncios, responder a mensagem e aprovar o pedido.
6. Como visitante, mostrar o aviso de aprovação em Avisos, o status aprovado em Minhas solicitações, a conversa em Mensagens e dar a avaliação da adoção.
7. Mostrar no GitHub os PRs da sprint com o CI verde e este quadro.

## Fora do escopo desta sprint

Painel administrativo, notificações por e-mail, marketplace, eventos, campanhas e feed da comunidade.
