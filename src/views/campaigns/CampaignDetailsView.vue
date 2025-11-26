<template>
  <div class="campaign-details-view">
    <div v-if="loading" class="loading"></div>

    <template v-else-if="campaign">
      <div class="page-header">
        <h2>{{ campaign.name }}</h2>
        <span :class="['status-badge', campaign.status.toLowerCase()]">
          {{ getStatusText(campaign.status) }}
        </span>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Total de Contatos</p>
              <p class="stat-value">{{ campaign.totalContacts }}</p>
            </div>
            <div class="stat-icon blue">
              <i class="fas fa-users"></i>
            </div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Enviados</p>
              <p class="stat-value">{{ campaign.sentCount }}</p>
            </div>
            <div class="stat-icon green">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Falharam</p>
              <p class="stat-value">{{ campaign.failedCount }}</p>
            </div>
            <div class="stat-icon red">
              <i class="fas fa-times-circle"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="campaign-info card">
        <h3>Informações da Campanha</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Instância:</strong>
            <span>{{ campaign.serviceInstance?.name }}</span>
          </div>
          <div class="info-item">
            <strong>Template:</strong>
            <span>{{ campaign.template?.name || 'Nenhum' }}</span>
          </div>
          <div class="info-item">
            <strong>Delay:</strong>
            <span>{{ campaign.delaySeconds }}s</span>
          </div>
          <div class="info-item">
            <strong>Criada em:</strong>
            <span>{{ formatDateTime(campaign.createdAt) }}</span>
          </div>
        </div>

        <div class="campaign-actions">
          <button 
            v-if="campaign.status === 'PENDING'"
            @click="uploadFile"
            class="btn-primary"
          >
            <i class="fas fa-upload"></i>
            Fazer Upload de Contatos
          </button>
          <button 
            v-if="campaign.status === 'PENDING' && campaign.totalContacts > 0"
            @click="startCampaign"
            class="btn-success"
          >
            <i class="fas fa-play"></i>
            Iniciar Campanha
          </button>
          <button 
            v-if="campaign.status === 'PROCESSING'"
            @click="pauseCampaign"
            class="btn-warning"
          >
            <i class="fas fa-pause"></i>
            Pausar
          </button>
          <button 
            v-if="campaign.status === 'PAUSED'"
            @click="resumeCampaign"
            class="btn-success"
          >
            <i class="fas fa-play"></i>
            Retomar
          </button>
        </div>
      </div>
    </template>

    <input 
      type="file" 
      ref="fileInput" 
      accept=".csv,.xlsx"
      style="display: none"
      @change="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { campaignService } from '@/services/campaign.service'
import type { Campaign } from '@/types'

const route = useRoute()

const campaign = ref<Campaign | null>(null)
const loading = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

const loadCampaign = async () => {
  loading.value = true
  try {
    campaign.value = await campaignService.getCampaign(route.params.id as string)
  } catch (error) {
    console.error('Erro ao carregar campanha:', error)
  } finally {
    loading.value = false
  }
}

const uploadFile = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !campaign.value) return

  try {
    await campaignService.uploadContacts(campaign.value.id, file)
    await loadCampaign()
    alert('Contatos carregados com sucesso!')
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    alert('Erro ao fazer upload dos contatos')
  }
}

const startCampaign = async () => {
  if (!campaign.value) return
  try {
    await campaignService.startCampaign(campaign.value.id)
    await loadCampaign()
  } catch (error) {
    alert('Erro ao iniciar campanha')
  }
}

const pauseCampaign = async () => {
  if (!campaign.value) return
  try {
    await campaignService.pauseCampaign(campaign.value.id)
    await loadCampaign()
  } catch (error) {
    alert('Erro ao pausar campanha')
  }
}

const resumeCampaign = async () => {
  if (!campaign.value) return
  try {
    await campaignService.resumeCampaign(campaign.value.id)
    await loadCampaign()
  } catch (error) {
    alert('Erro ao retomar campanha')
  }
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    PAUSED: 'Pausada',
    COMPLETED: 'Concluída',
    FAILED: 'Falhou'
  }
  return texts[status] || status
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('pt-BR')
}

onMounted(() => {
  loadCampaign()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.campaign-details-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  @include flex-between;
  margin-bottom: $spacing-xl;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
}

.status-badge {
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-full;
  font-size: 0.875rem;
  font-weight: 500;

  &.pending { background: rgba($text-secondary-light, 0.1); color: $text-secondary-light; }
  &.processing { background: rgba($primary-light, 0.1); color: $primary-light; }
  &.paused { background: rgba($warning, 0.1); color: $warning; }
  &.completed { background: rgba($success, 0.1); color: $success; }
  &.failed { background: rgba($error, 0.1); color: $error; }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.stat-card {
  padding: $spacing-lg;
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
  }
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: $radius-lg;
  @include flex-center;
  font-size: 1.5rem;

  &.blue { background: rgba($primary-light, 0.1); color: $primary-light; }
  &.green { background: rgba($success, 0.1); color: $success; }
  &.red { background: rgba($error, 0.1); color: $error; }
}

.campaign-info {
  padding: $spacing-xl;

  h3 {
    margin-bottom: $spacing-lg;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    strong {
      font-size: 0.875rem;
      color: $text-secondary-light;

      .dark & {
        color: $text-secondary-dark;
      }
    }

    span {
      font-size: 1rem;
      font-weight: 500;
    }
  }

  .campaign-actions {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;
  }
}
</style>

