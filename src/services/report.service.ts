import type { Statistics, OperatorPerformance, Conversation, PaginatedResponse } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

interface ReportFilters {
  startDate?: string
  endDate?: string
  operatorId?: string
}

export const reportService = {
  async getStatistics(filters: ReportFilters = {}): Promise<Statistics> {
    logStubCall('reportService', 'getStatistics')
    return {
      totalConversations: 0,
      activeConversations: 0,
      closedConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      responseRate: 0
    }
  },

  async getFinishedConversations(
    filters: ReportFilters & { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Conversation>> {
    logStubCall('reportService', 'getFinishedConversations')
    return createEmptyPaginated<Conversation>({
      page: filters.page,
      limit: filters.limit
    })
  },

  async getOperatorPerformance(filters: ReportFilters = {}): Promise<OperatorPerformance[]> {
    logStubCall('reportService', 'getOperatorPerformance')
    return []
  }
}

