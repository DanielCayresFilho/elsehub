import { io, Socket } from 'socket.io-client'
import type { Message, Conversation } from '@/types'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect() {
    if (this.socket?.connected) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No access token found for WebSocket connection')
      return
    }

    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado')
    })

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado')
    })

    this.socket.on('newMessage', (message: Message) => {
      this.emit('newMessage', message)
    })

    this.socket.on('conversationAssigned', (conversation: Conversation) => {
      this.emit('conversationAssigned', conversation)
    })

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
    })
  }

  joinRoom(conversationId: string) {
    this.socket?.emit('joinRoom', { conversationId })
  }

  leaveRoom(conversationId: string) {
    this.socket?.emit('leaveRoom', { conversationId })
  }

  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('sendMessage', { conversationId, content })
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

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const wsService = new WebSocketService()

