import { api } from './api'
import type { Message, PaginatedResponse } from '@/types'

interface SendMessageRequest {
  conversationId: string
  content: string
  via?: 'INBOUND' | 'CAMPAIGN' | 'CHAT_MANUAL'
}

export const messageService = {
  /**
   * POST /api/messages/send
   * Envia uma mensagem para uma conversa
   * Conforme documentação: POST /api/messages/send
   */
  async sendMessage(conversationId: string, content: string, via: 'INBOUND' | 'CAMPAIGN' | 'CHAT_MANUAL' = 'CHAT_MANUAL'): Promise<Message> {
    const { data } = await api.post<Message>('/messages/send', {
      conversationId,
      content,
      via
    })
    return data
  },

  /**
   * GET /api/messages/conversation/:conversationId
   * Lista mensagens de uma conversa (formato { data, meta })
   */
  async getMessages(conversationId: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Message>> {
    const { page = 1, limit = 100 } = params
    const { data } = await api.get<PaginatedResponse<Message>>(`/messages/conversation/${conversationId}`, {
      params: {
        page,
        limit
      }
    })
    return {
      data: data?.data ?? [],
      meta: data?.meta ?? {
        total: data?.data?.length ?? 0,
        page,
        limit,
        totalPages: 1
      }
    }
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
