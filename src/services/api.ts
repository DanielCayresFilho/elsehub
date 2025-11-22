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
    let isRefreshing = false
    let failedQueue: any[] = []

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach(prom => {
        if (error) {
          prom.reject(error)
        } else {
          prom.resolve(token)
        }
      })
      failedQueue = []
    }

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest: any = error.config
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error)
          }

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.api.request(originalRequest)
            }).catch(err => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          isRefreshing = true

          const refreshToken = localStorage.getItem('refreshToken')
          
          if (!refreshToken) {
            isRefreshing = false
            this.clearAuthAndRedirect()
            return Promise.reject(error)
          }

          try {
            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
              { refreshToken },
              { timeout: 10000 }
            )
            
            const { accessToken } = response.data
            localStorage.setItem('accessToken', accessToken)
            
            this.api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            
            processQueue(null, accessToken)
            isRefreshing = false
            
            return this.api.request(originalRequest)
          } catch (refreshError) {
            processQueue(refreshError, null)
            isRefreshing = false
            this.clearAuthAndRedirect()
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  private clearAuthAndRedirect() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
  }

  public getClient(): AxiosInstance {
    return this.api
  }
}

export const apiService = new ApiService()
export const api = apiService.getClient()

