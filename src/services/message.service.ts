import { api } from './api'
import type { Message } from '@/types'

interface SendMessageRequest {
  conversationId: string
  content: string
  via?: 'CHAT_MANUAL' | 'CAMPAIGN'
}

export const messageService = {
  /**
   * POST /api/messages
   * Envia uma mensagem para uma conversa
   * Conforme documentação: POST /api/messages
   */
  async sendMessage(conversationId: string, content: string, via: 'CHAT_MANUAL' | 'CAMPAIGN' = 'CHAT_MANUAL'): Promise<Message> {
    const { data } = await api.post<Message>('/messages', {
      conversationId,
      content,
      via
    })
    return data
  },

  /**
   * GET /api/messages/conversation/:conversationId
   * Lista mensagens de uma conversa
   * Conforme documentação: retorna array direto, não paginado
   */
  async getMessages(conversationId: string, page = 1, limit = 100): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/messages/conversation/${conversationId}`, {
      params: {
        page,
        limit
      }
    })
    return data
  },

  /**
   * GET /api/messages/:id
   * Busca uma mensagem específica
   */
  async getMessage(id: string): Promise<Message> {
    const { data } = await api.get<Message>(`/messages/${id}`)
    return data
  },

  /**
   * GET /api/messages/:id/media
   * Baixa mídia de uma mensagem
   * Retorna o arquivo como blob/stream
   */
  async getMedia(id: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/messages/${id}/media`, {
      responseType: 'blob'
    })
    return data
  }
}
