import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest } from '@/types'
import { authService } from '@/services/auth.service'
import { wsService } from '@/services/websocket.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(authService.getStoredUser())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isSupervisor = computed(() => user.value?.role === 'SUPERVISOR')
  const isOperator = computed(() => user.value?.role === 'OPERATOR')

  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(credentials)
      user.value = response.user
      wsService.connect()
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao fazer login'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshProfile() {
    try {
      const profile = await authService.getProfile()
      user.value = profile
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
    }
  }

  function logout() {
    wsService.disconnect()
    authService.logout()
    user.value = null
  }

  function checkAuth() {
    if (!authService.isAuthenticated()) {
      user.value = null
      return false
    }
    if (!user.value) {
      user.value = authService.getStoredUser()
    }
    return !!user.value
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
    checkAuth
  }
})

