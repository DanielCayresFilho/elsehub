<template>
  <router-view v-if="!requiresAuth" />
  <DefaultLayout v-else>
    <router-view />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { wsService } from '@/services/websocket.service'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const requiresAuth = computed(() => route.meta.requiresAuth !== false)

onMounted(() => {
  console.log('App: Mounted, initializing...')
  
  // Initialize theme
  themeStore.initTheme()
  
  // Check localStorage state
  const token = localStorage.getItem('accessToken')
  const refresh = localStorage.getItem('refreshToken')
  const user = localStorage.getItem('user')
  
  console.log('App: LocalStorage state:', {
    hasToken: !!token,
    hasRefresh: !!refresh,
    hasUser: !!user,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'NONE'
  })

  // Check authentication and connect WebSocket if authenticated
  if (authStore.checkAuth()) {
    console.log('App: User authenticated, connecting WebSocket')
    wsService.connect()
  } else {
    console.log('App: User not authenticated')
  }
})
</script>

<style lang="scss">
@import '@/styles/main.scss';

#app {
  min-height: 100vh;
}
</style>
