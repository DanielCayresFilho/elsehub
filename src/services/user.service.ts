import type { User, PaginatedResponse } from '@/types'
import { UserRole } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: string
  isActive?: boolean
}

interface UpdateUserRequest {
  name?: string
  isActive?: boolean
  password?: string
}

const now = () => new Date().toISOString()

const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'stub-user',
  name: 'Usuário Demo',
  email: 'demo@example.com',
  role: UserRole.ADMIN,
  isActive: true,
  isOnline: false,
  createdAt: now(),
  updatedAt: now(),
  ...overrides
})

export const userService = {
  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    logStubCall('userService', 'getUsers')
    return createEmptyPaginated<User>({ page, limit })
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    logStubCall('userService', 'createUser')
    return createMockUser({
      id: 'stub-created-user',
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole
    })
  },

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    logStubCall('userService', 'updateUser')
    return createMockUser({
      id,
      name: userData.name ?? 'Usuário Atualizado',
      isActive: userData.isActive ?? true
    })
  },

  async deleteUser(id: string): Promise<void> {
    logStubCall('userService', `deleteUser:${id}`)
  },

  async toggleOnline(isOnline: boolean): Promise<User> {
    logStubCall('userService', 'toggleOnline')
    return createMockUser({
      id: 'stub-user',
      isOnline
    })
  },

  async getOnlineOperators(): Promise<User[]> {
    logStubCall('userService', 'getOnlineOperators')
    return []
  }
}

