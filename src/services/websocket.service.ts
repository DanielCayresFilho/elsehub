import { io, Socket } from 'socket.io-client'
import type { Message, Conversation } from '@/types'
import { tokenService } from './token.service'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private wsUrl: string
  private joinedRooms: Set<string> = new Set() // Rastreia salas que entrou

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
        // Reentra em todas as salas que estava antes da desconexão
        this.joinedRooms.forEach(roomId => {
          console.log('[WebSocket] Reentrando na sala:', roomId)
          this.socket?.emit('conversation:join', { conversationId: roomId })
        })
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Desconectado:', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Erro de conexão:', error)
      })

      // Escuta eventos de novas mensagens (conforme documentação: message:new)
      this.socket.on('message:new', (message: Message) => {
        console.log('[WebSocket] Nova mensagem recebida:', message)
        this.emit('new_message', { conversationId: message.conversationId, message })
      })

      // Escuta atualizações de conversas (conforme documentação: conversation:updated)
      this.socket.on('conversation:updated', (conversation: Conversation) => {
        console.log('[WebSocket] Conversa atualizada:', conversation)
        this.emit('conversation_updated', conversation)
      })

      // Escuta fechamento de conversas (conforme documentação: conversation:closed)
      this.socket.on('conversation:closed', (data: { conversationId: string } | Conversation) => {
        console.log('[WebSocket] Conversa fechada:', data)
        this.emit('conversation:closed', data)
      })

      // Escuta indicadores de digitação (conforme documentação: typing:user)
      this.socket.on('typing:user', (data: { userId: string; email: string; isTyping: boolean }) => {
        console.log('[WebSocket] Usuário digitando:', data)
        this.emit('typing:user', data)
      })

    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error)
    }
  }

  joinRoom(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Não conectado, não é possível entrar na sala')
      // Adiciona à lista para entrar quando reconectar
      this.joinedRooms.add(conversationId)
      return
    }
    console.log('[WebSocket] Entrando na sala:', conversationId)
    // Conforme documentação: conversation:join
    this.socket.emit('conversation:join', { conversationId })
    this.joinedRooms.add(conversationId)
  }

  leaveRoom(conversationId: string) {
    if (!this.socket?.connected) {
      // Remove da lista mesmo se não estiver conectado
      this.joinedRooms.delete(conversationId)
      return
    }
    console.log('[WebSocket] Saindo da sala:', conversationId)
    // Conforme documentação: conversation:leave
    this.socket.emit('conversation:leave', { conversationId })
    this.joinedRooms.delete(conversationId)
  }

  sendTypingStart(conversationId: string) {
    if (!this.socket?.connected) {
      return
    }
    // Conforme documentação: typing:start
    this.socket.emit('typing:start', { conversationId })
  }

  sendTypingStop(conversationId: string) {
    if (!this.socket?.connected) {
      return
    }
    // Conforme documentação: typing:stop
    this.socket.emit('typing:stop', { conversationId })
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
    this.joinedRooms.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const wsService = new WebSocketService()

