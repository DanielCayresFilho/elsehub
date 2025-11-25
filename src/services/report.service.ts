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
  openConversations: number
  closedConversations: number
  totalMessages: number
  inboundMessages: number
  outboundMessages: number
  avgResponseTime: number
  avgConversationDuration: number
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
  async getOperatorPerformance(filters: ReportFilters = {}): Promise<OperatorPerformance[]> {
    const { data } = await api.get<OperatorPerformance[]>('/reports/operator-performance', {
      params: filters
    })
    return data
  }
}

