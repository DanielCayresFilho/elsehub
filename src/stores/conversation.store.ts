import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { conversationService } from '@/services/conversation.service'
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
      messages.value = conversation.messages || []
      
      // Join WebSocket room para receber mensagens em tempo real
      wsService.joinRoom(conversationId)
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

