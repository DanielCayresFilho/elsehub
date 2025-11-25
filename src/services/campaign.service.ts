import type { Campaign, CreateCampaignRequest, PaginatedResponse } from '@/types'
import { CampaignStatus } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

export const campaignService = {
  async getCampaigns(page = 1, limit = 10): Promise<PaginatedResponse<Campaign>> {
    logStubCall('campaignService', 'getCampaigns')
    return createEmptyPaginated<Campaign>({ page, limit })
  },

  async getCampaign(id: string): Promise<Campaign> {
    logStubCall('campaignService', 'getCampaign')
    return createMockCampaign({ id })
  },

  async createCampaign(campaignData: CreateCampaignRequest): Promise<Campaign> {
    logStubCall('campaignService', 'createCampaign')
    return createMockCampaign({
      id: 'stub-campaign',
      name: campaignData.name,
      serviceInstanceId: campaignData.serviceInstanceId,
      templateId: campaignData.templateId
    })
  },

  async uploadContacts(id: string, file: File): Promise<{ totalContacts: number }> {
    logStubCall('campaignService', 'uploadContacts')
    return { totalContacts: 0 }
  },

  async startCampaign(id: string): Promise<Campaign> {
    logStubCall('campaignService', 'startCampaign')
    return createMockCampaign({ id, status: CampaignStatus.PROCESSING })
  },

  async pauseCampaign(id: string): Promise<Campaign> {
    logStubCall('campaignService', 'pauseCampaign')
    return createMockCampaign({ id, status: CampaignStatus.PAUSED })
  },

  async resumeCampaign(id: string): Promise<Campaign> {
    logStubCall('campaignService', 'resumeCampaign')
    return createMockCampaign({ id, status: CampaignStatus.PROCESSING })
  },

  async deleteCampaign(id: string): Promise<void> {
    logStubCall('campaignService', `deleteCampaign:${id}`)
  }
}

const createMockCampaign = (overrides?: Partial<Campaign>): Campaign => {
  const now = new Date().toISOString()
  return {
    id: 'stub-campaign-id',
    name: 'Campanha Demo',
    status: CampaignStatus.DRAFT,
    serviceInstanceId: 'stub-instance',
    delaySeconds: 0,
    totalContacts: 0,
    sentCount: 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
    serviceInstance: undefined,
    templateId: undefined,
    template: undefined,
    scheduledAt: undefined,
    startedAt: undefined,
    completedAt: undefined,
    ...overrides
  }
}

