import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { conversationService } from '@/services/conversation.service'
import { messageService } from '@/services/message.service'
import { wsService } from '@/services/websocket.service'
import { api } from '@/services/api'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const loading = ref(false)

  async function loadConversations() {
    loading.value = true
    try {
      const response = await conversationService.getConversations(1, 50)
      conversations.value = response.data
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      loading.value = false
    }
  }

  async function selectConversation(conversationId: string) {
    try {
      console.log('Selecionando conversa:', conversationId)
      
      const conversation = await conversationService.getConversation(conversationId)
      activeConversation.value = conversation
      
      console.log('Conversa carregada:', conversation)
      console.log('Mensagens no objeto:', conversation.messages?.length || 0)
      
      // Limpa mensagens anteriores
      messages.value = []
      
      // Tenta carregar mensagens da conversa
      // Primeiro verifica se vem no objeto da conversa
      if (conversation.messages && conversation.messages.length > 0) {
        console.log('Carregando mensagens do objeto da conversa')
        messages.value = conversation.messages
      } else {
        // Se não vier, tenta buscar via endpoint de mensagens
        console.log('Tentando buscar mensagens via endpoint...')
        try {
          const messagesResponse = await messageService.getMessages(conversationId, 1, 100)
          console.log('Mensagens recebidas do endpoint:', messagesResponse.data?.length || 0)
          messages.value = messagesResponse.data || []
        } catch (msgError: any) {
          // Se o endpoint não existir (404), tenta endpoint alternativo
          console.warn('Endpoint /conversations/:id/messages não disponível, tentando alternativas:', msgError)
          
          // Tenta endpoint alternativo: GET /api/messages?conversationId=...
          try {
            const { data } = await api.get<Message[] | { data: Message[] }>(`/messages`, {
              params: { conversationId, page: 1, limit: 100 }
            })
            console.log('Mensagens recebidas do endpoint alternativo:', data)
            // Pode retornar array direto ou objeto com data
            if (Array.isArray(data)) {
              messages.value = data
            } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
              messages.value = data.data
            } else {
              messages.value = []
            }
            console.log('Mensagens processadas:', messages.value.length)
          } catch (altError: any) {
            console.warn('Nenhum endpoint de mensagens disponível, usando apenas WebSocket:', altError)
            console.warn('Erro detalhado:', {
              status: altError.response?.status,
              message: altError.response?.data?.message || altError.message,
              url: altError.config?.url
            })
            messages.value = []
          }
        }
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
      wsService.joinRoom(conversationId)
      
      console.log('Conversa selecionada:', conversation)
      console.log('Total de mensagens carregadas:', messages.value.length)
      console.log('Mensagens:', messages.value)
    } catch (error) {
      console.error('Erro ao selecionar conversa:', error)
      throw error
    }
  }

  function addMessage(message: Message) {
    console.log('Adicionando mensagem ao store:', message)
    
    // Evitar duplicatas
    const exists = messages.value.find(m => m.id === message.id)
    if (exists) {
      // Atualiza mensagem existente se necessário (ex: status mudou)
      const index = messages.value.findIndex(m => m.id === message.id)
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], ...message }
        console.log('Mensagem atualizada:', messages.value[index])
      }
      return
    }
    
    // Verifica se é da conversa ativa
    if (activeConversation.value?.id === message.conversationId) {
      console.log('Adicionando mensagem à lista (conversa ativa)')
      messages.value.push(message)
      // Ordena após adicionar (mais antigas primeiro)
      messages.value.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt).getTime()
        const dateB = new Date(b.timestamp || b.createdAt).getTime()
        return dateA - dateB
      })
      console.log('Total de mensagens após adicionar:', messages.value.length)
    } else {
      console.log('Mensagem ignorada (não é da conversa ativa):', {
        messageConversationId: message.conversationId,
        activeConversationId: activeConversation.value?.id
      })
    }
    
    // Update conversation list
    const convIndex = conversations.value.findIndex(c => c.id === message.conversationId)
    if (convIndex !== -1) {
      conversations.value[convIndex].lastMessageAt = message.timestamp || message.createdAt
    }
  }

  function addConversation(conversation: Conversation) {
    const exists = conversations.value.find(c => c.id === conversation.id)
    if (!exists) {
      conversations.value.unshift(conversation)
    }
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
    wsService.on('message:new', (message: Message) => {
      console.log('🔔 Nova mensagem recebida via WebSocket:', message)
      console.log('Conversa ativa:', activeConversation.value?.id)
      console.log('Conversa da mensagem:', message.conversationId)
      addMessage(message)
    })

    wsService.on('conversation:updated', (conversation: Conversation) => {
      console.log('Conversa atualizada via WebSocket:', conversation)
      // Atualiza conversa na lista se existir
      const index = conversations.value.findIndex(c => c.id === conversation.id)
      if (index !== -1) {
        conversations.value[index] = conversation
      } else {
        addConversation(conversation)
      }
      
      // Se for a conversa ativa, atualiza também
      if (activeConversation.value?.id === conversation.id) {
        activeConversation.value = conversation
        if (conversation.messages) {
          messages.value = conversation.messages
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
    setupWebSocketListeners
  }
})

