import type { Conversation, PaginatedResponse } from '@/types'
import { ConversationStatus } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

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
    logStubCall('conversationService', 'getConversations')
    return createEmptyPaginated<Conversation>({ page, limit })
  },

  async getConversation(id: string): Promise<Conversation> {
    logStubCall('conversationService', 'getConversation')
    return createMockConversation({ id })
  },

  async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
    logStubCall('conversationService', 'createConversation')
    return createMockConversation({
      id: 'stub-conversation',
      contactId: conversationData.contactId,
      serviceInstanceId: conversationData.serviceInstanceId
    })
  },

  async assignOperator(id: string, operatorId: string): Promise<Conversation> {
    logStubCall('conversationService', 'assignOperator')
    return createMockConversation({ id, operatorId })
  },

  async closeConversation(id: string, tabulationId: string): Promise<void> {
    logStubCall('conversationService', 'closeConversation')
  },

  async getQueue(): Promise<Conversation[]> {
    logStubCall('conversationService', 'getQueue')
    return []
  }
}

const createMockConversation = (overrides?: Partial<Conversation>): Conversation => {
  const now = new Date().toISOString()
  return {
    id: 'stub-conversation-id',
    contactId: 'stub-contact',
    serviceInstanceId: 'stub-instance',
    status: ConversationStatus.OPEN,
    createdAt: now,
    updatedAt: now,
    contactName: 'Contato Demo',
    operatorId: undefined,
    operatorName: undefined,
    messages: [],
    unreadCount: 0,
    ...overrides
  }
}

