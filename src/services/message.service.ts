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

  async getMessages(conversationId: string, page = 1, limit = 100): Promise<PaginatedResponse<Message>> {
    // ✅ CORRETO: Usa o endpoint correto conforme documentação
    // GET /api/messages/conversation/:conversationId
    const { data } = await api.get<PaginatedResponse<Message>>(`/messages/conversation/${conversationId}`, {
      params: { page, limit }
    })
    return data
  }
}
