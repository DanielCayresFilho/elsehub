import { api } from './api'
import type { Statistics, OperatorPerformance, Conversation } from '@/types'

interface ReportFilters {
  startDate?: string
  endDate?: string
  operatorId?: string
  serviceInstanceId?: string
  tabulationId?: string
}

interface StatisticsResponse {
  totalConversations: number
  avgDurationSeconds: number
  avgResponseTimeSeconds: number
  responseRate: number
  tabulationStats: Array<{
    tabulationId: string
    tabulationName: string
    count: number
  }>
}

interface OperatorPerformanceResponse {
  operatorId: string
  operatorName: string
  totalConversations: number
  totalMessages: number
  avgDuration: number
  avgResponseTime: number
}

export const reportService = {
  /**
   * GET /api/reports/statistics
   * Retorna estatísticas gerais do sistema
   */
  async getStatistics(filters: ReportFilters = {}): Promise<StatisticsResponse> {
    const { data } = await api.get<StatisticsResponse>('/reports/statistics', {
      params: filters
    })
    return data
  },

  /**
   * GET /api/reports/finished-conversations
   * Lista conversas finalizadas com filtros
   * Retorna array direto, não paginado
   */
  async getFinishedConversations(filters: ReportFilters = {}): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/reports/finished-conversations', {
      params: filters
    })
    return data
  },

  /**
   * GET /api/reports/finished-conversations/export
   * Exporta conversas finalizadas como CSV
   */
  async exportFinishedConversations(filters: ReportFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>('/reports/finished-conversations/export', {
      params: filters,
      responseType: 'blob'
    })
    return data
  },

  /**
   * GET /api/reports/operator-performance
   * Retorna performance de operadores
   * Retorna array direto, não paginado
   */
  async getOperatorPerformance(filters: ReportFilters = {}): Promise<OperatorPerformanceResponse[]> {
    const { data } = await api.get<OperatorPerformanceResponse[]>('/reports/operator-performance', {
      params: filters
    })
    return data
  },

  /**
   * GET /api/reports/statistics/export
   * Exporta estatísticas gerais do sistema em CSV
   */
  async exportStatistics(filters: ReportFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>('/reports/statistics/export', {
      params: filters,
      responseType: 'blob'
    })
    return data
  },

  /**
   * GET /api/reports/operator-performance/export
   * Exporta relatório de performance de operadores em CSV
   */
  async exportOperatorPerformance(filters: ReportFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>('/reports/operator-performance/export', {
      params: filters,
      responseType: 'blob'
    })
    return data
  },

  /**
   * GET /api/reports/campaigns/export
   * Exporta relatório completo de campanhas em CSV
   */
  async exportCampaigns(filters: ReportFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>('/reports/campaigns/export', {
      params: filters,
      responseType: 'blob'
    })
    return data
  },

  /**
   * GET /api/reports/messages/export
   * Exporta relatório de mensagens enviadas/recebidas em CSV
   */
  async exportMessages(filters: ReportFilters = {}): Promise<Blob> {
    const { data } = await api.get<Blob>('/reports/messages/export', {
      params: filters,
      responseType: 'blob'
    })
    return data
  }
}

