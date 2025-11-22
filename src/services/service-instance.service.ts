import { api } from './api'
import type { ServiceInstance, QRCodeResponse, PaginatedResponse } from '@/types'

interface CreateServiceInstanceRequest {
  name: string
  provider: string
  credentials: {
    apiKey: string
    baseUrl: string
    instanceName: string
  }
}

export const serviceInstanceService = {
  async getInstances(page = 1, limit = 10): Promise<PaginatedResponse<ServiceInstance>> {
    const { data } = await api.get<PaginatedResponse<ServiceInstance>>('/service-instances', {
      params: { page, limit }
    })
    return data
  },

  async createInstance(instanceData: CreateServiceInstanceRequest): Promise<ServiceInstance> {
    const { data } = await api.post<ServiceInstance>('/service-instances', instanceData)
    return data
  },

  async getQRCode(id: string): Promise<QRCodeResponse> {
    const { data } = await api.get<QRCodeResponse>(`/service-instances/${id}/qrcode`)
    return data
  },

  async updateInstance(id: string, instanceData: Partial<CreateServiceInstanceRequest>): Promise<ServiceInstance> {
    const { data } = await api.patch<ServiceInstance>(`/service-instances/${id}`, instanceData)
    return data
  },

  async deleteInstance(id: string): Promise<void> {
    await api.delete(`/service-instances/${id}`)
  }
}

