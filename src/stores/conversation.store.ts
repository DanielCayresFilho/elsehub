import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { ConversationStatus } from '@/types'
import { wsService } from '@/services/websocket.service'

const MEDIA_PREVIEW_MAP: Record<string, string> = {
  IMAGE: '[Imagem recebida]',
  AUDIO: '[Áudio recebido]',
  DOCUMENT: '[Documento recebido]',
  VIDEO: '[Vídeo recebido]',
  STICKER: '[Sticker recebido]'
}

export function getMessagePreviewLabel(message?: Message | null): string {
  if (!message) return ''

  if (message.hasMedia) {
    if (message.mediaCaption) return message.mediaCaption
    if (message.mediaType && MEDIA_PREVIEW_MAP[message.mediaType]) {
      return MEDIA_PREVIEW_MAP[message.mediaType]
    }
    return '📎 Arquivo recebido'
  }

  if (message.content && message.content.trim().length > 0) {
    return message.content
  }

  if (message.direction === 'OUTBOUND') {
    return 'Mensagem enviada'
  }

  return 'Mensagem recebida'
}

function resolveMessageDirection(message: Message): 'INBOUND' | 'OUTBOUND' {
  if (message.direction === 'INBOUND' || message.direction === 'OUTBOUND') {
    return message.direction
  }
  if (message.fromMe === true) {
    return 'OUTBOUND'
  }
  if (message.fromMe === false) {
    return 'INBOUND'
  }
  return 'INBOUND'
}

function getLastMessage(conversation: Conversation): Message | undefined {
  if (!conversation.messages || conversation.messages.length === 0) return undefined
  return conversation.messages[conversation.messages.length - 1]
}

function enrichConversation(conversation: Conversation): Conversation {
  const lastMessage = getLastMessage(conversation)
  const previewFromMessage = lastMessage ? getMessagePreviewLabel(lastMessage) : ''
  const fallbackPreview = conversation.lastMessagePreview || ''
  const resolvedPreview = previewFromMessage || fallbackPreview
  const lastDirection = lastMessage ? resolveMessageDirection(lastMessage) : conversation.lastMessageDirection
  const lastTimestamp = lastMessage?.timestamp || lastMessage?.createdAt || conversation.lastMessageAt || conversation.updatedAt
  const customerPreview = conversation.lastCustomerMessagePreview ??
    (lastDirection === 'INBOUND' ? (previewFromMessage || fallbackPreview || null) : null)

  return {
    ...conversation,
    lastMessagePreview: resolvedPreview,
    lastMessageAt: lastTimestamp,
    lastMessageDirection: lastDirection,
    lastCustomerMessagePreview: customerPreview
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const loading = ref(false)
  
  function sortConversations() {
    conversations.value.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt).getTime()
      const dateB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt).getTime()
      return dateB - dateA
    })
  }
  
  function clearUnread(conversationId: string) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations.value[index].unreadCount = 0
    }
    if (activeConversation.value?.id === conversationId) {
      activeConversation.value.unreadCount = 0
    }
  }

  function ensureConversationPresence(conversationId: string): Conversation {
    const existing = conversations.value.find(c => c.id === conversationId)
    if (existing) return existing

    const placeholder = createDemoConversation(conversationId)
    addConversation(placeholder)
    return placeholder
  }
  
  function updateConversationMetadata(conversationId: string, message?: Message) {
    if (!message) return
    const preview = getMessagePreviewLabel(message)
    const timestamp = message.timestamp || message.createdAt
    const direction = resolveMessageDirection(message)
    const isActive = activeConversation.value?.id === conversationId
    
    const applyUpdates = (conversation: Conversation | null) => {
      if (!conversation) return
      conversation.lastMessageAt = timestamp
      conversation.lastMessagePreview = preview
      conversation.lastMessageDirection = direction
      if (direction === 'INBOUND') {
        conversation.lastCustomerMessagePreview = preview
        if (isActive) {
          conversation.unreadCount = 0
        } else {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1
        }
      } else if (isActive) {
        conversation.unreadCount = 0
      }
    }
    
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      applyUpdates(conversations.value[index])
    }
    
    if (isActive) {
      applyUpdates(activeConversation.value)
    }
    
    sortConversations()
  }
  
  // Função para atualizar mensagens diretamente (usado pelo polling)
  function setMessages(newMessages: Message[]) {
    messages.value = newMessages
    // Ordena mensagens por data (mais antigas primeiro)
    messages.value.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt).getTime()
      const dateB = new Date(b.timestamp || b.createdAt).getTime()
      return dateA - dateB
    })
    
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage) {
      updateConversationMetadata(lastMessage.conversationId, lastMessage)
      clearUnread(lastMessage.conversationId)
    }
  }

  async function loadConversations() {
    loading.value = true
    try {
      console.warn('Conversas: backend desativado, carregando lista local.')
      conversations.value = []
      sortConversations()
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      loading.value = false
    }
  }

  async function selectConversation(conversationId: string) {
    console.log('Selecionando conversa (stub):', conversationId)
    const isSameConversation = activeConversation.value?.id === conversationId

    const baseConversation = ensureConversationPresence(conversationId)
    const enriched = enrichConversation(baseConversation)
    activeConversation.value = enriched

    const existingIndex = conversations.value.findIndex(c => c.id === conversationId)
    if (existingIndex !== -1) {
      conversations.value[existingIndex] = { ...conversations.value[existingIndex], ...enriched }
    } else {
      addConversation(enriched)
    }
    clearUnread(conversationId)

    messages.value = isSameConversation ? [...messages.value] : []
    if (messages.value.length === 0) {
      messages.value = enriched.messages?.length ? [...enriched.messages] : [createDemoMessage(conversationId)]
    }

    messages.value.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt).getTime()
      const dateB = new Date(b.timestamp || b.createdAt).getTime()
      return dateA - dateB
    })

    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage) {
      updateConversationMetadata(conversationId, lastMessage)
    }

    if (!wsService.isConnected()) {
      wsService.connect()
    }
    wsService.joinRoom(conversationId)
  }

  function addMessage(message: Message) {
    console.log('📝 Adicionando mensagem ao store:', message)
    console.log('📝 Direção da mensagem:', message.direction)
    console.log('📝 fromMe:', (message as any).fromMe)
    console.log('📝 senderId:', message.senderId)
    console.log('📝 senderName:', message.senderName)
    
    // Evitar duplicatas
    const exists = messages.value.find(m => m.id === message.id)
    if (exists) {
      console.log('⚠️ Mensagem já existe, atualizando...')
      // Atualiza mensagem existente se necessário (ex: status mudou)
      const index = messages.value.findIndex(m => m.id === message.id)
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], ...message }
        console.log('✅ Mensagem atualizada:', messages.value[index])
      }
      return
    }
    
    // Verifica se é da conversa ativa
    if (activeConversation.value?.id === message.conversationId) {
      console.log('✅ Adicionando mensagem à lista (conversa ativa)')
      messages.value.push(message)
      // Ordena após adicionar (mais antigas primeiro)
      messages.value.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt).getTime()
        const dateB = new Date(b.timestamp || b.createdAt).getTime()
        return dateA - dateB
      })
      console.log('✅ Total de mensagens após adicionar:', messages.value.length)
      console.log('✅ Últimas 3 mensagens:', messages.value.slice(-3).map(m => ({
        id: m.id,
        direction: m.direction,
        content: m.content?.substring(0, 30)
      })))
    } else {
      console.log('⚠️ Mensagem ignorada (não é da conversa ativa):', {
        messageConversationId: message.conversationId,
        activeConversationId: activeConversation.value?.id
      })
    }
    
    // Update conversation list
    updateConversationMetadata(message.conversationId, message)
  }

  function addConversation(conversation: Conversation) {
    const normalized = enrichConversation(conversation)
    const index = conversations.value.findIndex(c => c.id === normalized.id)
    if (index !== -1) {
      conversations.value[index] = { ...conversations.value[index], ...normalized }
    } else {
      conversations.value.unshift(normalized)
    }
    sortConversations()
  }

  async function closeConversation(conversationId: string, _tabulationId: string) {
    console.warn('Fechando conversa (stub):', conversationId)
    conversations.value = conversations.value.filter(c => c.id !== conversationId)
    if (activeConversation.value?.id === conversationId) {
      activeConversation.value = null
      messages.value = []
    }
  }

  function setupWebSocketListeners() {
    console.log('Configurando listeners do WebSocket...')
    
    // Escuta evento message:new conforme documentação
    wsService.on('message:new', (message: Message) => {
      console.log('🔔 Nova mensagem recebida via WebSocket:', message)
      console.log('🔔 Detalhes:', {
        id: message.id,
        conversationId: message.conversationId,
        direction: message.direction,
        content: message.content?.substring(0, 50),
        senderName: message.senderName,
        fromMe: (message as any).fromMe
      })
      console.log('Conversa ativa:', activeConversation.value?.id)
      console.log('Conversa da mensagem:', message.conversationId)
      console.log('É da conversa ativa?', activeConversation.value?.id === message.conversationId)
      ensureConversationPresence(message.conversationId)
      addMessage(message)
    })

    wsService.on('conversation:updated', (conversation: Conversation) => {
      console.log('Conversa atualizada via WebSocket:', conversation)
      const normalized = enrichConversation(conversation)
      const index = conversations.value.findIndex(c => c.id === normalized.id)
      if (index !== -1) {
        conversations.value[index] = { ...conversations.value[index], ...normalized }
      } else {
        conversations.value.unshift(normalized)
      }
      sortConversations()
      
      if (activeConversation.value?.id === normalized.id) {
        activeConversation.value = { ...activeConversation.value, ...normalized }
        if (normalized.messages) {
          messages.value = [...normalized.messages]
          messages.value.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt).getTime()
            const dateB = new Date(b.timestamp || b.createdAt).getTime()
            return dateA - dateB
          })
          const lastMessage = messages.value[messages.value.length - 1]
          updateConversationMetadata(normalized.id, lastMessage)
        }
      }
    })

    wsService.on('conversation:closed', (data: { conversationId: string } | Conversation) => {
      console.log('Conversa fechada via WebSocket:', data)
      // O payload pode ser { conversationId } ou Conversation completo
      const conversationId = 'conversationId' in data ? data.conversationId : data.id
      
      // Remove da lista de conversas abertas
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null
        messages.value = []
      }
    })

    // Mantém compatibilidade com eventos antigos
    wsService.on('newMessage', (message: Message) => {
      addMessage(message)
    })

    wsService.on('conversationAssigned', (conversation: Conversation) => {
      addConversation(conversation)
    })
  }

  function createDemoConversation(id: string): Conversation {
    const now = new Date().toISOString()
    return {
      id,
      contactId: 'stub-contact',
      contactName: 'Contato Demo',
      serviceInstanceId: 'stub-instance',
      serviceInstanceName: 'Instância Demo',
      status: ConversationStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      unreadCount: 0,
      messages: [createDemoMessage(id)]
    }
  }

  function createDemoMessage(conversationId: string): Message {
    return {
      id: `stub-message-${conversationId}`,
      conversationId,
      content: 'Conversa demo sem backend.',
      createdAt: new Date().toISOString(),
      direction: 'OUTBOUND',
      fromMe: true
    }
  }

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    loadConversations,
    selectConversation,
    addMessage,
    addConversation,
    closeConversation,
    setupWebSocketListeners,
    setMessages
  }
})

