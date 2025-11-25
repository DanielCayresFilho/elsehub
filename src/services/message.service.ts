import { api } from './api'
import type { Message, PaginatedResponse } from '@/types'

interface SendMessageRequest {
  conversationId: string
  content: string
  via: string
}

export const messageService = {
  // ✅ Conforme documentação: POST /api/messages/send
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const payload: SendMessageRequest = {
      conversationId,
      content,
      via: 'CHAT_MANUAL'
    }
    // Conforme documentação: usa /messages/send diretamente
    const { data } = await api.post<Message>('/messages/send', payload)
    return data
  },

  // ✅ Conforme documentação: GET /api/messages/conversation/:conversationId
  // Retorna array direto, não paginado
  async getMessages(conversationId: string, page = 1, limit = 100): Promise<Message[]> {
    const { data } = await api.get<Message[] | PaginatedResponse<Message>>(`/messages/conversation/${conversationId}`, {
      params: { page, limit }
    })
    
    // Se retornar array direto, retorna
    if (Array.isArray(data)) {
      return data
    }
    
    // Se retornar objeto paginado, retorna data
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as PaginatedResponse<Message>).data
    }
    
    return []
  }
}
