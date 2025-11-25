import type { LoginResponse, User } from '@/types'

interface AuthTokensPayload {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn?: string
  refreshTokenExpiresIn?: string
}

export interface AuthApiResponse {
  user: User
  tokens: AuthTokensPayload
}

export const mapAuthApiResponse = (payload: AuthApiResponse): LoginResponse => {
  const tokens = payload.tokens

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error('Resposta de autenticação inválida')
  }

  return {
    user: payload.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresIn: tokens.accessTokenExpiresIn,
    refreshTokenExpiresIn: tokens.refreshTokenExpiresIn
  }
}

