import { api } from './api'
import type { ServiceInstance, QRCodeResponse } from '@/types'

interface CreateServiceInstanceRequest {
  name: string
  provider: string
  credentials: {
    apiToken: string
    serverUrl: string
    instanceName: string
  }
}

export const serviceInstanceService = {
  async getInstances(): Promise<ServiceInstance[]> {
    const { data } = await api.get<ServiceInstance[]>('/service-instances')
    return data
  },

  async getInstanceById(id: string): Promise<ServiceInstance> {
    const { data } = await api.get<ServiceInstance>(`/service-instances/${id}`)
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

