<template>
  <div class="reports-view">
    <h2>Relatórios e Estatísticas</h2>

    <div v-if="loading" class="loading"></div>

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
        <button @click="loadReports" class="btn-primary">Atualizar</button>
      </div>
    </div>

    <!-- Exportações CSV -->
    <div class="export-card card">
      <h3>Exportar Relatórios CSV</h3>
      <div class="export-grid">
        <button 
          @click="exportStatistics" 
          class="export-btn"
          :disabled="exporting"
        >
          <i class="fas fa-file-csv"></i>
          <span>Estatísticas Gerais</span>
        </button>
        <button 
          @click="exportOperatorPerformance" 
          class="export-btn"
          :disabled="exporting"
        >
          <i class="fas fa-file-csv"></i>
          <span>Performance de Operadores</span>
        </button>
        <button 
          @click="exportCampaigns" 
          class="export-btn"
          :disabled="exporting"
        >
          <i class="fas fa-file-csv"></i>
          <span>Relatório de Campanhas</span>
        </button>
        <button 
          @click="exportMessages" 
          class="export-btn"
          :disabled="exporting"
        >
          <i class="fas fa-file-csv"></i>
          <span>Relatório de Mensagens</span>
        </button>
      </div>
      <p v-if="exporting" class="export-status">
        <i class="fas fa-spinner fa-spin"></i>
        Gerando arquivo...
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <h3>Total de Conversas</h3>
        <p class="stat-value">{{ stats.totalConversations }}</p>
      </div>
      <div class="stat-card card">
        <h3>Taxa de Resposta</h3>
        <p class="stat-value">{{ stats.responseRate }}%</p>
      </div>
      <div class="stat-card card">
        <h3>Tempo Médio de Resposta</h3>
        <p class="stat-value">{{ formatTime(stats.avgResponseTimeSeconds) }}</p>
      </div>
    </div>

    <div class="card">
      <h3>Performance por Operador</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Operador</th>
            <th>Conversas</th>
            <th>Mensagens</th>
            <th>Tempo Médio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="perf in performance" :key="perf.operatorId">
            <td>{{ perf.operatorName }}</td>
            <td>{{ perf.totalConversations }}</td>
            <td>{{ perf.totalMessages }}</td>
            <td>{{ formatTime(perf.avgResponseTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportService } from '@/services/report.service'
import { downloadCsv, generateCsvFilename } from '@/utils/downloadCsv'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandler'

const stats = ref({
  totalConversations: 0,
  avgDurationSeconds: 0,
  avgResponseTimeSeconds: 0,
  responseRate: 0
})
const performance = ref<Array<{
  operatorId: string
  operatorName: string
  totalConversations: number
  totalMessages: number
  avgDuration: number
  avgResponseTime: number
}>>([])
const loading = ref(false)
const exporting = ref(false)
const filters = ref({ startDate: '', endDate: '' })

const loadReports = async () => {
  loading.value = true
  try {
    const apiFilters = buildFilters()

    const [statisticsData, performanceData] = await Promise.all([
      reportService.getStatistics(apiFilters),
      reportService.getOperatorPerformance(apiFilters)
    ])

    stats.value = {
      totalConversations: statisticsData.totalConversations || 0,
      avgDurationSeconds: statisticsData.avgDurationSeconds || 0,
      avgResponseTimeSeconds: statisticsData.avgResponseTimeSeconds || 0,
      responseRate: statisticsData.responseRate || 0
    }
    performance.value = performanceData || []
  } catch (error) {
    logger.error('Erro ao carregar relatórios', error)
    stats.value = {
      totalConversations: 0,
      avgDurationSeconds: 0,
      avgResponseTimeSeconds: 0,
      responseRate: 0
    }
    performance.value = []
  } finally {
    loading.value = false
  }
}

const buildFilters = () => {
  const apiFilters: any = {}
  if (filters.value.startDate) {
    apiFilters.startDate = new Date(filters.value.startDate).toISOString()
  }
  if (filters.value.endDate) {
    const endDate = new Date(filters.value.endDate)
    endDate.setHours(23, 59, 59, 999)
    apiFilters.endDate = endDate.toISOString()
  }
  return apiFilters
}

const exportStatistics = async () => {
  exporting.value = true
  try {
    const blob = await reportService.exportStatistics(buildFilters())
    downloadCsv(blob, generateCsvFilename('estatisticas-gerais'))
  } catch (error) {
    logger.error('Erro ao exportar estatísticas', error)
    alert(getErrorMessage(error, 'Erro ao exportar estatísticas. Tente novamente.'))
  } finally {
    exporting.value = false
  }
}

const exportOperatorPerformance = async () => {
  exporting.value = true
  try {
    const blob = await reportService.exportOperatorPerformance(buildFilters())
    downloadCsv(blob, generateCsvFilename('performance-operadores'))
  } catch (error) {
    logger.error('Erro ao exportar performance de operadores', error)
    alert(getErrorMessage(error, 'Erro ao exportar performance de operadores. Tente novamente.'))
  } finally {
    exporting.value = false
  }
}

const exportCampaigns = async () => {
  exporting.value = true
  try {
    const blob = await reportService.exportCampaigns(buildFilters())
    downloadCsv(blob, generateCsvFilename('relatorio-campanhas'))
  } catch (error) {
    logger.error('Erro ao exportar campanhas', error)
    alert(getErrorMessage(error, 'Erro ao exportar campanhas. Tente novamente.'))
  } finally {
    exporting.value = false
  }
}

const exportMessages = async () => {
  exporting.value = true
  try {
    const blob = await reportService.exportMessages(buildFilters())
    downloadCsv(blob, generateCsvFilename('relatorio-mensagens'))
  } catch (error) {
    logger.error('Erro ao exportar mensagens', error)
    alert(getErrorMessage(error, 'Erro ao exportar mensagens. Tente novamente.'))
  } finally {
    exporting.value = false
  }
}

const formatTime = (seconds: number | null | undefined) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}m ${secs}s`
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.reports-view {
  max-width: 1400px;
  margin: 0 auto;

  h2 {
    margin-bottom: $spacing-xl;
  }
}

.filters-card {
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  align-items: end;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.stat-card {
  padding: $spacing-lg;
  text-align: center;

  h3 {
    font-size: 0.875rem;
    color: $text-secondary-light;
    margin-bottom: $spacing-md;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
  }
}

.card {
  h3 {
    padding: $spacing-lg;
    border-bottom: 1px solid $border-light;

    .dark & {
      border-color: $border-dark;
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $surface-light;

    .dark & {
      background: $background-dark;
    }

    th {
      padding: $spacing-md $spacing-lg;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
    }
  }

  tbody {
    td {
      padding: $spacing-md $spacing-lg;
      font-size: 0.875rem;
      border-top: 1px solid $border-light;

      .dark & {
        border-color: $border-dark;
      }
    }
  }
}

.export-card {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;

  h3 {
    margin-bottom: $spacing-lg;
    border: none;
    padding: 0;
  }
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.export-btn {
  @include button-base;
  @include flex-center;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-lg;
  background: rgba($success, 0.1);
  color: $success;
  border: 1px solid rgba($success, 0.2);
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    background: rgba($success, 0.2);
    border-color: rgba($success, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 1.5rem;
    margin-bottom: $spacing-xs;
  }

  span {
    font-weight: 500;
  }
}

.export-status {
  margin-top: $spacing-md;
  text-align: center;
  color: $text-secondary-light;
  font-size: 0.875rem;

  .dark & {
    color: $text-secondary-dark;
  }

  i {
    margin-right: $spacing-xs;
  }
}
</style>

