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
  apiKey: string
  baseUrl: string
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
  qrcode: {
    pairingCode?: string
    code?: string
  }
}

// Conversation Types
export interface Conversation {
  id: string
  contactId: string
  contact?: Contact
  operatorId?: string
  operator?: User
  serviceInstanceId: string
  serviceInstance?: ServiceInstance
  status: ConversationStatus
  lastMessageAt: string
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
  fromMe: boolean
  senderId?: string
  sender?: User
  timestamp: string
  delivered: boolean
  read: boolean
  createdAt: string
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

export interface ApiError {
  statusCode: number
  message: string | string[]
  path: string
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

