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
  
  // Check authentication and connect WebSocket if authenticated
  if (authStore.checkAuth()) {
    console.log('App: User authenticated, connecting WebSocket')
    authStore.ensureFreshTokens().catch(() => {
      console.warn('App: não foi possível renovar tokens na inicialização')
    })
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
