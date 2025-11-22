import { api } from './api'
import type { User, PaginatedResponse } from '@/types'

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

export const userService = {
  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/users', {
      params: { page, limit }
    })
    return data
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data } = await api.post<User>('/users', userData)
    return data
  },

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, userData)
    return data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async toggleOnline(isOnline: boolean): Promise<User> {
    const { data } = await api.patch<User>('/users/me/toggle-online', { isOnline })
    return data
  },

  async getOnlineOperators(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users/online')
    return data
  }
}

