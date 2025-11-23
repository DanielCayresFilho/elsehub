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

    // Conecta ao WebSocket conforme documentação
    // Se VITE_WS_URL não terminar com /chat, adiciona
    let wsUrl = import.meta.env.VITE_WS_URL || ''
    if (wsUrl && !wsUrl.endsWith('/chat')) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/chat'
    }
    
    this.socket = io(wsUrl, {
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

    // Eventos do servidor conforme documentação
    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message)
    })

    this.socket.on('conversation:updated', (conversation: Conversation) => {
      this.emit('conversation:updated', conversation)
    })

    this.socket.on('conversation:closed', (conversation: Conversation) => {
      this.emit('conversation:closed', conversation)
    })

    // Mantém compatibilidade com eventos antigos
    this.socket.on('newMessage', (message: Message) => {
      this.emit('message:new', message)
    })

    this.socket.on('conversationAssigned', (conversation: Conversation) => {
      this.emit('conversation:updated', conversation)
    })

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
    })
  }

  joinRoom(conversationId: string) {
    // Usa o evento correto conforme documentação
    this.socket?.emit('conversation:join', { conversationId })
  }

  leaveRoom(conversationId: string) {
    // Usa o evento correto conforme documentação
    this.socket?.emit('conversation:leave', { conversationId })
  }

  sendMessage(conversationId: string, content: string) {
    // Usa o evento correto conforme documentação (opcional, pois estamos usando HTTP API)
    this.socket?.emit('message:send', { conversationId, content })
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

