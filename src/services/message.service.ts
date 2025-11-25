import type { Message } from '@/types'
import { logStubCall } from './service-stubs'

interface SendMessageRequest {
  conversationId: string
  content: string
  via: string
}

export const messageService = {
  // ✅ Conforme documentação: POST /api/messages/send
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    logStubCall('messageService', 'sendMessage')
    return createMockMessage({
      conversationId,
      content
    })
  },

  // ✅ Conforme documentação: GET /api/messages/conversation/:conversationId
  // Retorna array direto, não paginado
  async getMessages(conversationId: string, page = 1, limit = 100): Promise<Message[]> {
    logStubCall('messageService', 'getMessages')
    return []
  }
}

const createMockMessage = (overrides?: Partial<Message>): Message => {
  const now = new Date().toISOString()
  return {
    id: `stub-message-${Date.now()}`,
    conversationId: overrides?.conversationId ?? 'stub-conversation',
    content: overrides?.content ?? 'Mensagem de exemplo. Backend desativado.',
    createdAt: now,
    direction: 'OUTBOUND',
    fromMe: true,
    ...overrides
  }
}
