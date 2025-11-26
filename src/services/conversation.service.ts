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

interface ConversationListParams {
  page?: number
  limit?: number
  status?: ConversationStatus
  operatorId?: string
  serviceInstanceId?: string
  search?: string
}

export const conversationService = {
  /**
   * GET /api/conversations
   * Lista conversas com paginação (formato { data, meta })
   */
  async getConversations(params: ConversationListParams = {}): Promise<PaginatedResponse<Conversation>> {
    const {
      page = 1,
      limit = 10,
      status,
      operatorId,
      serviceInstanceId,
      search
    } = params

    const { data } = await api.get<PaginatedResponse<Conversation>>('/conversations', {
      params: {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(operatorId ? { operatorId } : {}),
        ...(serviceInstanceId ? { serviceInstanceId } : {}),
        ...(search ? { search } : {})
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
   * POST /api/conversations/:id/close
   * Fecha uma conversa com motivo de tabulação
   * Conforme documentação: POST (não PATCH)
   */
  async closeConversation(id: string, tabulationId: string): Promise<void> {
    await api.post(`/conversations/${id}/close`, { tabulationId })
  },

  /**
   * GET /api/conversations/queue
   * Lista conversas na fila (sem operador atribuído)
   */
  async getQueue(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations/queue')
    return data
  }
}

