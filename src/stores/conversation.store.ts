import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { ConversationStatus } from '@/types'
import { wsService } from '@/services/websocket.service'
import { conversationService } from '@/services/conversation.service'
import { messageService } from '@/services/message.service'
import { logger } from '@/utils/logger'

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

  function ensureConversationPresence(conversationId: string): Conversation | null {
    const existing = conversations.value.find(c => c.id === conversationId)
    if (existing) return existing
    return null
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
      const response = await conversationService.getConversations({
        page: 1,
        limit: 100,
        status: ConversationStatus.OPEN
      })
      conversations.value = response.data.map(conv => enrichConversation(conv))
      sortConversations()
    } catch (error) {
      logger.error('Erro ao carregar conversas', error)
    } finally {
      loading.value = false
    }
  }

  async function selectConversation(conversationId: string) {
    const isSameConversation = activeConversation.value?.id === conversationId

    try {
      // Busca a conversa completa com mensagens
      const conversation = await conversationService.getConversation(conversationId)
      const enriched = enrichConversation(conversation)
      activeConversation.value = enriched

      const existingIndex = conversations.value.findIndex(c => c.id === conversationId)
      if (existingIndex !== -1) {
        conversations.value[existingIndex] = { ...conversations.value[existingIndex], ...enriched }
      } else {
        addConversation(enriched)
      }
      clearUnread(conversationId)

      // Carrega mensagens se não for a mesma conversa ou se não houver mensagens
      if (!isSameConversation || messages.value.length === 0) {
        const conversationMessages = await messageService.getMessages(conversationId, { page: 1, limit: 100 })
        messages.value = conversationMessages.data.length > 0 
          ? conversationMessages.data 
          : (enriched.messages || [])
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
        await wsService.connect()
      }
      wsService.joinRoom(conversationId)
    } catch (error) {
      logger.error('Erro ao selecionar conversa', error)
      // Não usar fallback mockado - deixar erro propagar ou mostrar mensagem ao usuário
      throw error
    }
  }

  function addMessage(message: Message) {
    // Evitar duplicatas
    const exists = messages.value.find(m => m.id === message.id)
    if (exists) {
      // Atualiza mensagem existente se necessário (ex: status mudou)
      const index = messages.value.findIndex(m => m.id === message.id)
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], ...message }
      }
      return
    }
    
    // Verifica se é da conversa ativa
    if (activeConversation.value?.id === message.conversationId) {
      messages.value.push(message)
      // Ordena após adicionar (mais antigas primeiro)
      messages.value.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt).getTime()
        const dateB = new Date(b.timestamp || b.createdAt).getTime()
        return dateA - dateB
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

  async function closeConversation(conversationId: string, tabulationId: string) {
    try {
      await conversationService.closeConversation(conversationId, tabulationId)
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null
        messages.value = []
      }
    } catch (error) {
      logger.error('Erro ao fechar conversa', error)
      throw error
    }
  }

  function setupWebSocketListeners() {
    // Escuta novas conversas (conforme documentação: conversation:new)
    // Payload: Conversation com serviceInstanceId e serviceInstanceName incluídos
    wsService.on('conversation:new', (conversation: Conversation) => {
      logger.log('[WebSocket] Nova conversa recebida:', conversation)
      // Adiciona a conversa à lista (já vem com serviceInstanceId e serviceInstanceName)
      addConversation(conversation)
    })

    // Escuta evento new_message conforme documentação do backend
    // Payload: { conversationId: string, message: Message }
    wsService.on('new_message', (data: { conversationId: string; message: Message }) => {
      const { conversationId, message } = data
      // Se a conversa não existe na lista, tentar carregar da API
      if (!ensureConversationPresence(conversationId)) {
        loadConversations().catch(err => logger.error('Erro ao carregar conversas após nova mensagem', err))
      }
      addMessage(message)
    })

    // Escuta atualizações de status de mensagens
    wsService.on('message_updated', (data: { conversationId: string; message: Message }) => {
      const { conversationId, message } = data
      // Atualiza a mensagem na lista se estiver na conversa ativa
      if (activeConversation.value?.id === conversationId) {
        const index = messages.value.findIndex(m => m.id === message.id)
        if (index !== -1) {
          messages.value[index] = { ...messages.value[index], ...message }
        }
      }
    })

    wsService.on('conversation_updated', (conversation: Conversation) => {
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

