import { io, Socket } from 'socket.io-client'
import type { Message, Conversation } from '@/types'
import { tokenService } from './token.service'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private wsUrl: string

  constructor() {
    // Obtém a URL do WebSocket da variável de ambiente
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
  }

  async connect() {
    if (this.socket?.connected) {
      console.log('[WebSocket] Já conectado')
      return
    }

    const accessToken = tokenService.getAccessToken()
    if (!accessToken) {
      console.warn('[WebSocket] Token não disponível, não é possível conectar')
      return
    }

    try {
      console.log('[WebSocket] Conectando...', this.wsUrl)
      
      this.socket = io(this.wsUrl, {
        auth: {
          token: accessToken
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      this.socket.on('connect', () => {
        console.log('[WebSocket] Conectado com sucesso')
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Desconectado:', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Erro de conexão:', error)
      })

      // Escuta eventos de novas mensagens
      this.socket.on('new_message', (data: { conversationId: string; message: Message }) => {
        console.log('[WebSocket] Nova mensagem recebida:', data)
        this.emit('new_message', data)
      })

      // Escuta atualizações de status de mensagens
      this.socket.on('message_updated', (data: { conversationId: string; message: Message }) => {
        console.log('[WebSocket] Mensagem atualizada:', data)
        this.emit('message_updated', data)
      })

      // Escuta atualizações de conversas
      this.socket.on('conversation_updated', (data: Conversation) => {
        console.log('[WebSocket] Conversa atualizada:', data)
        this.emit('conversation_updated', data)
      })

    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error)
    }
  }

  joinRoom(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Não conectado, não é possível entrar na sala')
      return
    }
    console.log('[WebSocket] Entrando na sala:', conversationId)
    this.socket.emit('join_room', { conversationId })
  }

  leaveRoom(conversationId: string) {
    if (!this.socket?.connected) {
      return
    }
    console.log('[WebSocket] Saindo da sala:', conversationId)
    this.socket.emit('leave_room', { conversationId })
  }

  sendTypingStart(conversationId: string) {
    if (!this.socket?.connected) {
      return
    }
    this.socket.emit('typing_start', { conversationId })
  }

  sendTypingStop(conversationId: string) {
    if (!this.socket?.connected) {
      return
    }
    this.socket.emit('typing_stop', { conversationId })
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
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[WebSocket] Erro ao executar listener para ${event}:`, error)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Desconectando...')
      this.socket.disconnect()
      this.socket = null
    }
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const wsService = new WebSocketService()

