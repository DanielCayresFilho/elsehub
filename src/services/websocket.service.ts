import { io, Socket } from 'socket.io-client'
import type { Message, Conversation } from '@/types'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect() {
    // Se já está conectado, não reconecta
    if (this.socket?.connected) {
      console.log('WebSocket já está conectado')
      return
    }
    
    // Se já existe socket mas não está conectado, desconecta primeiro
    if (this.socket && !this.socket.connected) {
      console.log('Desconectando socket antigo antes de reconectar...')
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No access token found for WebSocket connection')
      return
    }

    // Conecta ao WebSocket conforme documentação
    // URL base (sem /chat)
    let wsUrl = import.meta.env.VITE_WS_URL || ''
    
    // Remove /chat se existir, pois vamos usar como namespace
    wsUrl = wsUrl.replace(/\/chat\/?$/, '')
    
    // Se não tiver protocolo, adiciona wss://
    if (wsUrl && !wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      wsUrl = 'wss://' + wsUrl.replace(/^https?:\/\//, '')
    }
    
    // Namespace conforme documentação
    const WS_NAMESPACE = '/chat'
    const fullUrl = `${wsUrl}${WS_NAMESPACE}`
    
    console.log('🔌 Conectando ao WebSocket:', fullUrl)
    console.log('🔑 Token presente:', !!token, token ? token.substring(0, 20) + '...' : 'N/A')
    
    // ✅ CORRETO: Conecta usando URL + namespace conforme documentação
    // Socket.IO adiciona /socket.io automaticamente
    this.socket = io(fullUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 10000,
      timeout: 20000
    })

    // Passa o token para setupEventListeners para evitar erro de referência
    this.setupEventListeners(token)
  }

  private setupEventListeners(currentToken: string) {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado com sucesso!')
      console.log('Socket ID:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket desconectado. Motivo:', reason)
      
      // Se foi desconexão do servidor (não do cliente), pode ser problema de autenticação
      if (reason === 'io server disconnect') {
        console.error('⚠️ Servidor desconectou o cliente. Possíveis causas:')
        console.error('  - Token inválido ou expirado')
        console.error('  - URL incorreta')
        console.error('  - Servidor rejeitou a conexão')
        
        // Tenta reconectar com novo token após um delay
        setTimeout(() => {
          const newToken = localStorage.getItem('accessToken')
          if (newToken && newToken !== currentToken) {
            console.log('🔄 Token atualizado, tentando reconectar...')
            this.connect()
          }
        }, 3000)
      }
      
      // Não tenta reconectar manualmente aqui, deixa o Socket.IO fazer isso automaticamente
      // A reconexão automática já está configurada no io() com reconnectionAttempts: Infinity
    })
    
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Erro ao conectar WebSocket:', error.message)
      console.error('Detalhes:', error)
      
      // Se for erro de autenticação
      if (error.message?.includes('auth') || error.message?.includes('401')) {
        console.error('⚠️ Erro de autenticação. Verifique o token JWT.')
      }
    })
    
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 WebSocket reconectado após', attemptNumber, 'tentativas')
    })
    
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Tentando reconectar WebSocket... Tentativa', attemptNumber)
    })

    // Eventos do servidor conforme documentação
    this.socket.on('message:new', (message: Message) => {
      console.log('📨 WebSocket recebeu evento message:new:', message)
      this.emit('message:new', message)
    })

    this.socket.on('conversation:updated', (conversation: Conversation) => {
      this.emit('conversation:updated', conversation)
    })

    this.socket.on('conversation:closed', (data: any) => {
      // Payload pode ser { conversationId } ou Conversation completo
      this.emit('conversation:closed', data)
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

    // Escutar indicador de digitação (opcional)
    this.socket.on('typing:user', (data: { userId: string; email: string; isTyping: boolean; conversationId: string }) => {
      this.emit('typing:user', data)
    })

    // Escutar status de usuários (opcional)
    this.socket.on('user:online', (data: { userId: string; email: string }) => {
      this.emit('user:online', data)
    })

    this.socket.on('user:offline', (data: { userId: string; email: string }) => {
      this.emit('user:offline', data)
    })
  }

  joinRoom(conversationId: string) {
    // Usa o evento correto conforme documentação
    if (this.socket?.connected) {
      console.log('🚪 Entrando na sala da conversa:', conversationId)
      this.socket.emit('conversation:join', { conversationId }, (response: any) => {
        if (response) {
          console.log('✅ Resposta do conversation:join:', response)
        }
      })
    } else {
      console.warn('⚠️ WebSocket não conectado, não é possível entrar na sala. Tentando conectar...')
      this.connect()
      // Aguarda conexão e tenta novamente
      const checkAndJoin = setInterval(() => {
        if (this.socket?.connected) {
          console.log('🚪 WebSocket conectado, entrando na sala agora:', conversationId)
          this.socket.emit('conversation:join', { conversationId })
          clearInterval(checkAndJoin)
        }
      }, 500)
      
      // Para de tentar após 5 segundos
      setTimeout(() => clearInterval(checkAndJoin), 5000)
    }
  }

  leaveRoom(conversationId: string) {
    // Usa o evento correto conforme documentação
    this.socket?.emit('conversation:leave', { conversationId })
  }

  sendMessage(conversationId: string, content: string) {
    // Usa o evento correto conforme documentação (opcional, pois estamos usando HTTP API)
    this.socket?.emit('message:send', { conversationId, content })
  }

  sendTypingStart(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId })
  }

  sendTypingStop(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId })
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

