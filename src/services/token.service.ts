import type { LoginResponse } from '@/types'

type SessionSnapshot = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

const ACCESS_TOKEN_KEY = 'elsehu.accessToken'
const ACCESS_TOKEN_EXPIRES_KEY = 'elsehu.accessTokenExpiresAt'
const REFRESH_TOKEN_KEY = 'elsehu.refreshToken'
const REFRESH_TOKEN_EXPIRES_KEY = 'elsehu.refreshTokenExpiresAt'

let inMemoryAccessToken: string | null = null
let inMemoryAccessTokenExpiresAt = 0
const listeners = new Set<(snapshot: SessionSnapshot | null) => void>()

const notify = (snapshot: SessionSnapshot | null) => {
  listeners.forEach(callback => callback(snapshot))
}

const parseExpiresIn = (value?: string, fallbackSeconds = 900) => {
  if (!value) return fallbackSeconds * 1000
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) {
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      return numeric * 1000
    }
    return fallbackSeconds * 1000
  }

  const amount = Number(match[1])
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  }

  return amount * multipliers[unit]
}

const readNumber = (key: string) => {
  const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key)
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const tokenService = {
  hydrateFromStorage() {
    const storedToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    const expiresAt = readNumber(ACCESS_TOKEN_EXPIRES_KEY)
    if (storedToken && expiresAt && Date.now() < expiresAt) {
      inMemoryAccessToken = storedToken
      inMemoryAccessTokenExpiresAt = expiresAt
    }
  },

  persistSession(response: LoginResponse) {
    const accessToken = response.accessToken
    const refreshToken = response.refreshToken

    if (!accessToken || !refreshToken) {
      throw new Error('Resposta de autenticação inválida')
    }

    const accessTokenExpiresAt = Date.now() + parseExpiresIn(response.accessTokenExpiresIn)
    const refreshTokenExpiresAt = Date.now() + parseExpiresIn(response.refreshTokenExpiresIn, 7 * 24 * 60 * 60)

    inMemoryAccessToken = accessToken
    inMemoryAccessTokenExpiresAt = accessTokenExpiresAt
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    sessionStorage.setItem(ACCESS_TOKEN_EXPIRES_KEY, accessTokenExpiresAt.toString())

    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(REFRESH_TOKEN_EXPIRES_KEY, refreshTokenExpiresAt.toString())

    notify({
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt
    })
  },

  getAccessToken(): string | null {
    if (inMemoryAccessToken && Date.now() < inMemoryAccessTokenExpiresAt) {
      return inMemoryAccessToken
    }

    const storedToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    const expiresAt = readNumber(ACCESS_TOKEN_EXPIRES_KEY)
    if (!storedToken || !expiresAt || Date.now() >= expiresAt) {
      return null
    }

    inMemoryAccessToken = storedToken
    inMemoryAccessTokenExpiresAt = expiresAt
    return storedToken
  },

  getAccessTokenExpiresAt(): number {
    if (inMemoryAccessTokenExpiresAt) return inMemoryAccessTokenExpiresAt
    const expiresAt = readNumber(ACCESS_TOKEN_EXPIRES_KEY)
    if (expiresAt) {
      inMemoryAccessTokenExpiresAt = expiresAt
    }
    return expiresAt
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  getRefreshTokenExpiresAt(): number {
    const stored = localStorage.getItem(REFRESH_TOKEN_EXPIRES_KEY)
    if (!stored) return 0
    const parsed = Number(stored)
    return Number.isNaN(parsed) ? 0 : parsed
  },

  shouldRefresh(marginMs = 30_000): boolean {
    const expiresAt = this.getAccessTokenExpiresAt()
    if (!expiresAt) return false
    return expiresAt - Date.now() <= marginMs
  },

  clear() {
    inMemoryAccessToken = null
    inMemoryAccessTokenExpiresAt = 0
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_EXPIRES_KEY)
    notify(null)
  },

  subscribe(callback: (snapshot: SessionSnapshot | null) => void) {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }
}

