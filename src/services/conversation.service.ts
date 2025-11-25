import { api } from './api'
import type { Conversation, PaginatedResponse } from '@/types'
import { ConversationStatus } from '@/types'

interface CreateConversationRequest {
  contactId: string
  serviceInstanceId: string
}

interface AssignOperatorRequest {
  operatorId: string
}

interface CloseConversationRequest {
  tabulationId: string
}

export const conversationService = {
  /**
   * GET /api/conversations
   * Lista conversas com paginação
   */
  async getConversations(page = 1, limit = 10, status?: ConversationStatus): Promise<PaginatedResponse<Conversation>> {
    const { data } = await api.get<PaginatedResponse<Conversation>>('/conversations', {
      params: {
        page,
        limit,
        ...(status && { status })
      }
    })
    return data
  },

  /**
   * GET /api/conversations/:id
   * Busca uma conversa específica com suas mensagens
   */
  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get<Conversation>(`/conversations/${id}`)
    return data
  },

  /**
   * POST /api/conversations
   * Cria uma nova conversa
   */
  async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
    const { data } = await api.post<Conversation>('/conversations', conversationData)
    return data
  },

  /**
   * PATCH /api/conversations/:id/assign
   * Atribui um operador à conversa
   */
  async assignOperator(id: string, operatorId: string): Promise<Conversation> {
    const { data } = await api.patch<Conversation>(`/conversations/${id}/assign`, { operatorId })
    return data
  },

  /**
   * PATCH /api/conversations/:id/close
   * Fecha uma conversa com motivo de tabulação
   */
  async closeConversation(id: string, tabulationId: string): Promise<void> {
    await api.patch(`/conversations/${id}/close`, { tabulationId })
  },

  /**
   * GET /api/conversations/queued
   * Lista conversas na fila (sem operador atribuído)
   */
  async getQueue(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations/queued')
    return data
  }
}

