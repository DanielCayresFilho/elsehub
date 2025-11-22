import { api } from './api'
import type { LoginRequest, LoginResponse, RefreshTokenRequest, User } from '@/types'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<any>('/auth/login', credentials)
      const rawData = response.data
      
      console.log('Login response:', rawData)
      
      // Check if tokens are nested inside 'tokens' object
      let accessToken = rawData.accessToken
      let refreshToken = rawData.refreshToken
      let user = rawData.user
      
      // Handle nested tokens structure
      if (rawData.tokens) {
        accessToken = rawData.tokens.accessToken
        refreshToken = rawData.tokens.refreshToken
      }
      
      // Validate response
      if (!accessToken || !refreshToken || !user) {
        console.error('Invalid login response:', rawData)
        throw new Error('Resposta inválida do servidor')
      }
      
      // Store tokens and user
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      console.log('Tokens saved successfully:', {
        accessToken: accessToken.substring(0, 20) + '...',
        refreshToken: refreshToken.substring(0, 20) + '...',
        user: user
      })
      
      // Return normalized structure
      return {
        accessToken,
        refreshToken,
        user
      }
    } catch (error) {
      console.error('Login error:', error)
      localStorage.clear()
      throw error
    }
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const payload: RefreshTokenRequest = { refreshToken }
    const response = await api.post<any>('/auth/refresh', payload)
    const rawData = response.data
    
    // Handle nested tokens structure
    let accessToken = rawData.accessToken
    if (rawData.tokens) {
      accessToken = rawData.tokens.accessToken
    }
    
    if (!accessToken) {
      throw new Error('Invalid refresh response')
    }
    
    // Update tokens
    localStorage.setItem('accessToken', accessToken)
    
    return {
      accessToken,
      refreshToken,
      user: rawData.user
    }
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

