import { api } from './api'
import type { Conversation, PaginatedResponse } from '@/types'

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
  async getConversations(page = 1, limit = 10): Promise<PaginatedResponse<Conversation>> {
    const { data } = await api.get<PaginatedResponse<Conversation>>('/conversations', {
      params: { page, limit }
    })
    return data
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get<Conversation>(`/conversations/${id}`)
    return data
  },

  async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
    const { data } = await api.post<Conversation>('/conversations', conversationData)
    return data
  },

  async assignOperator(id: string, operatorId: string): Promise<Conversation> {
    const payload: AssignOperatorRequest = { operatorId }
    const { data } = await api.patch<Conversation>(`/conversations/${id}/assign`, payload)
    return data
  },

  async closeConversation(id: string, tabulationId: string): Promise<void> {
    const payload: CloseConversationRequest = { tabulationId }
    await api.post(`/conversations/${id}/close`, payload)
  },

  async getQueue(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations/queue')
    return data
  }
}

