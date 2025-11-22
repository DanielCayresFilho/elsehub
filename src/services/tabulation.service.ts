import { api } from './api'
import type { Tabulation, PaginatedResponse } from '@/types'

interface CreateTabulationRequest {
  name: string
}

export const tabulationService = {
  async getTabulations(page = 1, limit = 10): Promise<PaginatedResponse<Tabulation>> {
    const { data } = await api.get<PaginatedResponse<Tabulation>>('/tabulations', {
      params: { page, limit }
    })
    return data
  },

  async createTabulation(tabulationData: CreateTabulationRequest): Promise<Tabulation> {
    const { data } = await api.post<Tabulation>('/tabulations', tabulationData)
    return data
  },

  async updateTabulation(id: string, tabulationData: CreateTabulationRequest): Promise<Tabulation> {
    const { data } = await api.patch<Tabulation>(`/tabulations/${id}`, tabulationData)
    return data
  },

  async deleteTabulation(id: string): Promise<void> {
    await api.delete(`/tabulations/${id}`)
  }
}

