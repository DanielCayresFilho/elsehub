# 📊 Lista Resumida - Dashboard e Relatórios

## 📈 /dashboard - O que deve aparecer:

### Cards de Estatísticas (4 cards no topo):
1. **Conversas Ativas** 
   - Valor: `stats.activeConversations`
   - Ícone: 💬 (comments)

2. **Mensagens Hoje**
   - Valor: `stats.totalMessages`
   - Ícone: ✉️ (envelope)

3. **Taxa de Resposta**
   - Valor: `stats.responseRate` (%)
   - Ícone: 📈 (chart-line)

4. **Tempo Médio de Resposta**
   - Valor: `stats.averageResponseTime` (formatado)
   - Ícone: 🕐 (clock)

### Conversas Recentes (lado esquerdo):
- Lista das últimas 5 conversas abertas
- Mostra: avatar, nome do contato, última mensagem, tempo desde última mensagem
- Link "Ver todas as conversas" no rodapé

### Ações Rápidas (lado direito):
- Nova Conversa
- Nova Campanha (se não for operador)
- Contatos
- Relatórios (se não for operador)

### Desempenho Semanal (lado direito):
- Taxa de Resposta (com barra de progresso)
- Tempo Médio (com barra de progresso)
- Conversas Fechadas (com barra de progresso)

---

## 📋 /relatorios - O que deve aparecer:

### Filtros (topo):
- Data Início (input date)
- Data Fim (input date)
- Botão "Atualizar"

### Exportações CSV (seção fixa):
1. **Estatísticas Gerais** - Botão de download CSV
2. **Performance de Operadores** - Botão de download CSV
3. **Relatório de Campanhas** - Botão de download CSV
4. **Relatório de Mensagens** - Botão de download CSV

### Cards de Estatísticas (3 cards):
1. **Total de Conversas**
   - Valor: `stats.totalConversations`

2. **Taxa de Resposta**
   - Valor: `stats.responseRate` (%)

3. **Tempo Médio de Resposta**
   - Valor: `stats.averageResponseTime` (formatado)

### Tabela de Performance por Operador:
- Colunas:
  - Operador (nome)
  - Conversas (total)
  - Mensagens (total)
  - Tempo Médio (formatado)

---

## ⚠️ Problema conhecido:

- **Tempo Médio mostrando "NaNm NaNs"**: O valor `avgResponseTime` pode estar vindo como `null` ou `undefined` da API, causando NaN no cálculo.

### Dados que vêm da API (`GET /api/reports/statistics`):
- `totalConversations`
- `openConversations`
- `closedConversations`
- `totalMessages`
- `avgResponseTime` (pode ser null/undefined)
- `avgConversationDuration`

### Campo "Mensagens Hoje":
- Atualmente mostra `totalMessages` (todas as mensagens)
- Pode ser que deveria filtrar apenas mensagens de hoje

