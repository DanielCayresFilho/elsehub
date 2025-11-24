<template>
  <div class="app-layout">
    <AppSidebar :is-collapsed="isSidebarCollapsed" :is-mobile-open="isMobileSidebarOpen" />

    <div v-if="isMobileSidebarOpen" class="sidebar-overlay" @click="closeMobileSidebar"></div>
    
    <div :class="['main-container', { 'sidebar-collapsed': isSidebarCollapsed }]">
      <AppHeader @toggle-sidebar="handleSidebarToggle" />
      
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const route = useRoute()
const MOBILE_BREAKPOINT = 1024

const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT

const closeMobileSidebar = () => {
  if (isMobileSidebarOpen.value) {
    isMobileSidebarOpen.value = false
  }
}

const handleSidebarToggle = () => {
  if (isMobile()) {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed.value))
  }
}

onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState) {
    isSidebarCollapsed.value = JSON.parse(savedState)
  }

  const handleResize = () => {
    if (!isMobile()) {
      isMobileSidebarOpen.value = false
    }
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

watch(
  () => route.fullPath,
  () => {
    if (isMobile()) {
      isMobileSidebarOpen.value = false
    }
  }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.app-layout {
  display: flex;
  min-height: 100vh;
  background: $surface-light;

  .dark & {
    background: $background-dark;
  }
}

.main-container {
  flex: 1;
  margin-left: $sidebar-width;
  transition: margin-left $transition-normal;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &.sidebar-collapsed {
    margin-left: 5rem;
  }

  @include mobile {
    margin-left: 0;
  }
}

.main-content {
  flex: 1;
  padding: $spacing-lg;
  background: $surface-light;

  .dark & {
    background: $background-dark;
  }

  @include mobile {
    padding: $spacing-md;
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 90;
}
</style>

