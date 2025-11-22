import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
            try {
              const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                { refreshToken }
              )
              const { accessToken } = response.data
              localStorage.setItem('accessToken', accessToken)
              
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${accessToken}`
                return this.api.request(error.config)
              }
            } catch {
              // Refresh failed, logout
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }
          } else {
            // No refresh token, logout
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  public getClient(): AxiosInstance {
    return this.api
  }
}

export const apiService = new ApiService()
export const api = apiService.getClient()

