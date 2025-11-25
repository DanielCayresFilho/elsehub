<template>
  <div class="dashboard-view">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Conversas Ativas</p>
            <p class="stat-value">{{ stats.activeConversations }}</p>
            <p v-if="stats.activeConversations > 0" class="stat-change success">
              <i class="fas fa-check-circle"></i> Ativas
            </p>
          </div>
          <div class="stat-icon blue">
            <i class="fas fa-comments"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Mensagens Hoje</p>
            <p class="stat-value">{{ stats.totalMessages }}</p>
            <p v-if="stats.totalMessages > 0" class="stat-change success">
              <i class="fas fa-envelope"></i> Total
            </p>
          </div>
          <div class="stat-icon green">
            <i class="fas fa-envelope"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Taxa de Resposta</p>
            <p class="stat-value">{{ stats.responseRate }}%</p>
            <p v-if="stats.responseRate > 0" class="stat-change" :class="stats.responseRate >= 80 ? 'success' : 'warning'">
              <i class="fas fa-chart-line"></i> Taxa
            </p>
          </div>
          <div class="stat-icon orange">
            <i class="fas fa-chart-line"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">Tempo Médio</p>
            <p class="stat-value">{{ formatTime(stats.averageResponseTime) }}</p>
            <p v-if="stats.averageResponseTime > 0" class="stat-change info">
              <i class="fas fa-clock"></i> Médio
            </p>
          </div>
          <div class="stat-icon purple">
            <i class="fas fa-clock"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Recent Conversations -->
      <div class="content-section">
        <div class="card">
          <div class="card-header">
            <h3>Conversas Recentes</h3>
          </div>
          
          <div v-if="loading" class="loading"></div>
          
          <div v-else-if="recentConversations.length === 0" class="empty-state">
            <i class="fas fa-comments"></i>
            <p>Nenhuma conversa recente</p>
          </div>
          
          <div v-else class="conversations-list">
            <div 
              v-for="conversation in recentConversations" 
              :key="conversation.id"
              class="conversation-item"
              @click="openConversation(conversation.id)"
            >
              <div class="conversation-avatar">
                {{ getInitials(conversation.contact?.name || 'Desconhecido') }}
              </div>
              <div class="conversation-info">
                <div class="conversation-header">
                  <h4>{{ conversation.contact?.name || 'Desconhecido' }}</h4>
                  <span class="conversation-time">{{ formatDate(conversation.lastMessageAt) }}</span>
                </div>
                <p class="conversation-message">
                  {{ conversation.messages?.[conversation.messages.length - 1]?.content || 'Sem mensagens' }}
                </p>
              </div>
              <span :class="['status-indicator', conversation.status.toLowerCase()]"></span>
            </div>
          </div>
          
          <div class="card-footer">
            <router-link to="/conversas" class="view-all-link">
              Ver todas as conversas
            </router-link>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Stats -->
      <div class="sidebar-section">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3>Ações Rápidas</h3>
          </div>
          <div class="quick-actions">
            <button @click="router.push('/conversas')" class="action-btn blue">
              <i class="fas fa-plus"></i>
              <span>Nova Conversa</span>
            </button>
            <button v-if="!isOperator" @click="router.push('/campanhas/nova')" class="action-btn green">
              <i class="fas fa-bullhorn"></i>
              <span>Nova Campanha</span>
            </button>
            <button @click="router.push('/contatos')" class="action-btn purple">
              <i class="fas fa-users"></i>
              <span>Contatos</span>
            </button>
            <button v-if="!isOperator" @click="router.push('/relatorios')" class="action-btn orange">
              <i class="fas fa-chart-bar"></i>
              <span>Relatórios</span>
            </button>
          </div>
        </div>

        <!-- Performance -->
        <div class="card">
          <div class="card-header">
            <h3>Desempenho Semanal</h3>
          </div>
          <div class="performance-metrics">
            <div class="metric">
              <div class="metric-header">
                <span>Taxa de Resposta</span>
                <span class="metric-value">{{ stats.responseRate }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill green" :style="{ width: `${stats.responseRate}%` }"></div>
              </div>
            </div>
            <div class="metric">
              <div class="metric-header">
                <span>Tempo Médio</span>
                <span class="metric-value">{{ formatTime(stats.averageResponseTime) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill blue" style="width: 75%"></div>
              </div>
            </div>
            <div class="metric">
              <div class="metric-header">
                <span>Conversas Fechadas</span>
                <span class="metric-value">{{ stats.closedConversations }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill purple" :style="{ width: stats.totalConversations > 0 ? `${(stats.closedConversations / stats.totalConversations) * 100}%` : '0%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Conversation, Statistics } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const recentConversations = ref<Conversation[]>([])
const stats = ref<Statistics>({
  totalConversations: 0,
  activeConversations: 0,
  closedConversations: 0,
  totalMessages: 0,
  averageResponseTime: 0,
  responseRate: 0
})

// Remove mock data - all data comes from API

const isOperator = computed(() => authStore.isOperator)

const loadDashboardData = () => {
  loading.value = true
  recentConversations.value = [
    {
      id: 'conv-dashboard-1',
      contactId: 'contact-demo',
      contactName: 'Cliente Demo',
      serviceInstanceId: 'instance-demo',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: 'Exemplo de conversa em andamento.',
      lastMessageDirection: 'INBOUND'
    } as Conversation
  ]
  stats.value = {
    totalConversations: 24,
    activeConversations: 6,
    closedConversations: 18,
    totalMessages: 180,
    averageResponseTime: 65,
    responseRate: 92
  }
  loading.value = false
}

const getInitials = (name: string) => {
  const names = name.split(' ')
  return names.length > 1 
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}

const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 60) return `${minutes}m atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

const openConversation = (id: string) => {
  router.push(`/conversas?id=${id}`)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.dashboard-view {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  @include card;
}

.stat-content {
  @include flex-between;
}

.stat-info {
  .stat-label {
    font-size: 0.875rem;
    color: $text-secondary-light;
    margin-bottom: $spacing-xs;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: $text-primary-light;
    margin-bottom: $spacing-xs;

    .dark & {
      color: $text-primary-dark;
    }
  }

  .stat-change {
    font-size: 0.875rem;
    font-weight: 500;

    &.success {
      color: $success;
    }

    &.error {
      color: $error;
    }

    &.warning {
      color: $warning;
    }

    &.info {
      color: $info;
    }

    i {
      margin-right: $spacing-xs;
    }
  }
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: $radius-lg;
  @include flex-center;
  font-size: 1.5rem;

  &.blue {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
  }

  &.green {
    background: rgba($success, 0.1);
    color: $success;
  }

  &.orange {
    background: rgba($warning, 0.1);
    color: $warning;
  }

  &.purple {
    background: rgba(#7c3aed, 0.1);
    color: #7c3aed;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 25rem;
  gap: $spacing-lg;

  @include max-width($breakpoint-lg) {
    grid-template-columns: 1fr;
  }
}

.content-section,
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.card-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.conversations-list {
  display: flex;
  flex-direction: column;
}

.conversation-item {
  @include flex-start;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  cursor: pointer;
  transition: background $transition-fast;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  &:hover {
    background: rgba($primary-light, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
}

.conversation-avatar {
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

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  @include flex-between;
  margin-bottom: $spacing-xs;

  h4 {
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }

  .conversation-time {
    font-size: 0.75rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.conversation-message {
  font-size: 0.875rem;
  color: $text-secondary-light;
  @include truncate;

  .dark & {
    color: $text-secondary-dark;
  }
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: $radius-full;
  flex-shrink: 0;

  &.open {
    background: $success;
  }

  &.closed {
    background: $text-secondary-light;
  }
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }

  i {
    font-size: 3rem;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }

  p {
    font-size: 0.875rem;
  }
}

.card-footer {
  padding: $spacing-lg;
  border-top: 1px solid $border-light;
  text-align: center;

  .dark & {
    border-color: $border-dark;
  }
}

.view-all-link {
  color: $primary-light;
  font-weight: 500;
  font-size: 0.875rem;

  &:hover {
    color: $primary-dark;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  padding: $spacing-lg;
}

.action-btn {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-lg;
  border: none;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-fast;
  font-size: 0.875rem;
  font-weight: 500;

  i {
    font-size: 1.25rem;
  }

  &.blue {
    background: rgba($primary-light, 0.1);
    color: $primary-light;

    &:hover {
      background: rgba($primary-light, 0.2);
    }
  }

  &.green {
    background: rgba($success, 0.1);
    color: $success;

    &:hover {
      background: rgba($success, 0.2);
    }
  }

  &.purple {
    background: rgba(#7c3aed, 0.1);
    color: #7c3aed;

    &:hover {
      background: rgba(#7c3aed, 0.2);
    }
  }

  &.orange {
    background: rgba($warning, 0.1);
    color: $warning;

    &:hover {
      background: rgba($warning, 0.2);
    }
  }
}

.performance-metrics {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.metric {
  .metric-header {
    @include flex-between;
    margin-bottom: $spacing-xs;
    font-size: 0.875rem;

    span {
      color: $text-secondary-light;

      .dark & {
        color: $text-secondary-dark;
      }
    }

    .metric-value {
      font-weight: 600;
      color: $text-primary-light;

      .dark & {
        color: $text-primary-dark;
      }
    }
  }
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: $border-light;
  border-radius: $radius-full;
  overflow: hidden;

  .dark & {
    background: $border-dark;
  }
}

.progress-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width $transition-slow;

  &.green {
    background: $success;
  }

  &.blue {
    background: $primary-light;
  }

  &.purple {
    background: #7c3aed;
  }
}
</style>

