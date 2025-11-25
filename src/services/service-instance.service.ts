import type { ServiceInstance, QRCodeResponse } from '@/types'
import { ServiceProvider } from '@/types'
import { logStubCall } from './service-stubs'

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
    logStubCall('serviceInstanceService', 'getInstances')
    return [createMockInstance()]
  },

  async getInstanceById(id: string): Promise<ServiceInstance> {
    logStubCall('serviceInstanceService', 'getInstanceById')
    return createMockInstance({ id })
  },

  async createInstance(instanceData: CreateServiceInstanceRequest): Promise<ServiceInstance> {
    logStubCall('serviceInstanceService', 'createInstance')
    return createMockInstance({
      name: instanceData.name,
      provider: instanceData.provider as ServiceProvider
    })
  },

  async getQRCode(id: string): Promise<QRCodeResponse> {
    logStubCall('serviceInstanceService', 'getQRCode')
    return {
      base64: undefined,
      pairingCode: '000000',
      message: 'Instância demo conectada.'
    }
  },

  async updateInstance(id: string, instanceData: Partial<CreateServiceInstanceRequest>): Promise<ServiceInstance> {
    logStubCall('serviceInstanceService', 'updateInstance')
    return createMockInstance({ id, name: instanceData.name })
  },

  async deleteInstance(id: string): Promise<void> {
    logStubCall('serviceInstanceService', `deleteInstance:${id}`)
  }
}

const createMockInstance = (overrides?: Partial<ServiceInstance>): ServiceInstance => {
  const now = new Date().toISOString()
  return {
    id: 'stub-instance-id',
    name: 'Instância Demo',
    provider: ServiceProvider.EVOLUTION_API,
    credentials: {
      apiToken: 'stub-token',
      serverUrl: 'https://stub.example.com',
      instanceName: 'stub-instance'
    },
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  }
}

