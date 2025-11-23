import { api } from './api'
import type { Message } from '@/types'

interface SendMessageRequest {
  conversationId: string
  content: string
}

export const messageService = {
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const payload: SendMessageRequest = { conversationId, content }
    const { data } = await api.post<Message>('/messages/send', payload)
    return data
  }
}

