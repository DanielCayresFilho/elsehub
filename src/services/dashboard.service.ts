import { api } from './api'

export interface DashboardStats {
  activeConversations: number
  totalMessages: number
  responseRate: number
  averageResponseTime: number
}

export interface RecentConversation {
  id: string
  contactName: string
  contactPhone: string
  operatorName: string | null
  lastMessage: string
  lastMessageAt: string
  startTime: string
  messageCount: number
}

export interface WeeklyPerformance {
  date: string // YYYY-MM-DD
  responseRate: number
  averageResponseTime: number
  closedConversations: number
}

export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Retorna estatísticas para os 4 cards do dashboard
   */
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/stats')
    return data
  },

  /**
   * GET /api/dashboard/recent-conversations
   * Retorna as últimas 5 conversas abertas
   */
  async getRecentConversations(): Promise<RecentConversation[]> {
    const { data } = await api.get<RecentConversation[]>('/dashboard/recent-conversations')
    return data
  },

  /**
   * GET /api/dashboard/weekly-performance
   * Retorna dados de desempenho dos últimos 7 dias
   */
  async getWeeklyPerformance(): Promise<WeeklyPerformance[]> {
    const { data } = await api.get<WeeklyPerformance[]>('/dashboard/weekly-performance')
    return data
  }
}

