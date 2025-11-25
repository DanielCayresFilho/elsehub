import type { Message, Conversation } from '@/types'
import { logStubCall } from './service-stubs'

class WebSocketService {
  private listeners: Map<string, Set<Function>> = new Map()
  private connected = false

  async connect() {
    logStubCall('wsService', 'connect')
    this.connected = true
  }

  joinRoom(conversationId: string) {
    logStubCall('wsService', `joinRoom:${conversationId}`)
  }

  leaveRoom(conversationId: string) {
    logStubCall('wsService', `leaveRoom:${conversationId}`)
  }

  sendMessage(conversationId: string, content: string) {
    logStubCall('wsService', 'sendMessage')
    const message: Message = {
      id: `stub-ws-message-${Date.now()}`,
      conversationId,
      content,
      createdAt: new Date().toISOString()
    }
    this.emit('message:new', message)
  }

  sendTypingStart(conversationId: string) {
    logStubCall('wsService', `typingStart:${conversationId}`)
  }

  sendTypingStop(conversationId: string) {
    logStubCall('wsService', `typingStop:${conversationId}`)
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: Message | Conversation | any) {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  disconnect() {
    logStubCall('wsService', 'disconnect')
    this.connected = false
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.connected
  }
}

export const wsService = new WebSocketService()

