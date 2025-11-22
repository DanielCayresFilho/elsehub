import { api } from './api'
import type { LoginRequest, LoginResponse, RefreshTokenRequest, User } from '@/types'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      const data = response.data
      
      console.log('Login response:', data)
      
      // Validate response
      if (!data || !data.accessToken || !data.refreshToken || !data.user) {
        console.error('Invalid login response:', data)
        throw new Error('Resposta inválida do servidor')
      }
      
      // Store tokens and user
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      console.log('Tokens saved:', {
        accessToken: data.accessToken.substring(0, 20) + '...',
        refreshToken: data.refreshToken.substring(0, 20) + '...',
        user: data.user
      })
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      localStorage.clear()
      throw error
    }
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

