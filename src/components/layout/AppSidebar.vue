<template>
  <aside :class="['sidebar', { 'sidebar-collapsed': isCollapsed }]">
    <!-- Logo Section -->
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon">
          <img src="/logo.png" alt="ElseHub" />
        </div>
        <div v-if="!isCollapsed" class="logo-text">
          <h1>ElseHub</h1>
          <p>Workstation</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <!-- Atendimento Section -->
      <div class="nav-section">
        <h3 v-if="!isCollapsed" class="nav-section-title">Atendimento</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/dashboard" class="nav-link">
              <i class="fas fa-chart-pie"></i>
              <span v-if="!isCollapsed">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/conversas" class="nav-link">
              <i class="fas fa-message"></i>
              <span v-if="!isCollapsed">Conversas</span>
              <span v-if="!isCollapsed && unreadCount" class="badge badge-primary">{{ unreadCount }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/contatos" class="nav-link">
              <i class="fas fa-users"></i>
              <span v-if="!isCollapsed">Contatos</span>
            </router-link>
          </li>
          <li>
            <router-link to="/historico" class="nav-link">
              <i class="fas fa-history"></i>
              <span v-if="!isCollapsed">Histórico</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Campanhas Section -->
      <div class="nav-section">
        <h3 v-if="!isCollapsed" class="nav-section-title">Campanhas</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/campanhas" class="nav-link" exact>
              <i class="fas fa-megaphone"></i>
              <span v-if="!isCollapsed">Campanhas</span>
            </router-link>
          </li>
          <li v-if="!isOperator">
            <router-link to="/campanhas/nova" class="nav-link">
              <i class="fas fa-circle-plus"></i>
              <span v-if="!isCollapsed">Nova Campanha</span>
            </router-link>
          </li>
          <li v-if="!isOperator">
            <router-link to="/relatorios" class="nav-link">
              <i class="fas fa-chart-column"></i>
              <span v-if="!isCollapsed">Relatórios</span>
            </router-link>
          </li>
          <li>
            <router-link to="/templates" class="nav-link">
              <i class="fas fa-file-lines"></i>
              <span v-if="!isCollapsed">Templates</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Administração Section -->
      <div class="nav-section">
        <h3 v-if="!isCollapsed" class="nav-section-title">Administração</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/configuracoes" class="nav-link">
              <i class="fas fa-gear"></i>
              <span v-if="!isCollapsed">Configurações</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/usuarios" class="nav-link">
              <i class="fas fa-user-group"></i>
              <span v-if="!isCollapsed">Usuários</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/instancias" class="nav-link">
              <i class="fas fa-microchip"></i>
              <span v-if="!isCollapsed">Instâncias</span>
            </router-link>
          </li>
          <li v-if="!isOperator">
            <router-link to="/tabulacoes" class="nav-link">
              <i class="fas fa-bookmark"></i>
              <span v-if="!isCollapsed">Tabulações</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- User Profile -->
    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
        <div v-if="!isCollapsed" class="user-info">
          <p class="user-name">{{ user?.name }}</p>
          <p class="user-email">{{ user?.email }}</p>
        </div>
        <button v-if="!isCollapsed" @click="logout" class="logout-btn" title="Sair">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useConversationStore } from '@/stores/conversation.store'

defineProps<{
  isCollapsed: boolean
}>()

const authStore = useAuthStore()
const conversationStore = useConversationStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isOperator = computed(() => authStore.isOperator)

const userInitials = computed(() => {
  if (!user.value) return '??'
  const names = user.value.name.split(' ')
  return names.length > 1 
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
})

const unreadCount = computed(() => {
  return conversationStore.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
})

const logout = () => {
  authStore.logout()
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.sidebar {
  width: $sidebar-width;
  height: 100vh;
  background: $surface-light;
  border-right: 1px solid $border-light;
  display: flex;
  flex-direction: column;
  transition: width $transition-normal;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;

  .dark & {
    background: $surface-dark;
    border-color: $border-dark;
  }

  &.sidebar-collapsed {
    width: 5rem;
  }

  @include mobile {
    transform: translateX(-100%);
    
    &.sidebar-open {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }
}

.logo-container {
  @include flex-start;
  gap: $spacing-md;
}

.logo-icon {
  width: 3rem;
  height: 3rem;
  background: white;
  border: 2px solid #000;
  border-radius: $radius-lg;
  @include flex-center;
  flex-shrink: 0;

  .dark & {
    background: white;
    border-color: #333;
  }

  img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }
}

.logo-text {
  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    font-size: 0.75rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
  @include custom-scrollbar;
}

.nav-section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: $text-secondary-light;
  margin-bottom: $spacing-sm;
  padding: 0 $spacing-sm;
  letter-spacing: 0.05em;

  .dark & {
    color: $text-secondary-dark;
  }
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.nav-link {
  @include flex-start;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  color: $text-primary-light;
  transition: all $transition-fast;
  position: relative;

  .dark & {
    color: $text-primary-dark;
  }

  i {
    width: 1.25rem;
    text-align: center;
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }

  &:hover {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
  }

  &.router-link-active,
  &.router-link-exact-active {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
    font-weight: 600;

    .dark & {
      background: rgba($primary-light, 0.2);
    }
  }

  &:not(.router-link-exact-active)[href*="/campanhas/nova"] {
    &.router-link-active {
      background: transparent;
      color: $text-primary-light;
      font-weight: 400;

      .dark & {
        color: $text-primary-dark;
        background: transparent;
      }

      &:hover {
        background: rgba($primary-light, 0.1);
        color: $primary-light;
      }
    }
  }

  .badge {
    margin-left: auto;
  }
}

.sidebar-footer {
  padding: $spacing-md;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }
}

.user-profile {
  @include flex-start;
  gap: $spacing-md;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  @include flex-center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: $text-primary-light;
    @include truncate;

    .dark & {
      color: $text-primary-dark;
    }
  }

  .user-email {
    font-size: 0.75rem;
    color: $text-secondary-light;
    @include truncate;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.logout-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;
  transition: color $transition-fast;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $error;
  }
}
</style>

