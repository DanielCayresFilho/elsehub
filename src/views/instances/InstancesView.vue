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
        </div>
        <button @click="showQRCode(instance.id)" class="btn-secondary">
          <i class="fas fa-qrcode"></i>
          Ver QR Code
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Nova Instância</h3>
          <button @click="showModal = false" class="icon-btn" title="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form>
            <div class="form-group">
              <label>Nome</label>
              <input type="text" v-model="form.name" required />
            </div>
            <div class="form-group">
              <label>API Key</label>
              <input type="text" v-model="form.credentials.apiKey" required />
            </div>
            <div class="form-group">
              <label>Base URL</label>
              <input type="url" v-model="form.credentials.baseUrl" required />
            </div>
            <div class="form-group">
              <label>Nome da Instância</label>
              <input type="text" v-model="form.credentials.instanceName" required />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-secondary">Cancelar</button>
          <button @click="createInstance" class="btn-primary">Criar</button>
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
            <img v-if="qrCode.qrcode.code" :src="qrCode.qrcode.code" alt="QR Code" />
            <div v-else>
              <p>Instância já conectada!</p>
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

const form = ref({
  name: '',
  provider: ServiceProvider.EVOLUTION_API,
  credentials: {
    apiKey: '',
    baseUrl: '',
    instanceName: ''
  }
})

const loadInstances = async () => {
  try {
    const response = await serviceInstanceService.getInstances()
    instances.value = response.data
  } catch (error) {
    console.error('Erro ao carregar instâncias:', error)
  }
}

const createInstance = async () => {
  try {
    // Validate form
    if (!form.value.name.trim()) {
      alert('Nome é obrigatório')
      return
    }
    if (!form.value.credentials.apiKey.trim()) {
      alert('API Key é obrigatória')
      return
    }
    if (!form.value.credentials.baseUrl.trim()) {
      alert('Base URL é obrigatória')
      return
    }
    if (!form.value.credentials.instanceName.trim()) {
      alert('Nome da Instância é obrigatório')
      return
    }

    // Normalize baseUrl (remove trailing slash if present)
    let baseUrl = form.value.credentials.baseUrl.trim()
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    // Validate URL format
    try {
      new URL(baseUrl)
    } catch (e) {
      alert('Base URL inválida. Use o formato: https://seu-servidor.com')
      return
    }

    const payload = {
      name: form.value.name.trim(),
      provider: ServiceProvider.EVOLUTION_API,
      credentials: {
        apiKey: form.value.credentials.apiKey.trim(),
        baseUrl: baseUrl,
        instanceName: form.value.credentials.instanceName.trim()
      }
    }

    console.log('Criando instância com payload:', JSON.stringify(payload, null, 2))
    await serviceInstanceService.createInstance(payload)
    showModal.value = false
    form.value = {
      name: '',
      provider: ServiceProvider.EVOLUTION_API,
      credentials: { apiKey: '', baseUrl: '', instanceName: '' }
    }
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
  try {
    qrCode.value = await serviceInstanceService.getQRCode(id)
  } catch (error) {
    alert('Erro ao carregar QR Code')
  } finally {
    loadingQR.value = false
  }
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
}

.qr-modal-body {
  @include flex-center;
  min-height: 300px;

  .qr-container {
    text-align: center;

    img {
      max-width: 300px;
      width: 100%;
    }

    p {
      font-size: 1.125rem;
      color: $success;
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
</style>

