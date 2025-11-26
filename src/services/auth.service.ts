import axios from 'axios'
import type { LoginRequest, LoginResponse, User } from '@/types'
import { api } from './api'
import { mapAuthApiResponse } from './auth.mappers'
import { tokenService } from './token.service'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const authHttp = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const persistUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await authHttp.post('/auth/login', credentials)
    const response = mapAuthApiResponse(data)
    tokenService.persistSession(response)
    persistUser(response.user)
    return response
  },

  async refreshToken(refreshToken?: string): Promise<LoginResponse> {
    const tokenToUse = refreshToken ?? tokenService.getRefreshToken()
    if (!tokenToUse) {
      throw new Error('Refresh token indisponível')
    }
    const { data } = await authHttp.post('/auth/refresh', { refreshToken: tokenToUse })
    const response = mapAuthApiResponse(data)
    tokenService.persistSession(response)
    persistUser(response.user)
    return response
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile')
    persistUser(data)
    return data
  },

  logout(): void {
    tokenService.clear()
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
    return !!tokenService.getAccessToken()
  }
}

