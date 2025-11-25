import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { conversationService } from '@/services/conversation.service'
import { messageService } from '@/services/message.service'
import { wsService } from '@/services/websocket.service'
import { api } from '@/services/api'

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
  const pendingConversationFetches = new Map<string, Promise<Conversation | null>>()
  
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
  
  async function ensureConversationLoaded(conversationId: string) {
    const existing = conversations.value.find(c => c.id === conversationId)
    if (existing) return existing
    
    if (pendingConversationFetches.has(conversationId)) {
      return pendingConversationFetches.get(conversationId)!
    }
    
    const fetchPromise = conversationService.getConversation(conversationId)
      .then(conv => {
        if (conv) {
          addConversation(conv)
          return conversations.value.find(c => c.id === conversationId) ?? conv
        }
        return null
      })
      .catch(error => {
        console.error('Erro ao buscar conversa em tempo real:', error)
        return null
      })
      .finally(() => {
        pendingConversationFetches.delete(conversationId)
      })
    
    pendingConversationFetches.set(conversationId, fetchPromise)
    return fetchPromise
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
      const response = await conversationService.getConversations(1, 50)
      conversations.value = response.data.map(enrichConversation)
      sortConversations()
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      loading.value = false
    }
  }

  async function selectConversation(conversationId: string) {
    try {
      console.log('Selecionando conversa:', conversationId)
      
      // Verifica se é a mesma conversa ANTES de atualizar activeConversation
      const isSameConversation = activeConversation.value?.id === conversationId
      const existingMessages = isSameConversation ? [...messages.value] : []
      
      const conversation = enrichConversation(await conversationService.getConversation(conversationId))
      activeConversation.value = conversation
      
      const existingIndex = conversations.value.findIndex(c => c.id === conversationId)
      if (existingIndex !== -1) {
        conversations.value[existingIndex] = { ...conversations.value[existingIndex], ...conversation }
      } else {
        addConversation(conversation)
      }
      clearUnread(conversationId)
      
      console.log('Conversa carregada:', conversation)
      console.log('Mensagens no objeto:', conversation.messages?.length || 0)
      console.log('É a mesma conversa?', isSameConversation)
      console.log('Mensagens existentes:', existingMessages.length)
      
      // Se mudou de conversa, limpa mensagens
      if (!isSameConversation) {
        messages.value = []
      }
      
      // Tenta carregar mensagens da conversa apenas se não tiver mensagens ainda
      if (messages.value.length === 0) {
        // Primeiro verifica se vem no objeto da conversa
          if (conversation.messages && conversation.messages.length > 0) {
            console.log('Carregando mensagens do objeto da conversa')
            messages.value = conversation.messages
        } else {
          // Se não vier, tenta buscar via endpoint de mensagens
          console.log('Tentando buscar mensagens via endpoint...')
          try {
            // ✅ Conforme documentação: retorna array direto
            const messagesArray = await messageService.getMessages(conversationId, 1, 100)
            console.log('Mensagens recebidas do endpoint:', messagesArray.length)
            messages.value = messagesArray
          } catch (msgError: any) {
            // Se o endpoint não existir (404), preserva mensagens existentes se for a mesma conversa
            console.warn('Endpoint de mensagens não disponível. Usando apenas WebSocket para receber mensagens em tempo real.')
            if (isSameConversation && existingMessages.length > 0) {
              console.log('Preservando mensagens existentes da mesma conversa:', existingMessages.length)
              messages.value = existingMessages
            } else {
              messages.value = []
            }
          }
        }
      } else {
        console.log('Mantendo mensagens já carregadas:', messages.value.length)
      }
      
      if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1]
        updateConversationMetadata(conversationId, lastMessage)
      }
      
      // Ordena mensagens por data (mais antigas primeiro)
      if (messages.value.length > 0) {
        messages.value.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt).getTime()
          const dateB = new Date(b.timestamp || b.createdAt).getTime()
          return dateA - dateB
        })
      }
      
      // Join WebSocket room para receber mensagens em tempo real
      // Aguarda um pouco para garantir que WebSocket está conectado
      if (wsService.isConnected()) {
        wsService.joinRoom(conversationId)
      } else {
        console.warn('WebSocket não conectado, tentando conectar antes de entrar na sala...')
        wsService.connect()
        // Aguarda conexão e então entra na sala
        setTimeout(() => {
          if (wsService.isConnected()) {
            wsService.joinRoom(conversationId)
          } else {
            console.error('Não foi possível conectar ao WebSocket')
          }
        }, 1000)
      }
      
      console.log('Conversa selecionada:', conversation)
      console.log('Total de mensagens carregadas:', messages.value.length)
      if (messages.value.length > 0) {
        console.log('Primeiras mensagens:', messages.value.slice(0, 3))
      }
    } catch (error) {
      console.error('Erro ao selecionar conversa:', error)
      throw error
    }
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

  async function closeConversation(conversationId: string, tabulationId: string) {
    try {
      await conversationService.closeConversation(conversationId, tabulationId)
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null
        messages.value = []
      }
    } catch (error) {
      console.error('Erro ao fechar conversa:', error)
      throw error
    }
  }

  function setupWebSocketListeners() {
    console.log('Configurando listeners do WebSocket...')
    
    // Escuta evento message:new conforme documentação
    wsService.on('message:new', async (message: Message) => {
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
      await ensureConversationLoaded(message.conversationId)
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

