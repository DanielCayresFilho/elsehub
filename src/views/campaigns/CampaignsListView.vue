<template>
  <div class="campaigns-view">
    <div class="page-header">
      <h2>Campanhas</h2>
      <router-link to="/campanhas/nova" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nova Campanha
      </router-link>
    </div>

    <div v-if="loading" class="loading"></div>

    <div v-else-if="campaigns.length === 0" class="empty-state card">
      <i class="fas fa-bullhorn"></i>
      <h3>Nenhuma campanha criada</h3>
      <p>Crie sua primeira campanha de disparo em massa</p>
      <router-link to="/campanhas/nova" class="btn-primary">
        Criar Campanha
      </router-link>
    </div>

    <div v-else class="campaigns-grid">
      <div 
        v-for="campaign in campaigns" 
        :key="campaign.id" 
        class="campaign-card card"
        @click="$router.push(`/campanhas/${campaign.id}`)"
      >
        <div class="campaign-header">
          <h3>{{ campaign.name }}</h3>
          <span :class="['status-badge', getStatusClass(campaign.status)]">
            {{ getStatusText(campaign.status) }}
          </span>
        </div>

        <div class="campaign-stats">
          <div class="stat">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ campaign.totalContacts }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Enviados</span>
            <span class="stat-value success">{{ campaign.sentCount }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Falharam</span>
            <span class="stat-value error">{{ campaign.failedCount }}</span>
          </div>
        </div>

        <div class="campaign-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${calculateProgress(campaign)}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ calculateProgress(campaign) }}%</span>
        </div>

        <div class="campaign-footer">
          <span class="campaign-date">
            <i class="fas fa-calendar"></i>
            {{ formatDate(campaign.createdAt) }}
          </span>
          <div class="campaign-actions" @click.stop>
            <button 
              v-if="campaign.status === 'PENDING' || campaign.status === 'PAUSED'" 
              @click="startCampaign(campaign.id)"
              class="btn-success btn-sm"
            >
              <i class="fas fa-play"></i>
              Iniciar
            </button>
            <button 
              v-if="campaign.status === 'PROCESSING'" 
              @click="pauseCampaign(campaign.id)"
              class="btn-warning btn-sm"
            >
              <i class="fas fa-pause"></i>
              Pausar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Campaign, CampaignStatus } from '@/types'
import { campaignService } from '@/services/campaign.service'
import { logger } from '@/utils/logger'

const campaigns = ref<Campaign[]>([])
const loading = ref(true)

const loadCampaigns = async () => {
  loading.value = true
  try {
    campaigns.value = await campaignService.getCampaigns()
  } catch (error) {
    logger.error('Erro ao carregar campanhas', error)
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

const startCampaign = async (id: string) => {
  try {
    const updated = await campaignService.startCampaign(id)
    await loadCampaigns()
  } catch (error: any) {
    logger.error('Erro ao iniciar campanha', error)
    alert(error.response?.data?.message || error.message || 'Erro ao iniciar campanha')
  }
}

const pauseCampaign = async (id: string) => {
  try {
    await campaignService.pauseCampaign(id)
    await loadCampaigns()
  } catch (error: any) {
    logger.error('Erro ao pausar campanha', error)
    alert(error.response?.data?.message || error.message || 'Erro ao pausar campanha')
  }
}

const calculateProgress = (campaign: Campaign) => {
  if (campaign.totalContacts === 0) return 0
  return Math.round((campaign.sentCount / campaign.totalContacts) * 100)
}

const getStatusText = (status: CampaignStatus) => {
  const texts: Record<CampaignStatus, string> = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    PAUSED: 'Pausada',
    COMPLETED: 'Concluída',
    FAILED: 'Falhou'
  }
  return texts[status] || status
}

const getStatusClass = (status: CampaignStatus) => {
  const classes: Record<CampaignStatus, string> = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
  return classes[status] || ''
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return '-'
    return parsedDate.toLocaleDateString('pt-BR')
  } catch (error) {
    return '-'
  }
}

onMounted(() => {
  loadCampaigns()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.campaigns-view {
  max-width: 1400px;
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

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.campaign-card {
  cursor: pointer;
  transition: transform $transition-fast, box-shadow $transition-fast;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
  }
}

.campaign-header {
  @include flex-between;
  margin-bottom: $spacing-md;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
  }
}

.status-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-full;
  font-size: 0.75rem;
  font-weight: 500;

  &.pending {
    background: rgba($text-secondary-light, 0.1);
    color: $text-secondary-light;
  }

  &.processing {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
  }

  &.paused {
    background: rgba($warning, 0.1);
    color: $warning;
  }

  &.completed {
    background: rgba($success, 0.1);
    color: $success;
  }

  &.failed {
    background: rgba($error, 0.1);
    color: $error;
  }
}

.campaign-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .stat-label {
      font-size: 0.75rem;
      color: $text-secondary-light;
      margin-bottom: $spacing-xs;

      .dark & {
        color: $text-secondary-dark;
      }
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;

      &.success {
        color: $success;
      }

      &.error {
        color: $error;
      }
    }
  }
}

.campaign-progress {
  margin-bottom: $spacing-lg;

  .progress-bar {
    width: 100%;
    height: 0.5rem;
    background: $border-light;
    border-radius: $radius-full;
    overflow: hidden;
    margin-bottom: $spacing-xs;

    .dark & {
      background: $border-dark;
    }
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary-light, $accent-light);
    border-radius: $radius-full;
    transition: width $transition-slow;
  }

  .progress-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.campaign-footer {
  @include flex-between;
  padding-top: $spacing-md;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  .campaign-date {
    font-size: 0.875rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }

    i {
      margin-right: $spacing-xs;
    }
  }

  .campaign-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  text-align: center;
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
    margin-bottom: $spacing-lg;
  }
}
</style>

