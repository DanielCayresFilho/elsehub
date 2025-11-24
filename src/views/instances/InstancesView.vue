<template>
  <div class="instances-view">
    <div class="page-header">
      <h2>Instâncias WhatsApp</h2>
      <button @click="showModal = true" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nova Instância
      </button>
    </div>

    <div class="instances-grid">
      <div v-for="instance in instances" :key="instance.id" class="instance-card card">
        <div class="instance-header">
          <h3>{{ instance.name }}</h3>
          <span :class="['status-badge', instance.isActive ? 'active' : 'inactive']">
            {{ instance.isActive ? 'Ativa' : 'Inativa' }}
          </span>
        </div>
        <div class="instance-info">
          <p><strong>Provider:</strong> {{ instance.provider }}</p>
          <p><strong>Instância:</strong> {{ instance.credentials.instanceName }}</p>
          <p><strong>Server:</strong> {{ instance.credentials.serverUrl }}</p>
          <p><strong>Criada em:</strong> {{ formatDate(instance.createdAt) }}</p>
        </div>
        <div class="instance-actions">
          <button @click="toggleActive(instance)" class="btn-toggle" :class="{ active: instance.isActive }" :title="instance.isActive ? 'Desativar' : 'Ativar'">
            <i :class="instance.isActive ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
          </button>
          <button @click="editInstance(instance)" class="btn-secondary" title="Editar instância">
            <i class="fas fa-edit"></i>
          </button>
          <button @click="showQRCode(instance.id)" class="btn-secondary" title="Ver QR Code">
            <i class="fas fa-qrcode"></i>
          </button>
          <button @click="deleteInstance(instance.id)" class="btn-danger" title="Deletar instância">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingInstance ? 'Editar Instância' : 'Nova Instância' }}</h3>
          <button @click="closeModal" class="icon-btn" title="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form>
            <div class="form-group">
              <label>Nome</label>
              <input type="text" v-model="form.name" required />
            </div>
            <div v-if="!editingInstance" class="form-group">
              <label>API Token</label>
              <input type="text" v-model="form.credentials.apiToken" required placeholder="xrgr4qjcxhZ3m5kn2Rc3DdN5qSnhS3cp" />
            </div>
            <div v-if="!editingInstance" class="form-group">
              <label>Server URL</label>
              <input type="url" v-model="form.credentials.serverUrl" required placeholder="https://evolution.covenos.com.br" />
            </div>
            <div v-if="!editingInstance" class="form-group">
              <label>Nome da Instância</label>
              <input type="text" v-model="form.credentials.instanceName" required />
            </div>
            <div v-if="editingInstance" class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isActive" />
                <span>Instância Ativa</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="editingInstance ? updateInstance() : createInstance()" class="btn-primary">
            {{ editingInstance ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQRModal" class="modal-overlay" @click="showQRModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>QR Code</h3>
          <button @click="showQRModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body qr-modal-body">
          <div v-if="loadingQR" class="loading"></div>
          <div v-else-if="qrCode" class="qr-container">
            <!-- QR Code em base64 -->
            <div v-if="qrCode.base64" class="qr-image">
              <img :src="qrCode.base64" alt="QR Code" />
              <p class="qr-hint">Escaneie o QR Code com o WhatsApp</p>
            </div>
            <!-- Código de pareamento -->
            <div v-else-if="qrCode.pairingCode" class="qr-pairing">
              <h4>Código de Pareamento</h4>
              <div class="pairing-code">{{ qrCode.pairingCode }}</div>
              <p class="qr-hint">Use este código para conectar a instância</p>
            </div>
            <!-- Já conectada -->
            <div v-else-if="qrCode.message" class="qr-connected">
              <i class="fas fa-check-circle"></i>
              <p>{{ qrCode.message }}</p>
            </div>
            <!-- Erro ou formato desconhecido -->
            <div v-else class="qr-error">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Formato de resposta inesperado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { serviceInstanceService } from '@/services/service-instance.service'
import { ServiceProvider } from '@/types'
import type { ServiceInstance, QRCodeResponse } from '@/types'

const instances = ref<ServiceInstance[]>([])
const showModal = ref(false)
const showQRModal = ref(false)
const loadingQR = ref(false)
const qrCode = ref<QRCodeResponse | null>(null)
const editingInstance = ref<ServiceInstance | null>(null)

const form = ref({
  name: '',
  provider: ServiceProvider.EVOLUTION_API,
  credentials: {
    apiToken: '',
    serverUrl: '',
    instanceName: ''
  },
  isActive: true
})

const loadInstances = async () => {
  try {
    instances.value = await serviceInstanceService.getInstances()
  } catch (error) {
    console.error('Erro ao carregar instâncias:', error)
    alert('Erro ao carregar instâncias')
  }
}

const createInstance = async () => {
  try {
    // Validate form
    if (!form.value.name.trim()) {
      alert('Nome é obrigatório')
      return
    }
    if (!form.value.credentials.apiToken.trim()) {
      alert('API Token é obrigatório')
      return
    }
    if (!form.value.credentials.serverUrl.trim()) {
      alert('Server URL é obrigatória')
      return
    }
    if (!form.value.credentials.instanceName.trim()) {
      alert('Nome da Instância é obrigatório')
      return
    }

    // Normalize serverUrl (remove trailing slash if present)
    let serverUrl = form.value.credentials.serverUrl.trim()
    if (serverUrl.endsWith('/')) {
      serverUrl = serverUrl.slice(0, -1)
    }

    // Validate URL format
    try {
      new URL(serverUrl)
    } catch (e) {
      alert('Server URL inválida. Use o formato: https://seu-servidor.com')
      return
    }

    const payload = {
      name: form.value.name.trim(),
      provider: ServiceProvider.EVOLUTION_API,
      credentials: {
        apiToken: form.value.credentials.apiToken.trim(),
        serverUrl: serverUrl,
        instanceName: form.value.credentials.instanceName.trim()
      }
    }

    console.log('Criando instância com payload:', JSON.stringify(payload, null, 2))
    await serviceInstanceService.createInstance(payload)
    closeModal()
    await loadInstances()
  } catch (error: any) {
    console.error('Erro ao criar instância:', error)
    console.error('Response data:', error.response?.data)
    
    let errorMessage = 'Erro ao criar instância'
    
    if (error.response?.data) {
      const data = error.response.data
      
      // Handle nested message object (NestJS validation format)
      if (data.message && typeof data.message === 'object') {
        const messageObj = data.message
        const errors: string[] = []
        
        // Extract validation errors from message object
        if (Array.isArray(messageObj)) {
          errors.push(...messageObj.map((m: any) => typeof m === 'string' ? m : JSON.stringify(m)))
        } else {
          // Extract all error messages from object
          Object.keys(messageObj).forEach(key => {
            const value = messageObj[key]
            if (Array.isArray(value)) {
              value.forEach((v: any) => {
                if (typeof v === 'string') {
                  errors.push(`${key}: ${v}`)
                } else {
                  errors.push(`${key}: ${JSON.stringify(v)}`)
                }
              })
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`)
            } else {
              errors.push(`${key}: ${JSON.stringify(value)}`)
            }
          })
        }
        
        if (errors.length > 0) {
          errorMessage = errors.join('\n')
        } else {
          errorMessage = JSON.stringify(messageObj, null, 2)
        }
      } else if (data.message && typeof data.message === 'string') {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      } else if (typeof data === 'string') {
        errorMessage = data
      } else {
        // Try to extract validation errors
        const errors = Object.values(data).flat()
        if (errors.length > 0) {
          errorMessage = errors.join(', ')
        } else {
          errorMessage = JSON.stringify(data, null, 2)
        }
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(`Erro ao criar instância:\n\n${errorMessage}`)
  }
}

const showQRCode = async (id: string) => {
  showQRModal.value = true
  loadingQR.value = true
  qrCode.value = null
  try {
    qrCode.value = await serviceInstanceService.getQRCode(id)
  } catch (error: any) {
    console.error('Erro ao carregar QR Code:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao carregar QR Code'
    alert(`Erro ao carregar QR Code:\n\n${errorMessage}`)
    showQRModal.value = false
  } finally {
    loadingQR.value = false
  }
}

const editInstance = (instance: ServiceInstance) => {
  editingInstance.value = instance
  form.value = {
    name: instance.name,
    provider: instance.provider,
    credentials: {
      apiToken: instance.credentials.apiToken,
      serverUrl: instance.credentials.serverUrl,
      instanceName: instance.credentials.instanceName
    },
    isActive: instance.isActive
  }
  showModal.value = true
}

const updateInstance = async () => {
  if (!editingInstance.value) return

  try {
    if (!form.value.name.trim()) {
      alert('Nome é obrigatório')
      return
    }

    const payload: any = {
      name: form.value.name.trim()
    }

    // Se estiver editando, pode atualizar apenas nome e isActive
    if (editingInstance.value) {
      payload.isActive = form.value.isActive
    }

    await serviceInstanceService.updateInstance(editingInstance.value.id, payload)
    closeModal()
    await loadInstances()
  } catch (error: any) {
    console.error('Erro ao atualizar instância:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao atualizar instância'
    alert(`Erro ao atualizar instância:\n\n${errorMessage}`)
  }
}

const toggleActive = async (instance: ServiceInstance) => {
  try {
    await serviceInstanceService.updateInstance(instance.id, {
      isActive: !instance.isActive
    })
    await loadInstances()
  } catch (error: any) {
    console.error('Erro ao alterar status:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao alterar status'
    alert(`Erro ao alterar status:\n\n${errorMessage}`)
  }
}

const closeModal = () => {
  showModal.value = false
  editingInstance.value = null
  form.value = {
    name: '',
    provider: ServiceProvider.EVOLUTION_API,
    credentials: { apiToken: '', serverUrl: '', instanceName: '' },
    isActive: true
  }
}

const deleteInstance = async (id: string) => {
  if (!confirm('Tem certeza que deseja deletar esta instância?\n\n⚠️ A instância só pode ser removida se não tiver conversas ou campanhas associadas.')) {
    return
  }

  try {
    await serviceInstanceService.deleteInstance(id)
    await loadInstances()
  } catch (error: any) {
    console.error('Erro ao deletar instância:', error)
    console.error('Response data:', error.response?.data)
    
    let errorMessage = 'Erro ao deletar instância'
    
    if (error.response?.data) {
      const data = error.response.data
      
      // Handle nested message object (NestJS validation format)
      if (data.message && typeof data.message === 'object') {
        const messageObj = data.message
        const errors: string[] = []
        
        // Extract validation errors from message object
        if (Array.isArray(messageObj)) {
          errors.push(...messageObj.map((m: any) => typeof m === 'string' ? m : JSON.stringify(m)))
        } else {
          // Extract all error messages from object
          Object.keys(messageObj).forEach(key => {
            const value = messageObj[key]
            if (Array.isArray(value)) {
              value.forEach((v: any) => {
                if (typeof v === 'string') {
                  errors.push(v)
                } else {
                  errors.push(`${key}: ${JSON.stringify(v)}`)
                }
              })
            } else if (typeof value === 'string') {
              errors.push(value)
            } else {
              errors.push(`${key}: ${JSON.stringify(value)}`)
            }
          })
        }
        
        if (errors.length > 0) {
          errorMessage = errors.join('\n')
        } else {
          errorMessage = JSON.stringify(messageObj, null, 2)
        }
      } else if (data.message && typeof data.message === 'string') {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      } else if (typeof data === 'string') {
        errorMessage = data
      } else {
        // Try to extract validation errors
        const errors = Object.values(data).flat()
        if (errors.length > 0) {
          errorMessage = errors.join(', ')
        } else {
          errorMessage = JSON.stringify(data, null, 2)
        }
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(`Erro ao deletar instância:\n\n${errorMessage}\n\n⚠️ A instância só pode ser removida se não tiver conversas ou campanhas associadas.`)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadInstances()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.instances-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  @include flex-between;
  margin-bottom: $spacing-xl;

  h2 {
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.instances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.instance-card {
  padding: $spacing-lg;

  .instance-header {
    @include flex-between;
    margin-bottom: $spacing-md;

    h3 {
      color: $text-primary-light;

      .dark & {
        color: $text-primary-dark;
      }
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-full;
      font-size: 0.75rem;
      font-weight: 500;

      &.active {
        background: rgba($success, 0.1);
        color: $success;
      }

      &.inactive {
        background: rgba($error, 0.1);
        color: $error;
      }
    }
  }

  .instance-info {
    margin-bottom: $spacing-lg;

    p {
      font-size: 0.875rem;
      margin-bottom: $spacing-xs;
      color: $text-secondary-light;

      .dark & {
        color: $text-secondary-dark;
      }

      strong {
        color: $text-primary-light;

        .dark & {
          color: $text-primary-dark;
        }
      }
    }
  }

  .instance-actions {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    flex-wrap: wrap;

    button {
      padding: $spacing-sm $spacing-md;
      font-size: 0.875rem;
    }

    .btn-toggle {
      background: rgba($secondary-light, 0.1);
      color: $secondary-light;
      border: 1px solid rgba($secondary-light, 0.3);

      &.active {
        background: rgba($success, 0.1);
        color: $success;
        border-color: rgba($success, 0.3);
      }

      &:hover {
        background: rgba($secondary-light, 0.2);
      }

      &.active:hover {
        background: rgba($success, 0.2);
      }
    }

    .btn-danger {
      background: rgba($error, 0.1);
      color: $error;
      border: 1px solid rgba($error, 0.3);

      &:hover {
        background: rgba($error, 0.2);
      }
    }
  }
}

.qr-modal-body {
  @include flex-center;
  min-height: 300px;

  .qr-container {
    text-align: center;
    width: 100%;

    .qr-image {
      img {
        max-width: 300px;
        width: 100%;
        border-radius: $radius-md;
      }

      .qr-hint {
        margin-top: $spacing-md;
        color: $text-secondary-light;
        font-size: 0.875rem;

        .dark & {
          color: $text-secondary-dark;
        }
      }
    }

    .qr-pairing {
      h4 {
        color: $text-primary-light;
        margin-bottom: $spacing-md;

        .dark & {
          color: $text-primary-dark;
        }
      }

      .pairing-code {
        font-size: 2rem;
        font-weight: bold;
        font-family: $font-family-mono;
        color: $primary-light;
        background: rgba($primary-light, 0.1);
        padding: $spacing-lg;
        border-radius: $radius-md;
        margin: $spacing-md 0;
        letter-spacing: 0.5rem;
      }

      .qr-hint {
        color: $text-secondary-light;
        font-size: 0.875rem;

        .dark & {
          color: $text-secondary-dark;
        }
      }
    }

    .qr-connected {
      i {
        font-size: 4rem;
        color: $success;
        margin-bottom: $spacing-md;
      }

      p {
        font-size: 1.125rem;
        color: $success;
        font-weight: 500;
      }
    }

    .qr-error {
      i {
        font-size: 3rem;
        color: $warning;
        margin-bottom: $spacing-md;
      }

      p {
        font-size: 1rem;
        color: $warning;
      }
    }
  }
}

.icon-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $primary-light;
  }
}

.checkbox-group {
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    span {
      color: $text-primary-light;
      user-select: none;

      .dark & {
        color: $text-primary-dark;
      }
    }
  }
}
</style>

