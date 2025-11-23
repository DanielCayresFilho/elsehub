import { api } from './api'
import type { Message, PaginatedResponse } from '@/types'

interface SendMessageRequest {
  conversationId: string
  content: string
}

export const messageService = {
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const payload: SendMessageRequest = { conversationId, content }
    const { data } = await api.post<Message>('/messages/send', payload)
    return data
  },

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<PaginatedResponse<Message>> {
    try {
      // Tenta primeiro o endpoint específico
      const { data } = await api.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, {
        params: { page, limit }
      })
      return data
    } catch (error: any) {
      // Se não existir, tenta endpoint alternativo
      if (error.response?.status === 404) {
        console.log('Endpoint /conversations/:id/messages não encontrado, tentando /messages...')
        const { data } = await api.get<PaginatedResponse<Message>>(`/messages`, {
          params: { conversationId, page, limit }
        })
        return data
      }
      throw error
    }
  }
}
