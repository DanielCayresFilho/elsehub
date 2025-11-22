<template>
  <div class="app-layout">
    <AppSidebar :is-collapsed="isSidebarCollapsed" />
    
    <div :class="['main-container', { 'sidebar-collapsed': isSidebarCollapsed }]">
      <AppHeader @toggle-sidebar="toggleSidebar" />
      
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed.value))
}

onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState) {
    isSidebarCollapsed.value = JSON.parse(savedState)
  }
})
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
</style>

