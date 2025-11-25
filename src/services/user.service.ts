import { api } from './api'
import type { User, PaginatedResponse } from '@/types'
import { UserRole } from '@/types'

interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
  isActive?: boolean
}

interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  isActive?: boolean
}

interface ToggleOnlineRequest {
  isOnline: boolean
}

export const userService = {
  /**
   * GET /api/users
   * Lista todos os usuários com paginação
   */
  async getUsers(page = 1, limit = 25): Promise<User[]> {
    const { data } = await api.get<User[]>('/users', {
      params: {
        page,
        limit
      }
    })
    return data
  },

  /**
   * GET /api/users/me
   * Retorna o usuário atual (autenticado)
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },

  /**
   * GET /api/users/online
   * Lista todos os operadores online
   * Retorna array direto, não paginado
   */
  async getOnlineOperators(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users/online')
    return data
  },

  /**
   * POST /api/users
   * Cria um novo usuário
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data } = await api.post<User>('/users', userData)
    return data
  },

  /**
   * PATCH /api/users/:id
   * Atualiza um usuário
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, userData)
    return data
  },

  /**
   * DELETE /api/users/:id
   * Remove um usuário
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  /**
   * PATCH /api/users/me/toggle-online
   * Alterna o status online do usuário atual
   */
  async toggleOnline(isOnline: boolean): Promise<User> {
    const { data } = await api.patch<User>('/users/me/toggle-online', { isOnline })
    return data
  }
}

