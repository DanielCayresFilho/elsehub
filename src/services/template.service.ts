import { api } from './api'
import type { Template } from '@/types'

interface CreateTemplateRequest {
  name: string
  body: string
  metaTemplateId?: string
  language?: string
  variables?: Record<string, any>
  serviceInstanceId: string
}

interface UpdateTemplateRequest {
  name?: string
  body?: string
  metaTemplateId?: string
  language?: string
  variables?: Record<string, any>
  serviceInstanceId?: string
}

export const templateService = {
  /**
   * GET /api/templates
   * Lista templates
   * Retorna array direto, não paginado
   */
  async getTemplates(serviceInstanceId?: string): Promise<Template[]> {
    const { data } = await api.get<Template[]>('/templates', {
      params: serviceInstanceId ? { serviceInstanceId } : {}
    })
    return data
  },

  /**
   * GET /api/templates/:id
   * Retorna um template por ID
   */
  async getTemplate(id: string): Promise<Template> {
    const { data } = await api.get<Template>(`/templates/${id}`)
    return data
  },

  /**
   * POST /api/templates
   * Cria um novo template
   */
  async createTemplate(templateData: CreateTemplateRequest): Promise<Template> {
    const { data } = await api.post<Template>('/templates', templateData)
    return data
  },

  /**
   * PATCH /api/templates/:id
   * Atualiza um template
   */
  async updateTemplate(id: string, templateData: UpdateTemplateRequest): Promise<Template> {
    const { data } = await api.patch<Template>(`/templates/${id}`, templateData)
    return data
  },

  /**
   * DELETE /api/templates/:id
   * Remove um template
   */
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/templates/${id}`)
  }
}

