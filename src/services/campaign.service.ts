import { api } from './api'
import type { Campaign, CreateCampaignRequest, PaginatedResponse } from '@/types'

export const campaignService = {
  async getCampaigns(page = 1, limit = 10): Promise<PaginatedResponse<Campaign>> {
    const { data } = await api.get<PaginatedResponse<Campaign>>('/campaigns', {
      params: { page, limit }
    })
    return data
  },

  async getCampaign(id: string): Promise<Campaign> {
    const { data } = await api.get<Campaign>(`/campaigns/${id}`)
    return data
  },

  async createCampaign(campaignData: CreateCampaignRequest): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/campaigns', campaignData)
    return data
  },

  async uploadContacts(id: string, file: File): Promise<{ totalContacts: number }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await api.post<{ totalContacts: number }>(
      `/campaigns/${id}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return data
  },

  async startCampaign(id: string): Promise<Campaign> {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/start`)
    return data
  },

  async pauseCampaign(id: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/pause`)
    return data
  },

  async resumeCampaign(id: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/resume`)
    return data
  },

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`)
  }
}

