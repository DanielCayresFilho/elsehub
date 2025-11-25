// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ServiceProvider {
  EVOLUTION_API = 'EVOLUTION_API'
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  isOnline: boolean
  lastConversationAssignedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn?: string
  refreshTokenExpiresIn?: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// Contact Types
export interface Contact {
  id: string
  name: string
  phone: string
  cpf?: string
  additional1?: string
  additional2?: string
  createdAt: string
  updatedAt: string
}

export interface CreateContactRequest {
  name: string
  phone: string
  cpf?: string
  additional1?: string
  additional2?: string
}

// Service Instance Types
export interface ServiceInstanceCredentials {
  apiToken: string
  serverUrl: string
  instanceName: string
}

export interface ServiceInstance {
  id: string
  name: string
  provider: ServiceProvider
  credentials: ServiceInstanceCredentials
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface QRCodeResponse {
  base64?: string // QR Code em base64: "data:image/png;base64,..."
  pairingCode?: string // Código de pareamento: "12345678"
  message?: string // Mensagem quando já conectada: "Instância já conectada"
}

// Conversation Types
export interface Conversation {
  id: string
  contactId: string
  contactName?: string // Nome do contato (retornado pelo backend)
  contactPhone?: string // Telefone do contato (retornado pelo backend)
  contact?: Contact
  operatorId?: string
  operatorName?: string // Nome do operador (retornado pelo backend)
  operator?: User
  serviceInstanceId: string
  serviceInstanceName?: string // Nome da instância (retornado pelo backend)
  serviceInstance?: ServiceInstance
  status: ConversationStatus
  startTime?: string // Data de início da conversa
  lastMessageAt?: string | null
  lastMessagePreview?: string | null
  lastCustomerMessagePreview?: string | null
  lastMessageDirection?: 'INBOUND' | 'OUTBOUND'
  messageCount?: number
  closedAt?: string
  tabulationId?: string
  tabulation?: Tabulation
  createdAt: string
  updatedAt: string
  messages?: Message[]
  unreadCount?: number
}

export interface Message {
  id: string
  conversationId: string
  content: string
  serviceInstanceId?: string
  serviceInstanceName?: string
  fromMe?: boolean // Se true, mensagem foi enviada pelo operador
  direction?: 'INBOUND' | 'OUTBOUND' // INBOUND = recebida, OUTBOUND = enviada
  senderId?: string // ID do operador (null se for do cliente)
  sender?: User
  timestamp?: string
  createdAt: string
  delivered?: boolean
  read?: boolean
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  externalId?: string // ID da mensagem na Evolution/Meta API
  hasMedia?: boolean
  mediaType?: 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'VIDEO' | 'STICKER' | string
  mediaFileName?: string
  mediaMimeType?: string
  mediaSize?: number
  mediaCaption?: string | null
  mediaDownloadPath?: string
}

// Campaign Types
export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  serviceInstanceId: string
  serviceInstance?: ServiceInstance
  templateId?: string
  template?: Template
  delaySeconds: number
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  totalContacts: number
  sentCount: number
  failedCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignRequest {
  name: string
  serviceInstanceId: string
  templateId?: string
  delaySeconds: number
  scheduledAt?: string
}

// Template Types
export interface Template {
  id: string
  name: string
  body: string
  serviceInstanceId: string
  createdAt: string
  updatedAt: string
}

// Tabulation Types
export interface Tabulation {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

// Report Types
export interface Statistics {
  totalConversations: number
  activeConversations: number
  closedConversations: number
  totalMessages: number
  averageResponseTime: number
  responseRate: number
}

export interface OperatorPerformance {
  operatorId: string
  operatorName: string
  totalConversations: number
  averageResponseTime: number
  totalMessages: number
  satisfaction?: number
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// WebSocket Events
export interface WsMessage {
  event: string
  data: any
}

export interface JoinRoomPayload {
  conversationId: string
}

export interface SendMessagePayload {
  conversationId: string
  content: string
}

