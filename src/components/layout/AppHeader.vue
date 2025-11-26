<template>
  <header class="app-header">
    <div class="header-left">
      <button @click="toggleSidebar" class="sidebar-toggle">
        <i class="fas fa-bars"></i>
      </button>
      <h2 class="page-title">{{ pageTitle }}</h2>
    </div>

    <div class="header-right">
      <!-- Search -->
      <div class="search-box">
        <input 
          type="search" 
          v-model="searchQuery"
          placeholder="Buscar..."
          @keyup.enter="handleSearch"
        />
        <i class="fas fa-search"></i>
      </div>

      <!-- Online Status (for operators) -->
      <button 
        v-if="isOperator" 
        @click="toggleOnlineStatus"
        :class="['status-toggle', { 'status-online': isOnline }]"
        :title="isOnline ? 'Online' : 'Offline'"
      >
        <i :class="['fas', isOnline ? 'fa-circle' : 'fa-circle']"></i>
        <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
      </button>

      <!-- Notifications -->
      <button class="icon-btn" title="Notificações">
        <i class="fas fa-bell"></i>
        <span v-if="notificationCount" class="notification-badge">{{ notificationCount }}</span>
      </button>

      <!-- Theme Toggle -->
      <button @click="toggleTheme" class="icon-btn theme-toggle" title="Alternar tema">
        <i :class="['fas', isDark ? 'fa-sun' : 'fa-moon']"></i>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { userService } from '@/services/user.service'

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const searchQuery = ref('')
const isOnline = ref(authStore.user?.isOnline || false)
const notificationCount = ref(0)

const isDark = computed(() => themeStore.isDark)
const isOperator = computed(() => authStore.isOperator)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/conversas': 'Conversas',
    '/contatos': 'Contatos',
    '/campanhas': 'Campanhas',
    '/campanhas/nova': 'Nova Campanha',
    '/relatorios': 'Relatórios',
    '/configuracoes': 'Configurações',
    '/usuarios': 'Usuários',
    '/instancias': 'Instâncias WhatsApp',
    '/templates': 'Templates',
    '/tabulacoes': 'Tabulações'
  }
  return titles[route.path] || 'ElseHub'
})

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('Buscar:', searchQuery.value)
    // Implement search functionality
  }
}

const toggleOnlineStatus = async () => {
  try {
    isOnline.value = !isOnline.value
    await userService.toggleOnline(isOnline.value)
    await authStore.refreshProfile()
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    isOnline.value = !isOnline.value
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.app-header {
  height: $header-height;
  background: $background-light;
  border-bottom: 1px solid $border-light;
  padding: 0 $spacing-lg;
  @include flex-between;
  position: sticky;
  top: 0;
  z-index: 50;

  .dark & {
    background: $surface-dark;
    border-color: $border-dark;
  }

  @include mobile {
    padding: 0 $spacing-md;
  }
}

.header-left {
  @include flex-start;
  gap: $spacing-md;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-sm;
  font-size: 1.25rem;
  transition: color $transition-fast;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary-light;

  .dark & {
    color: $text-primary-dark;
  }

  @include mobile {
    font-size: 1rem;
  }
}

.header-right {
  @include flex-start;
  gap: $spacing-md;
}

.search-box {
  position: relative;
  display: none;

  @include min-width($breakpoint-md) {
    display: block;
  }

  input {
    width: 16rem;
    padding: $spacing-sm $spacing-md;
    padding-right: 2.5rem;
    background: $surface-light;
    border: 1px solid $border-light;
    border-radius: $radius-lg;
    font-size: 0.875rem;
    transition: all $transition-fast;

    .dark & {
      background: $background-dark;
      border-color: $border-dark;
      color: $text-primary-dark;
    }

    &:focus {
      outline: none;
      border-color: $primary-light;
      width: 20rem;
    }

    &::placeholder {
      color: $text-secondary-light;

      .dark & {
        color: $text-secondary-dark;
      }
    }
  }

  i {
    position: absolute;
    right: $spacing-md;
    top: 50%;
    transform: translateY(-50%);
    color: $text-secondary-light;
    pointer-events: none;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.status-toggle {
  @include flex-start;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-md;
  background: rgba($error, 0.1);
  color: $error;
  border: none;
  border-radius: $radius-full;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;

  &.status-online {
    background: rgba($success, 0.1);
    color: $success;
  }

  i {
    font-size: 0.5rem;
  }

  &:hover {
    opacity: 0.8;
  }
}

.icon-btn {
  position: relative;
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-sm;
  font-size: 1.25rem;
  transition: color $transition-fast;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: $error;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: $radius-full;
  line-height: 1;
}

.theme-toggle {
  i {
    transition: transform $transition-normal;
  }

  &:hover i {
    transform: rotate(20deg);
  }
}
</style>

