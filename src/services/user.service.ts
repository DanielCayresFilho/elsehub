import { api } from './api'
import type { PaginatedResponse, User } from '@/types'
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
   * Lista todos os usuários com paginação (formato { data, meta } conforme backend)
   */
  async getUsers(params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 25, search } = params
    const { data } = await api.get<PaginatedResponse<User>>('/users', {
      params: {
        page,
        limit,
        ...(search ? { search } : {})
      }
    })
    return {
      data: data?.data ?? [],
      meta: data?.meta ?? {
        total: data?.data?.length ?? 0,
        page,
        limit,
        totalPages: 1
      }
    }
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

