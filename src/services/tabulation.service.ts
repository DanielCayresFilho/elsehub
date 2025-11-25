import type { Tabulation, PaginatedResponse } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

interface CreateTabulationRequest {
  name: string
}

export const tabulationService = {
  async getTabulations(page = 1, limit = 10): Promise<PaginatedResponse<Tabulation>> {
    logStubCall('tabulationService', 'getTabulations')
    return createEmptyPaginated<Tabulation>({ page, limit })
  },

  async createTabulation(tabulationData: CreateTabulationRequest): Promise<Tabulation> {
    logStubCall('tabulationService', 'createTabulation')
    return createMockTabulation({ name: tabulationData.name })
  },

  async updateTabulation(id: string, tabulationData: CreateTabulationRequest): Promise<Tabulation> {
    logStubCall('tabulationService', 'updateTabulation')
    return createMockTabulation({ id, name: tabulationData.name })
  },

  async deleteTabulation(id: string): Promise<void> {
    logStubCall('tabulationService', `deleteTabulation:${id}`)
  }
}

const createMockTabulation = (overrides?: Partial<Tabulation>): Tabulation => {
  const now = new Date().toISOString()
  return {
    id: overrides?.id ?? 'stub-tabulation',
    name: overrides?.name ?? 'Tabulação Demo',
    createdAt: now,
    updatedAt: now
  }
}

