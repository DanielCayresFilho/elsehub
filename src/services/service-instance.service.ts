import { api } from './api'
import type {
  ServiceInstance,
  QRCodeResponse,
  CreateServiceInstanceRequest,
  UpdateServiceInstanceRequest
} from '@/types'

export const serviceInstanceService = {
  async getInstances(params?: { includeInactive?: boolean }): Promise<ServiceInstance[]> {
    const { data } = await api.get<ServiceInstance[]>('/service-instances', {
      params: {
        includeInactive: params?.includeInactive ?? false
      }
    })
    return data || []
  },

  async getInstanceById(id: string): Promise<ServiceInstance> {
    const { data } = await api.get<ServiceInstance>(`/service-instances/${id}`)
    if (!data) {
      throw new Error('Instância não encontrada')
    }
    return data
  },

  async createInstance(instanceData: CreateServiceInstanceRequest): Promise<ServiceInstance> {
    const { data } = await api.post<ServiceInstance>('/service-instances', instanceData)
    if (!data) {
      throw new Error('Erro ao criar instância')
    }
    return data
  },

  async getQRCode(id: string): Promise<QRCodeResponse> {
    const { data } = await api.get<QRCodeResponse>(`/service-instances/${id}/qrcode`)
    if (!data) {
      throw new Error('QR Code não disponível')
    }
    return data
  },

  async updateInstance(id: string, instanceData: UpdateServiceInstanceRequest): Promise<ServiceInstance> {
    const { data } = await api.patch<ServiceInstance>(`/service-instances/${id}`, instanceData)
    if (!data) {
      throw new Error('Erro ao atualizar instância')
    }
    return data
  },

  async deleteInstance(id: string): Promise<void> {
    await api.delete(`/service-instances/${id}`)
  }
}
