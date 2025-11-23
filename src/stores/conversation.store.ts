import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { conversationService } from '@/services/conversation.service'
import { messageService } from '@/services/message.service'
import { wsService } from '@/services/websocket.service'

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
      const conversation = await conversationService.getConversation(conversationId)
      activeConversation.value = conversation
      
      // Tenta carregar mensagens da conversa
      // Primeiro verifica se vem no objeto da conversa
      if (conversation.messages && conversation.messages.length > 0) {
        messages.value = conversation.messages
      } else {
        // Se não vier, tenta buscar via endpoint de mensagens
        try {
          const messagesResponse = await messageService.getMessages(conversationId, 1, 100)
          messages.value = messagesResponse.data || []
        } catch (msgError) {
          // Se o endpoint não existir, deixa vazio e espera WebSocket
          console.warn('Endpoint de mensagens não disponível, usando WebSocket:', msgError)
          messages.value = []
        }
      }
      
      // Ordena mensagens por data (mais antigas primeiro)
      messages.value.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt).getTime()
        const dateB = new Date(b.timestamp || b.createdAt).getTime()
        return dateA - dateB
      })
      
      // Join WebSocket room para receber mensagens em tempo real
      wsService.joinRoom(conversationId)
      
      console.log('Conversa selecionada:', conversation)
      console.log('Mensagens carregadas:', messages.value.length)
    } catch (error) {
      console.error('Erro ao selecionar conversa:', error)
      throw error
    }
  }

  function addMessage(message: Message) {
    // Evitar duplicatas
    const exists = messages.value.find(m => m.id === message.id)
    if (exists) return
    
    if (activeConversation.value?.id === message.conversationId) {
      messages.value.push(message)
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
    // Escuta evento message:new conforme documentação
    wsService.on('message:new', (message: Message) => {
      console.log('Nova mensagem recebida via WebSocket:', message)
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

    wsService.on('conversation:closed', (conversation: Conversation) => {
      console.log('Conversa fechada via WebSocket:', conversation)
      // Remove da lista de conversas abertas
      conversations.value = conversations.value.filter(c => c.id !== conversation.id)
      if (activeConversation.value?.id === conversation.id) {
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

