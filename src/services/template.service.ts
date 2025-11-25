import type { Template, PaginatedResponse } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

interface CreateTemplateRequest {
  name: string
  body: string
  serviceInstanceId: string
}

export const templateService = {
  async getTemplates(page = 1, limit = 10): Promise<PaginatedResponse<Template>> {
    logStubCall('templateService', 'getTemplates')
    return createEmptyPaginated<Template>({ page, limit })
  },

  async createTemplate(templateData: CreateTemplateRequest): Promise<Template> {
    logStubCall('templateService', 'createTemplate')
    return createMockTemplate({
      name: templateData.name,
      body: templateData.body,
      serviceInstanceId: templateData.serviceInstanceId
    })
  },

  async updateTemplate(id: string, templateData: Partial<CreateTemplateRequest>): Promise<Template> {
    logStubCall('templateService', 'updateTemplate')
    return createMockTemplate({
      id,
      ...templateData
    })
  },

  async deleteTemplate(id: string): Promise<void> {
    logStubCall('templateService', `deleteTemplate:${id}`)
  }
}

const createMockTemplate = (overrides?: Partial<Template>): Template => {
  const now = new Date().toISOString()
  return {
    id: overrides?.id ?? 'stub-template',
    name: overrides?.name ?? 'Template Demo',
    body: overrides?.body ?? 'Corpo do template demo.',
    serviceInstanceId: overrides?.serviceInstanceId ?? 'stub-instance',
    createdAt: now,
    updatedAt: now
  }
}

