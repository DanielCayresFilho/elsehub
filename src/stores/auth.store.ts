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
    
    console.log('Store: Attempting login with:', credentials.email)
    
    try {
      const response = await authService.login(credentials)
      
      console.log('Store: Login response received:', response)
      
      if (!response || !response.accessToken) {
        console.error('Store: Invalid response:', response)
        throw new Error('Resposta inválida do servidor')
      }
      
      user.value = response.user
      
      // Verify storage
      const storedToken = localStorage.getItem('accessToken')
      const storedRefresh = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')
      
      console.log('Store: Verification after save:', {
        hasToken: !!storedToken,
        hasRefresh: !!storedRefresh,
        hasUser: !!storedUser,
        tokenPreview: storedToken?.substring(0, 20) + '...'
      })
      
      if (!storedToken || !storedRefresh || !storedUser) {
        console.error('Store: Failed to save credentials to localStorage')
        throw new Error('Falha ao salvar credenciais')
      }
      
      // Connect WebSocket after verified
      setTimeout(() => {
        console.log('Store: Connecting WebSocket...')
        wsService.connect()
      }, 500)
      
      return response
    } catch (err: any) {
      console.error('Store: Login error:', err)
      error.value = err.message || err.response?.data?.message || 'Erro ao fazer login'
      localStorage.clear()
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

