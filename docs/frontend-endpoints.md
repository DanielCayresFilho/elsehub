# Documentação de Uso dos Endpoints no Frontend

Base URL configurada via `VITE_API_BASE_URL` (atualmente `https://api.elsehub.covenos.com.br`).  
Todos os caminhos listados abaixo já incluem o prefixo `/api` quando aplicável.

## Visão Geral

| Endpoint | Situação no Frontend |
| --- | --- |
| 28 testados | 19 consumidos pela UI / stores, 9 ainda sem acionador (health, users/me, toggle-online, service-instances/:id, templates/:id, tabulations/:id, três webhooks) |
| Status críticos | `POST /contacts` pode retornar 400 por telefone duplicado (mensagem exibida na UI). `GET /health` requer token e não é chamado no frontend. |

## Autenticação

- **POST `/auth/login`**  
  - Serviço: `authService.login` (`src/services/auth.service.ts`).  
  - Tela: `src/views/auth/LoginView.vue` via `auth.store.ts`.  
  - Fluxo: usuário envia email/senha, tokens persistem e websocket conecta.  
  - Teste manual: acessar `/login`, usar `admin@elsehu.com`/`ChangeMe123!`.

- **POST `/auth/refresh`**  
  - Serviço: `authService.refreshToken` e interceptador de `api.ts`.  
  - Uso: `auth.store.ensureFreshTokens` e renovação automática quando resposta 401 ocorre.  
  - Teste: reduzir tempo de expiração (`tokenService.shouldRefresh`) e navegar pela aplicação para observar refresh silencioso.

- **GET `/auth/profile`**  
  - Serviço: `authService.getProfile`.  
  - Uso: `auth.store.refreshProfile` para manter `user`.  
  - Teste: após login, forçar `authStore.refreshProfile()` no console ou navegar em rotas protegidas; perfil atualiza e `localStorage` é persistido.

- **GET `/health`**  
  - Não consumido no frontend; endpoint exige token e serve monitoramento backend.  
  - A falha 401 do teste é esperada quando não há Authorization.

## Usuários

- **GET `/users`**  
  - Serviço: `userService.getUsers` agora normaliza o `PaginatedResponse<User>` ({ data, meta }) devolvido pelo backend.  
  - Tela: `src/views/users/UsersView.vue` consome `meta.total`, `meta.totalPages` para navegar entre páginas (botões Anterior/Próxima).  
  - Teste: acessar `/usuarios`, trocar de página via navegação inferior e validar que a query `page/limit` dispara no Network.

- **GET `/users/me`**  
  - Serviço disponível (`userService.getMe`), porém **não chamado** atualmente.  
  - Sugestão: usar na tela de Configurações ou após `login` para garantir payload atualizado.

- **GET `/users/online`**  
  - Serviço: `userService.getOnlineOperators`.  
  - Tela: `src/views/conversations/ConversationsView.vue` (modal de transferência).  
  - Teste: abrir modal “Transferir Conversa” e conferir lista (vazia quando ninguém online).

- **PATCH `/users/me/toggle-online`**  
  - Exposto em `userService.toggleOnline`, **sem UI associada**.  
  - Para paridade com backend, adicionar botão (por exemplo no header) permitindo operadores saírem da fila.

## Contatos

- **GET `/contacts`**  
  - Serviço: `contactService.getContacts` segue o contrato `{ data, meta }` (meta com `total`, `totalPages`).  
  - Telas: `src/views/contacts/ContactsView.vue` (listagem, busca, paginação com contagem total) e modal “Nova Mensagem” em `ConversationsView` (dropdown alimentado com `response.data`).  
  - Teste: acessar `/contatos`, aplicar busca, navegar entre páginas e conferir contagem “Página X de Y • N contatos”.

- **POST `/contacts`**  
  - Serviço: `contactService.createContact`.  
  - Uso: formulário de novo contato em `ContactsView` e modal “Novo Contato” dentro de Conversas.  
  - Observação: backend retorna 400 para telefones duplicados; UI exibe mensagem do backend (ex.: “Telefone já cadastrado em outro contato”).

## Instâncias de Serviço

- **GET `/service-instances`**  
  - Serviço: `serviceInstanceService.getInstances`.  
  - Telas: `InstancesView` (listagem e filtros), `NewCampaignView` (select de instância), `TemplatesView` e modal de “Nova Mensagem” em Conversas.  
  - Teste: ir a `/instancias`, alterar filtros (provider, incluir inativas) e confirmar atualização; abrir telas supracitadas para ver selects populados.

- **GET `/service-instances/:id`**  
  - Serviço disponível (`getInstanceById`), mas **nenhuma tela chama** diretamente; dados vêm da listagem já carregada.  
  - Gap: usar quando for necessário abrir detalhes direto por ID ou lidar com deep-link.

- **GET `/service-instances/:id/qrcode`**  
  - Serviço: `serviceInstanceService.getQRCode`.  
  - Tela: modal “QR Code” em `InstancesView` (apenas para instâncias Evolution).  
  - Teste: clicar em “QR Code” → modal exibe imagem/base64 ou código de pareamento com polling a cada 7s.

- **POST `/service-instances`**, **PATCH `/service-instances/:id`**, **DELETE `/service-instances/:id`** *(não estavam na bateria de testes, mas são usados)*  
  - Telas: modal de criação/edição/remoção em `InstancesView`.

## Templates

- **POST `/templates`**  
  - Serviço: `templateService.createTemplate`.  
  - Tela: modal “Novo Template” (`TemplatesView`).  
  - Teste: preencher campos, escolher instância, salvar e verificar toast/recarga.

- **GET `/templates`**  
  - Serviço: `templateService.getTemplates`.  
  - Telas: `TemplatesView` e `NewCampaignView` (select opcional).  
  - Teste: abrir `/templates`, garantir atualização após criar/editar.

- **GET `/templates/:id`**  
  - Serviço exposto (`getTemplate`), **sem uso** atual.  
  - Útil para página de detalhes ou edição com carregamento sob demanda.

## Tabulações

- **POST `/tabulations`**, **GET `/tabulations`**, **GET `/tabulations/:id`**  
  - Serviço: `tabulationService`.  
  - Uso atual:  
    - `GET /tabulations`: `TabulationsView` (grid) e modal de finalização em `ConversationsView`.  
    - `POST /tabulations`: criação em `TabulationsView`.  
    - `GET /tabulations/:id`: **não utilizado** (dados já vêm da lista).  
  - Teste: acessar `/tabulacoes`, criar nova, depois finalizar conversa escolhendo uma opção no modal.

## Campanhas

- **POST `/campaigns`**  
  - Serviço: `campaignService.createCampaign`.  
  - Tela: `NewCampaignView` (form principal).  
  - Teste: preencher nome, instância e delay; ao salvar, modal solicita CSV (opcional). 

- **GET `/campaigns`**  
  - Serviço: `campaignService.getCampaigns`.  
  - Tela: `CampaignsListView` (cards com status e ações start/pause).  
  - Teste: acessar `/campanhas`, validar botões Iniciar/Pausar chamando `/start` ou `/pause`.

- **GET `/campaigns/:id`**  
  - Serviço: `campaignService.getCampaign`.  
  - Tela: `CampaignDetailsView`.  
  - Teste: abrir `/campanhas/:id`, verificar estatísticas e ações (upload CSV, iniciar, pausar, retomar).

## Conversas & Mensagens

- **GET `/conversations`**  
  - Serviço: `conversationService.getConversations` (aceita filtros `{ page, limit, status, search, operatorId, serviceInstanceId }` e retorna `{ data, meta }`).  
  - Uso: `conversation.store.ts` (lista lateral da `ConversationsView`) e `DashboardView` (cartão “Conversas Recentes”).  
  - Teste: abrir `/conversas`, confirmar que o carregamento inicial chama `/conversations?page=1&limit=100&status=OPEN`; alterar filtros na UI (quando adicionados) deve refletir parâmetros extras.  
  - Observação: como o backend pagina automaticamente, o store mantém apenas `data` enriquecida; `meta` fica disponível para futuras funcionalidades (scroll infinito, badges de total).

- **GET `/conversations/:id`**  
  - Serviço: `conversationService.getConversation`.  
  - Uso: `conversation.store.selectConversation` recupera detalhes completos + mensagens embutidas sempre que o usuário abre um chat específico.  
  - Teste: selecionar uma conversa e validar que os dados (contact/operator/instância) batem com a resposta de rede.

- **GET `/messages/conversation/:conversationId`**  
  - Serviço: `messageService.getMessages` também normaliza `{ data, meta }` e aceita `page/limit`.  
  - Uso: `conversation.store` e o polling em `ConversationsView` (fallback quando WebSocket não entrega). Ambos comparam `response.data.length` para decidir se há novas mensagens.  
  - Teste: com o chat aberto, enviar/receber mensagens e observar o polling chamando `/messages/conversation/{id}?page=1&limit=100`.

- **POST `/messages/send`**  
  - Serviço: `messageService.sendMessage`.  
  - Uso: input principal em `ConversationsView` e fluxo de “Nova Mensagem” (cria conversa, depois envia).  
  - Teste: enviar mensagem manual pela UI; payload deve conter `conversationId`, `content`, `via: 'CHAT_MANUAL'`.

## Relatórios

- **GET `/reports/finished-conversations`**  
  - Serviço: `reportService.getFinishedConversations`.  
  - Tela: `HistoryView` (Histórico).  
  - Teste: usar filtros de data, buscar por nome e observar tabela.  
  - Observação: resultados vêm como array direto; não há paginação server-side.

- **GET `/reports/statistics`**  
  - Serviço: `reportService.getStatistics`.  
  - Telas: `DashboardView` (cards de resumo) e `ReportsView` (cards + métricas).  
  - Teste: abrir `/` e `/relatorios`; filtros de data no segundo caso recalculam estatísticas.

- **GET `/reports/operator-performance`**  
  - Serviço: `reportService.getOperatorPerformance`.  
  - Tela: `ReportsView` (tabela de operadores).  
  - Teste: aplicar filtros e verificar atualização da tabela.

## Webhooks & Health

- **GET `/webhooks/meta`**, **POST `/webhooks/meta`**, **POST `/webhooks/evolution`**  
  - Destino: back-office/integrações externas; **não há consumo direto** no frontend.  
  - Recomenda-se monitorar logs no backend.  

## Observações de Qualidade

- **Feedback de erro**: a maioria das telas exibe `error.response?.data?.message`. Para o caso do `POST /contacts`, o erro de telefone duplicado chega corretamente aos modais de Contatos e Conversas.  
- **Cobertura de endpoints não usados**: `GET /users/me`, `PATCH /users/me/toggle-online`, `GET /service-instances/:id`, `GET /templates/:id`, `GET /tabulations/:id`, `GET /health`, webhooks – documentados aqui, mas sem acionadores visuais. Planejar onde eles devem ficar expostos para validação futura.  
- **Testes manuais sugeridos**:  
  1. Fluxo completo de login → dashboard (cobre auth + stats).  
  2. CRUD de contatos + uso no modal de nova mensagem (cobre contatos + mensagens + conversas).  
  3. Gestão de campanhas (criar, enviar CSV, iniciar/pausar) para cobrir endpoints de campanha e templates.  
  4. Manutenção de instâncias e leitura de QR Code para validar integrações Evolution.  
  5. Relatórios (Histórico + Reports) para confirmar métricas em `/reports/*`.

Com isso, todos os endpoints testados pelo backend estão rastreados no frontend: ou possuem pontos de uso claros, ou foram identificados como lacunas a endereçar.

