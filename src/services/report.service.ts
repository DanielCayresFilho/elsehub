import { api } from './api'
import type { Statistics, OperatorPerformance, Conversation, PaginatedResponse } from '@/types'

interface ReportFilters {
  startDate?: string
  endDate?: string
  operatorId?: string
}

export const reportService = {
  async getStatistics(filters: ReportFilters = {}): Promise<Statistics> {
    const { data } = await api.get<Statistics>('/reports/statistics', { params: filters })
    return data
  },

  async getFinishedConversations(
    filters: ReportFilters & { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Conversation>> {
    const { data } = await api.get<PaginatedResponse<Conversation>>('/reports/finished-conversations', {
      params: filters
    })
    return data
  },

  async getOperatorPerformance(filters: ReportFilters = {}): Promise<OperatorPerformance[]> {
    const { data } = await api.get<OperatorPerformance[]>('/reports/operator-performance', {
      params: filters
    })
    return data
  }
}

