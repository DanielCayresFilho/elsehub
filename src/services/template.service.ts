import { api } from './api'
import type { Template, PaginatedResponse } from '@/types'

interface CreateTemplateRequest {
  name: string
  body: string
  serviceInstanceId: string
}

export const templateService = {
  async getTemplates(page = 1, limit = 10): Promise<PaginatedResponse<Template>> {
    const { data } = await api.get<PaginatedResponse<Template>>('/templates', {
      params: { page, limit }
    })
    return data
  },

  async createTemplate(templateData: CreateTemplateRequest): Promise<Template> {
    const { data } = await api.post<Template>('/templates', templateData)
    return data
  },

  async updateTemplate(id: string, templateData: Partial<CreateTemplateRequest>): Promise<Template> {
    const { data } = await api.patch<Template>(`/templates/${id}`, templateData)
    return data
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/templates/${id}`)
  }
}

