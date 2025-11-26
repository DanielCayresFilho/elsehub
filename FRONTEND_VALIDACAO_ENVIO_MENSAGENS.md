# ✅ Validações Frontend - Envio de Mensagens

## 📋 O que foi implementado

Validações no frontend para prevenir erros 400 antes de enviar mensagens e melhorar o diagnóstico.

---

## ✅ Validações Adicionadas

### 1. **Verificação de Conversa Existente**
- ✅ Verifica se a conversa existe antes de tentar enviar
- ✅ Alerta o usuário se a conversa não for encontrada

### 2. **Verificação de Status da Conversa**
- ✅ Verifica se a conversa está `OPEN` antes de enviar
- ✅ Bloqueia envio se a conversa estiver fechada

### 3. **Validação de serviceInstanceId** ⚠️ **CRÍTICO**
- ✅ Verifica se a conversa tem `serviceInstanceId` antes de enviar
- ✅ Alerta o usuário se faltar a instância
- ✅ Loga detalhes quando a conversa não tem instância

### 4. **Logs Detalhados para Debug**
- ✅ Loga informações completas antes de enviar:
  - `conversationId`
  - `serviceInstanceId`
  - `serviceInstanceName`
  - `status`
  - `messageLength`
- ✅ Loga detalhes completos em caso de erro:
  - Status HTTP
  - Resposta do backend
  - Dados completos da conversa

### 5. **Validação ao Selecionar Conversa**
- ✅ Verifica se a conversa tem `serviceInstanceId` quando é selecionada
- ✅ Loga warning se faltar instância (mas não bloqueia)

---

## 🔍 Código das Validações

### Função `sendMessage()` - Validações Antes de Enviar

```typescript
// 1. Verifica se conversa existe
if (!conversation) {
  logger.error('Conversa não encontrada ao tentar enviar mensagem')
  alert('Conversa não encontrada. Recarregue a página e tente novamente.')
  return
}

// 2. Verifica se conversa está aberta
if (conversation.status !== ConversationStatus.OPEN) {
  alert('Não é possível enviar mensagens para uma conversa fechada.')
  return
}

// 3. Verifica se tem serviceInstanceId (CRÍTICO)
if (!conversation.serviceInstanceId) {
  logger.error('❌ Conversa sem serviceInstanceId!', {
    conversationId: conversation.id,
    conversation: conversation
  })
  alert('Erro: Conversa sem instância vinculada. Recarregue a página e tente novamente.')
  return
}

// 4. Logs detalhados antes de enviar
logger.log('📤 Enviando mensagem:', {
  conversationId: conversation.id,
  serviceInstanceId: conversation.serviceInstanceId,
  serviceInstanceName: conversation.serviceInstanceName,
  status: conversation.status,
  messageLength: newMessage.value.trim().length
})
```

### Função `selectConversation()` - Validação ao Selecionar

```typescript
// Valida se a conversa tem serviceInstanceId
if (!conversation.serviceInstanceId) {
  logger.warn('⚠️ Conversa sem serviceInstanceId ao selecionar:', {
    conversationId: conversation.id,
    conversation: conversation
  })
}
```

---

## 📊 Fluxo Completo de Validação

```
1. Usuário tenta enviar mensagem
   ↓
2. ✅ Verifica se conversa existe
   ↓
3. ✅ Verifica se conversa está OPEN
   ↓
4. ✅ Verifica se tem serviceInstanceId ⚠️ CRÍTICO
   ↓
5. 📝 Loga detalhes para debug
   ↓
6. 📤 Envia mensagem via API
   ↓
7. ✅ Se erro 400:
   - Loga detalhes completos
   - Mostra mensagem do backend
   - Restaura mensagem no campo
```

---

## 🐛 Diagnóstico de Erros

### Se a validação de `serviceInstanceId` falhar:

**O que acontece:**
- ❌ Mensagem não é enviada
- ⚠️ Alerta é mostrado ao usuário
- 📝 Log detalhado é registrado no console

**O que verificar:**
1. Se a conversa foi criada corretamente com `serviceInstanceId`
2. Se o evento `conversation:new` está enviando `serviceInstanceId`
3. Se o endpoint `GET /api/conversations/:id` retorna `serviceInstanceId`

**Como debugar:**
```javascript
// No console do navegador:
const conversation = activeConversation.value
console.log('ServiceInstanceId:', conversation.serviceInstanceId)
console.log('ServiceInstanceName:', conversation.serviceInstanceName)
console.log('Conversa completa:', conversation)
```

### Se houver erro 400 mesmo com validações:

**Logs mostram:**
```javascript
❌ Erro ao enviar mensagem
📋 Detalhes do erro: {
  status: 400,
  data: { message: "Mensagem do backend" },
  conversationId: "...",
  conversationStatus: "OPEN",
  serviceInstanceId: "...",
  serviceInstanceName: "...",
  conversation: { ... }
}
```

**O que verificar nos logs do backend:**
- Qual validação específica falhou
- Se a instância existe e está ativa
- Se há problema na comunicação com Evolution API

---

## 🔗 Integração com Backend

As validações do frontend trabalham em conjunto com as validações do backend:

**Frontend valida:**
- ✅ Conversa existe
- ✅ Conversa está aberta
- ✅ Conversa tem `serviceInstanceId`

**Backend valida:**
- ✅ Conversa existe no banco
- ✅ Conversa está aberta
- ✅ `serviceInstanceId` existe
- ✅ Instância está ativa (`isActive: true`)
- ✅ Instância está conectada

---

## 📝 Logs em Desenvolvimento

Todos os logs só aparecem em modo desenvolvimento (conforme `logger.ts`):

- ✅ `logger.log()` - Logs informativos
- ⚠️ `logger.warn()` - Avisos
- ❌ `logger.error()` - Erros (sempre logados)

**Em produção:**
- Apenas erros são logados
- Logs informativos são silenciados
- Melhor performance e segurança

---

## ✅ Próximos Passos

1. **Testar em produção** e verificar logs do backend
2. **Verificar se conversas INBOUND** estão chegando com `serviceInstanceId`
3. **Monitorar erros 400** e comparar com logs do backend
4. **Ajustar validações** conforme necessário baseado nos resultados

---

**Status**: ✅ Implementado e pronto para testes

**Última atualização**: Janeiro 2025

