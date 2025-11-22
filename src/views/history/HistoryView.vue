<template>
  <div class="history-view">
    <div class="page-header">
      <h2>Histórico de Conversas</h2>
    </div>

    <!-- Filters -->
    <div class="filters-card card">
      <div class="filters-grid">
        <div class="form-group">
          <label>Data Início</label>
          <input type="date" v-model="filters.startDate" />
        </div>
        <div class="form-group">
          <label>Data Fim</label>
          <input type="date" v-model="filters.endDate" />
        </div>
        <div class="form-group">
          <label>Buscar</label>
          <input 
            type="text" 
            v-model="filters.search"
            placeholder="Nome do contato..."
          />
        </div>
        <div class="filter-actions">
          <button @click="loadHistory" class="btn-primary">Filtrar</button>
          <button @click="clearFilters" class="btn-secondary">Limpar</button>
        </div>
      </div>
    </div>

    <!-- History Table -->
    <div class="card">
      <div v-if="loading" class="loading"></div>

      <div v-else-if="conversations.length === 0" class="empty-state">
        <i class="fas fa-history"></i>
        <h3>Nenhuma conversa encontrada</h3>
        <p>Ajuste os filtros ou aguarde novas conversas serem finalizadas</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Contato</th>
              <th>Operador</th>
              <th>Tabulação</th>
              <th>Data/Hora</th>
              <th>Duração</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="conversation in conversations" :key="conversation.id">
              <td>
                <div class="contact-info">
                  <strong>{{ conversation.contact?.name }}</strong>
                  <small>{{ formatPhone(conversation.contact?.phone) }}</small>
                </div>
              </td>
              <td>{{ conversation.operator?.name || '-' }}</td>
              <td>
                <span class="badge badge-primary">
                  {{ conversation.tabulation?.name || '-' }}
                </span>
              </td>
              <td>{{ formatDateTime(conversation.createdAt) }}</td>
              <td>{{ calculateDuration(conversation.createdAt, conversation.closedAt) }}</td>
              <td>
                <span :class="['badge', getStatusClass(conversation.status)]">
                  {{ getStatusText(conversation.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="btn-secondary btn-sm"
        >
          Anterior
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="btn-secondary btn-sm"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportService } from '@/services/report.service'
import type { Conversation } from '@/types'

const conversations = ref<Conversation[]>([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)

const filters = ref({
  startDate: '',
  endDate: '',
  search: ''
})

const loadHistory = async () => {
  loading.value = true
  try {
    const response = await reportService.getFinishedConversations({
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      page: currentPage.value,
      limit: 20
    })
    conversations.value = response.data
    totalPages.value = response.meta.totalPages
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    search: ''
  }
  loadHistory()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadHistory()
}

const formatPhone = (phone?: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('pt-BR')
}

const calculateDuration = (start: string, end?: string) => {
  if (!end) return '-'
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  return `${minutes}min`
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    CLOSED: 'badge-success',
    EXPIRED: 'badge-warning'
  }
  return classes[status] || 'badge-primary'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    CLOSED: 'Finalizada',
    EXPIRED: 'Expirada',
    OPEN: 'Aberta'
  }
  return texts[status] || status
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.history-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: $spacing-xl;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
}

.filters-card {
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  align-items: end;

  .filter-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  strong {
    font-weight: 500;
  }

  small {
    font-size: 0.75rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $surface-light;
    border-bottom: 2px solid $border-light;

    .dark & {
      background: $background-dark;
      border-color: $border-dark;
    }

    th {
      padding: $spacing-md $spacing-lg;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $border-light;

      .dark & {
        border-color: $border-dark;
      }

      &:hover {
        background: rgba($primary-light, 0.05);
      }
    }

    td {
      padding: $spacing-md $spacing-lg;
      font-size: 0.875rem;
    }
  }
}

.pagination {
  @include flex-between;
  padding: $spacing-lg;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  .page-info {
    font-size: 0.875rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
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
    font-size: 4rem;
    margin-bottom: $spacing-lg;
    opacity: 0.3;
  }

  h3 {
    font-size: 1.25rem;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: 0.875rem;
  }
}
</style>

