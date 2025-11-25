<template>
  <div class="reports-view">
    <h2>Relatórios e Estatísticas</h2>

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
        <h3>Tempo Médio</h3>
        <p class="stat-value">{{ formatTime(stats.averageResponseTime) }}</p>
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
            <td>{{ formatTime(perf.averageResponseTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Statistics, OperatorPerformance } from '@/types'

const stats = ref<Statistics>({
  totalConversations: 0,
  activeConversations: 0,
  closedConversations: 0,
  totalMessages: 0,
  averageResponseTime: 0,
  responseRate: 0
})
const performance = ref<OperatorPerformance[]>([])
const filters = ref({ startDate: '', endDate: '' })

const loadReports = () => {
  stats.value = {
    totalConversations: 42,
    activeConversations: 5,
    closedConversations: 37,
    totalMessages: 320,
    averageResponseTime: 90,
    responseRate: 87
  }
  performance.value = [
    {
      operatorId: 'operator-1',
      operatorName: 'João Silva',
      totalConversations: 15,
      totalMessages: 120,
      averageResponseTime: 80,
      satisfaction: 95
    }
  ]
}

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
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
</style>

