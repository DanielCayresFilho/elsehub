<template>
  <div class="new-campaign-view">
    <div class="page-header">
      <h2>Nova Campanha</h2>
    </div>

    <div class="campaign-form card">
      <form @submit.prevent="createCampaign">
        <div class="form-group">
          <label for="name">Nome da Campanha *</label>
          <input
            id="name"
            type="text"
            v-model="form.name"
            placeholder="Ex: Promoção Black Friday"
            required
          />
        </div>

        <div class="form-group">
          <label for="instance">Instância WhatsApp *</label>
          <select id="instance" v-model="form.serviceInstanceId" required>
            <option value="">Selecione uma instância</option>
            <option v-for="instance in instances" :key="instance.id" :value="instance.id">
              {{ instance.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="template">Template (Opcional)</label>
          <select id="template" v-model="form.templateId">
            <option value="">Nenhum template</option>
            <option v-for="template in templates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="delay">Delay entre mensagens (segundos) *</label>
          <input
            id="delay"
            type="number"
            v-model.number="form.delaySeconds"
            min="30"
            required
          />
          <small>Mínimo: 30 segundos</small>
        </div>

        <div class="form-group">
          <label for="scheduled">Agendar para (Opcional)</label>
          <input
            id="scheduled"
            type="datetime-local"
            v-model="form.scheduledAt"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-actions">
          <router-link to="/campanhas" class="btn-secondary">Cancelar</router-link>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Criando...' : 'Criar Campanha' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { campaignService } from '@/services/campaign.service'
import { serviceInstanceService } from '@/services/service-instance.service'
import { templateService } from '@/services/template.service'
import type { ServiceInstance, Template } from '@/types'

const router = useRouter()

const instances = ref<ServiceInstance[]>([])
const templates = ref<Template[]>([])
const saving = ref(false)
const error = ref('')

const form = ref({
  name: '',
  serviceInstanceId: '',
  templateId: '',
  delaySeconds: 120,
  scheduledAt: ''
})

const loadData = async () => {
  try {
    const [instancesData, templatesData] = await Promise.all([
      serviceInstanceService.getInstances(),
      templateService.getTemplates()
    ])
    instances.value = instancesData.data
    templates.value = templatesData.data
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
  }
}

const createCampaign = async () => {
  saving.value = true
  error.value = ''

  try {
    const payload: any = {
      name: form.value.name,
      serviceInstanceId: form.value.serviceInstanceId,
      delaySeconds: form.value.delaySeconds
    }

    if (form.value.templateId) {
      payload.templateId = form.value.templateId
    }

    if (form.value.scheduledAt) {
      payload.scheduledAt = new Date(form.value.scheduledAt).toISOString()
    }

    await campaignService.createCampaign(payload)
    router.push('/campanhas')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao criar campanha'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.new-campaign-view {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: $spacing-xl;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
}

.campaign-form {
  padding: $spacing-xl;

  .form-group {
    margin-bottom: $spacing-lg;

    small {
      color: $text-secondary-light;
      font-size: 0.75rem;
      margin-top: $spacing-xs;
      display: block;

      .dark & {
        color: $text-secondary-dark;
      }
    }
  }

  .form-actions {
    @include flex-between;
    gap: $spacing-md;
    margin-top: $spacing-xl;

    button, a {
      flex: 1;
      text-align: center;
    }
  }
}
</style>

