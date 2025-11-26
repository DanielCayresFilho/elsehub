import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenService } from './token.service'
import { mapAuthApiResponse } from './auth.mappers'

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const persistUser = (user: any) => {
  if (!user) return
  localStorage.setItem('user', JSON.stringify(user))
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenService.getRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token ausente')
  }
  const { data } = await refreshClient.post('/auth/refresh', { refreshToken })
  const response = mapAuthApiResponse(data)
  tokenService.persistSession(response)
  persistUser(response.user)
  return response.accessToken
}

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error

    if (!response || response.status !== 401 || !config) {
      return Promise.reject(error)
    }

    const requestConfig = config as AuthRequestConfig
    if (requestConfig._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) {
      tokenService.clear()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (!requestConfig.headers) requestConfig.headers = {}
            requestConfig.headers.Authorization = `Bearer ${token}`
            requestConfig._retry = true
            resolve(api.request(requestConfig))
          },
          reject
        })
      })
    }

    requestConfig._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      processQueue(null, newToken)
      if (!requestConfig.headers) requestConfig.headers = {}
      requestConfig.headers.Authorization = `Bearer ${newToken}`
      return api.request(requestConfig)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenService.clear()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export { api }

