import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest } from '@/types'
import { authService } from '@/services/auth.service'
import { wsService } from '@/services/websocket.service'
import { tokenService } from '@/services/token.service'

tokenService.hydrateFromStorage()

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(authService.getStoredUser())
  const loading = ref(false)
  const error = ref<string | null>(null)
  let refreshPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!tokenService.getAccessToken())
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isSupervisor = computed(() => user.value?.role === 'SUPERVISOR')
  const isOperator = computed(() => user.value?.role === 'OPERATOR')

  tokenService.subscribe(snapshot => {
    if (!snapshot) {
      user.value = null
    }
  })

  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      user.value = response.user
      wsService.connect()
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Erro ao fazer login'
      tokenService.clear()
      throw err
    } finally {
      loading.value = false
    }
  }

  async function ensureFreshTokens() {
    if (!tokenService.shouldRefresh()) {
      return
    }

    if (!refreshPromise) {
      refreshPromise = authService
        .refreshToken()
        .then(response => {
          user.value = response.user
        })
        .catch(error => {
          logout()
          throw error
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    await refreshPromise
  }

  async function refreshProfile() {
    try {
      await ensureFreshTokens()
      const profile = await authService.getProfile()
      user.value = profile
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      if ((err as any).response?.status === 401) {
        logout()
      }
    }
  }

  function logout() {
    wsService.disconnect()
    authService.logout()
    user.value = null
  }

  function checkAuth() {
    const token = tokenService.getAccessToken()
    if (!token) {
      user.value = null
      return false
    }
    if (!user.value) {
      refreshProfile()
    }
    return true
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isSupervisor,
    isOperator,
    login,
    logout,
    refreshProfile,
    checkAuth,
    ensureFreshTokens
  }
})

