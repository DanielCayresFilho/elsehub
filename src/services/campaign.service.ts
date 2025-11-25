import { api } from './api'
import type { Campaign, CreateCampaignRequest } from '@/types'

interface UploadContactsResponse {
  success: boolean
  totalContacts: number
  campaignId: string
}

export const campaignService = {
  /**
   * GET /api/campaigns
   * Lista todas as campanhas
   * Retorna array direto, não paginado
   */
  async getCampaigns(): Promise<Campaign[]> {
    const { data } = await api.get<Campaign[]>('/campaigns')
    return data
  },

  /**
   * GET /api/campaigns/:id
   * Retorna uma campanha por ID
   */
  async getCampaign(id: string): Promise<Campaign> {
    const { data } = await api.get<Campaign>(`/campaigns/${id}`)
    return data
  },

  /**
   * POST /api/campaigns
   * Cria uma nova campanha
   */
  async createCampaign(campaignData: CreateCampaignRequest): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/campaigns', campaignData)
    return data
  },

  /**
   * POST /api/campaigns/:id/upload
   * Faz upload de arquivo CSV com contatos para a campanha
   */
  async uploadContacts(id: string, file: File): Promise<UploadContactsResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await api.post<UploadContactsResponse>(`/campaigns/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  /**
   * POST /api/campaigns/:id/start
   * Inicia uma campanha
   */
  async startCampaign(id: string): Promise<Campaign> {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/start`)
    return data
  },

  /**
   * PATCH /api/campaigns/:id/pause
   * Pausa uma campanha em processamento
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/pause`)
    return data
  },

  /**
   * PATCH /api/campaigns/:id/resume
   * Retoma uma campanha pausada
   */
  async resumeCampaign(id: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/resume`)
    return data
  },

  /**
   * DELETE /api/campaigns/:id
   * Remove uma campanha
   */
  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`)
  }
}

