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
          <select id="instance" v-model="form.serviceInstanceId" required :disabled="saving">
            <option value="">Selecione uma instância</option>
            <option v-for="instance in instances" :key="instance.id" :value="instance.id">
              {{ instance.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="template">Template (Opcional)</label>
          <select id="template" v-model="form.templateId" :disabled="saving">
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
            :disabled="saving"
          />
          <small>Mínimo: 30 segundos</small>
        </div>

        <div class="form-group">
          <label for="scheduled">Agendar para (Opcional)</label>
          <input
            id="scheduled"
            type="datetime-local"
            v-model="form.scheduledAt"
            :disabled="saving"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-actions">
          <router-link to="/campanhas" class="btn-secondary" :class="{ disabled: saving }">Cancelar</router-link>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Criando...' : 'Criar Campanha' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Upload CSV Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Adicionar Contatos à Campanha</h3>
          <button @click="closeUploadModal" class="icon-btn" :disabled="uploading">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="upload-section">
            <div class="form-group">
              <label>Upload de CSV *</label>
              <div class="file-upload">
                <input 
                  type="file" 
                  ref="fileInput" 
                  @change="handleFileSelect" 
                  accept=".csv"
                  :disabled="uploading"
                />
                <div v-if="selectedFile" class="file-info">
                  <i class="fas fa-file-csv"></i>
                  <span>{{ selectedFile.name }}</span>
                  <button @click="clearFile" class="btn-link" type="button" :disabled="uploading">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-else class="file-placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Clique para selecionar um arquivo CSV</p>
                  <small>Máximo 10 MB</small>
                </div>
              </div>
              <small>O CSV deve conter uma coluna com nome "phone", "telefone", "celular" ou "whatsapp"</small>
            </div>
          </div>
          <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
        </div>
        <div class="modal-footer">
          <button @click="closeUploadModal" class="btn-secondary" :disabled="uploading">Pular</button>
          <button @click="uploadCSV" class="btn-primary" :disabled="!selectedFile || uploading">
            {{ uploading ? 'Enviando...' : 'Enviar CSV' }}
          </button>
        </div>
      </div>
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
const showUploadModal = ref(false)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const createdCampaignId = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const loadData = async () => {
  try {
    const [instancesData, templatesData] = await Promise.all([
      serviceInstanceService.getInstances(),
      templateService.getTemplates()
    ])
    instances.value = instancesData.filter(i => i.isActive)
    templates.value = templatesData // getTemplates retorna array direto, não objeto com data
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    alert('Erro ao carregar dados')
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

    const campaign = await campaignService.createCampaign(payload)
    createdCampaignId.value = campaign.id
    
    // Abrir modal de upload
    showUploadModal.value = true
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao criar campanha'
    saving.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    
    // Validar tamanho (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      uploadError.value = 'Arquivo muito grande. Máximo 10 MB'
      return
    }
    
    // Validar extensão
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError.value = 'Apenas arquivos CSV são permitidos'
      return
    }
    
    selectedFile.value = file
    uploadError.value = ''
  }
}

const clearFile = () => {
  selectedFile.value = null
  uploadError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadCSV = async () => {
  if (!selectedFile.value || !createdCampaignId.value) return

  uploading.value = true
  uploadError.value = ''

  try {
    const result = await campaignService.uploadContacts(createdCampaignId.value, selectedFile.value)
    alert(`CSV enviado com sucesso! ${result.totalContacts} contatos adicionados.`)
    closeUploadModal()
    router.push('/campanhas')
  } catch (err: any) {
    uploadError.value = err.response?.data?.message || 'Erro ao enviar CSV'
  } finally {
    uploading.value = false
  }
}

const closeUploadModal = () => {
  if (uploading.value) return
  
  showUploadModal.value = false
  selectedFile.value = null
  uploadError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  // Se não fez upload, redireciona mesmo assim
  if (createdCampaignId.value) {
    router.push('/campanhas')
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

    .disabled {
      pointer-events: none;
      opacity: 0.5;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 1000;
}

.modal {
  background: $background-light;
  border-radius: $radius-lg;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-xl;

  .dark & {
    background: $surface-dark;
  }
}

.modal-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.modal-body {
  padding: $spacing-lg;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }
}

.icon-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;
  font-size: 1.125rem;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover:not(:disabled) {
    color: $primary-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.file-upload {
  position: relative;
  border: 2px dashed $border-light;
  border-radius: $radius-md;
  padding: $spacing-lg;
  text-align: center;
  cursor: pointer;
  transition: border-color $transition-fast;

  .dark & {
    border-color: $border-dark;
  }

  &:hover {
    border-color: $primary-light;
  }

  input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }

    i {
      color: $success;
    }

    span {
      flex: 1;
      text-align: left;
    }

    .btn-link {
      background: none;
      border: none;
      color: $error;
      cursor: pointer;
      padding: $spacing-xs;

      &:hover:not(:disabled) {
        opacity: 0.8;
      }
    }
  }

  .file-placeholder {
    i {
      font-size: 2rem;
      color: $text-secondary-light;
      margin-bottom: $spacing-sm;

      .dark & {
        color: $text-secondary-dark;
      }
    }

    p {
      color: $text-primary-light;
      margin-bottom: $spacing-xs;

      .dark & {
        color: $text-primary-dark;
      }
    }

    small {
      color: $text-secondary-light;
      font-size: 0.75rem;

      .dark & {
        color: $text-secondary-dark;
      }
    }
  }
}
</style>

