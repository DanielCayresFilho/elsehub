import { api } from './api'
import type { Tabulation } from '@/types'

interface CreateTabulationRequest {
  name: string
}

interface UpdateTabulationRequest {
  name?: string
}

export const tabulationService = {
  /**
   * GET /api/tabulations
   * Lista todas as tabulações
   * Retorna array direto, não paginado
   */
  async getTabulations(): Promise<Tabulation[]> {
    const { data } = await api.get<Tabulation[]>('/tabulations')
    return data
  },

  /**
   * GET /api/tabulations/:id
   * Retorna uma tabulação por ID
   */
  async getTabulation(id: string): Promise<Tabulation> {
    const { data } = await api.get<Tabulation>(`/tabulations/${id}`)
    return data
  },

  /**
   * POST /api/tabulations
   * Cria uma nova tabulação
   */
  async createTabulation(tabulationData: CreateTabulationRequest): Promise<Tabulation> {
    const { data } = await api.post<Tabulation>('/tabulations', tabulationData)
    return data
  },

  /**
   * PATCH /api/tabulations/:id
   * Atualiza uma tabulação
   */
  async updateTabulation(id: string, tabulationData: UpdateTabulationRequest): Promise<Tabulation> {
    const { data } = await api.patch<Tabulation>(`/tabulations/${id}`, tabulationData)
    return data
  },

  /**
   * DELETE /api/tabulations/:id
   * Remove uma tabulação
   */
  async deleteTabulation(id: string): Promise<void> {
    await api.delete(`/tabulations/${id}`)
  }
}

