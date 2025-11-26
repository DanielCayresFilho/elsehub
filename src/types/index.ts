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
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ServiceProvider {
  EVOLUTION_API = 'EVOLUTION_API',
  OFFICIAL_META = 'OFFICIAL_META'
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  isOnline: boolean
  onlineSince?: string | null // Data/hora quando ficou online (conforme API)
  lastConversationAssignedAt?: string | null // Data/hora da última conversa atribuída (conforme API)
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
export interface EvolutionInstanceCredentials {
  apiToken: string
  serverUrl: string
  instanceName: string
}

export interface OfficialMetaInstanceCredentials {
  wabaId: string
  phoneId: string
  accessToken: string
}

export type ServiceInstanceCredentials =
  | EvolutionInstanceCredentials
  | OfficialMetaInstanceCredentials

export interface ServiceInstance {
  id: string
  name: string
  phone?: string
  provider: ServiceProvider
  credentials: ServiceInstanceCredentials
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceInstanceRequest {
  name: string
  phone: string
  provider: ServiceProvider
  credentials: ServiceInstanceCredentials
}

export interface UpdateServiceInstanceRequest extends Partial<CreateServiceInstanceRequest> {
  isActive?: boolean
}

export interface QRCodeResponse {
  qrcode?: string // QR Code em base64 com prefixo data:image: "data:image/png;base64,..."
  base64?: string // QR Code em base64 sem prefixo: "iVBORw0KGgoAAAANSUhEUgAA..."
  pairingCode?: string // Código de pareamento: "12345678"
  message?: string // Mensagem quando já conectada: "Instância já conectada"
  instanceName?: string // Nome da instância
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
  fromMe?: boolean // Campo auxiliar do frontend (calculado baseado em direction e senderId)
  direction?: 'INBOUND' | 'OUTBOUND' // INBOUND = recebida, OUTBOUND = enviada (conforme API)
  senderId?: string | null // ID do operador (null se for do cliente) - conforme API
  senderName?: string | null // Nome do operador (null se for do cliente) - conforme API
  sender?: User // Campo auxiliar do frontend
  timestamp?: string // Campo auxiliar do frontend (alias para createdAt)
  createdAt: string // Conforme API
  delivered?: boolean // Campo auxiliar do frontend (calculado baseado em status)
  read?: boolean // Campo auxiliar do frontend (calculado baseado em status)
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received' // Conforme API: 'sent' ou 'received'
  externalId?: string // ID da mensagem na Evolution/Meta API - conforme API
  hasMedia?: boolean // Conforme API
  mediaType?: string | null // Conforme API
  mediaFileName?: string | null // Conforme API
  mediaMimeType?: string | null // Conforme API
  mediaSize?: number | null // Conforme API
  mediaCaption?: string | null // Conforme API
  mediaStoragePath?: string | null // Conforme API
  mediaPublicUrl?: string | null // Conforme API
  mediaDownloadPath?: string | null // Conforme API
  via?: 'INBOUND' | 'CAMPAIGN' | 'CHAT_MANUAL' // Conforme API
}

// Campaign Types
export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  serviceInstanceId: string
  serviceInstanceName?: string // Nome da instância (retornado pelo backend)
  serviceInstance?: ServiceInstance
  templateId?: string
  templateName?: string // Nome do template (retornado pelo backend)
  template?: Template
  supervisorId?: string // ID do supervisor que criou (retornado pelo backend)
  supervisorName?: string // Nome do supervisor (retornado pelo backend)
  csvPath?: string | null // Caminho do arquivo CSV (retornado pelo backend)
  delaySeconds: number
  scheduledAt?: string | null
  startedAt?: string | null
  finishedAt?: string | null // Data de conclusão (conforme API, não completedAt)
  completedAt?: string // Mantido para compatibilidade
  totalContacts: number
  sentCount: number
  failedCount: number
  pendingCount?: number // Contatos pendentes (retornado pelo backend)
  createdAt?: string
  updatedAt?: string
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
  metaTemplateId?: string | null // ID do template na Meta (conforme API)
  language?: string | null // Idioma do template (ex: pt_BR) (conforme API)
  variables?: Record<string, any> | null // Estrutura de variáveis (conforme API)
  serviceInstanceId: string
  serviceInstanceName?: string // Nome da instância (retornado pelo backend)
  createdAt?: string
  updatedAt?: string
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
  openConversations: number // Conforme API (não activeConversations)
  closedConversations: number
  totalMessages: number
  inboundMessages: number // Conforme API
  outboundMessages: number // Conforme API
  avgResponseTime: number // Conforme API (não averageResponseTime)
  avgConversationDuration: number // Conforme API
  // Campos auxiliares do frontend (mantidos para compatibilidade)
  activeConversations?: number // Alias para openConversations
  averageResponseTime?: number // Alias para avgResponseTime
  responseRate?: number // Calculado no frontend
}

export interface OperatorPerformance {
  operatorId: string
  operatorName: string
  totalConversations: number
  closedConversations: number // Conforme API
  avgResponseTime: number // Conforme API (não averageResponseTime)
  avgConversationDuration: number // Conforme API
  totalMessages: number
  // Campos auxiliares do frontend (mantidos para compatibilidade)
  averageResponseTime?: number // Alias para avgResponseTime
  satisfaction?: number // Campo opcional (não na API)
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

