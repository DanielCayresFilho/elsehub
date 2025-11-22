import { api } from './api'
import type { LoginRequest, LoginResponse, RefreshTokenRequest, User } from '@/types'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    
    // Store tokens and user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    return data
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const payload: RefreshTokenRequest = { refreshToken }
    const { data } = await api.post<LoginResponse>('/auth/refresh', payload)
    
    // Update tokens
    localStorage.setItem('accessToken', data.accessToken)
    
    return data
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile')
    localStorage.setItem('user', JSON.stringify(data))
    return data
  },

  logout(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }
}

