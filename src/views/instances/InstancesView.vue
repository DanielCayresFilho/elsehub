<template>
  <div class="instances-view">
    <div class="page-header">
      <h2>Instâncias de Atendimento</h2>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nova Instância
      </button>
    </div>

    <div class="toolbar card">
      <div class="filters-grid">
        <div class="form-group inline">
          <label>Buscar</label>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Nome ou telefone"
          />
        </div>

        <div class="form-group inline">
          <label>Provider</label>
          <select v-model="providerFilter">
            <option value="ALL">Todos</option>
            <option v-for="option in providerOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <label class="checkbox-label inline">
          <input type="checkbox" v-model="includeInactive" />
          <span>Mostrar inativas</span>
        </label>

        <button class="btn-secondary refresh-btn" @click="fetchInstances" :disabled="loadingList">
          <i class="fas fa-rotate-right"></i>
          Atualizar
        </button>
      </div>
    </div>

    <div v-if="loadingList" class="loading-state card">
      <div class="loading"></div>
      <p>Carregando instâncias...</p>
    </div>

    <div v-else-if="filteredInstances.length === 0" class="empty-state card">
      <i class="fas fa-server"></i>
      <h3>Nenhuma instância encontrada</h3>
      <p>Ajuste os filtros ou crie uma nova instância.</p>
      <button class="btn-primary" @click="openCreateModal">
        Criar instância
      </button>
    </div>

    <div v-else class="instances-grid">
      <div v-for="instance in filteredInstances" :key="instance.id" class="instance-card card">
        <div class="instance-header">
          <div>
            <h3>{{ instance.name }}</h3>
            <small>{{ instance.phone || 'Telefone não informado' }}</small>
          </div>
          <div class="badges">
            <span class="provider-badge">
              {{ providerLabel(instance.provider) }}
            </span>
            <span class="status-badge" :class="{ active: instance.isActive, inactive: !instance.isActive }">
              {{ instance.isActive ? 'Ativa' : 'Inativa' }}
            </span>
          </div>
        </div>

        <div class="instance-info">
          <p><strong>Atualizada em:</strong> {{ formatDate(instance.updatedAt) }}</p>
          <p><strong>Criada em:</strong> {{ formatDate(instance.createdAt) }}</p>

          <template v-if="isEvolution(instance)">
            <p><strong>Instância:</strong> {{ getEvolutionInstanceName(instance) }}</p>
            <p><strong>Servidor:</strong> {{ getEvolutionServerUrl(instance) }}</p>
          </template>
          <template v-else>
            <p><strong>WABA ID:</strong> {{ getMetaWabaId(instance) }}</p>
            <p><strong>Phone ID:</strong> {{ getMetaPhoneId(instance) }}</p>
          </template>
        </div>

        <div class="instance-actions">
          <button
            class="btn-secondary btn-sm"
            @click="openEditModal(instance)"
            title="Editar instância"
          >
            <i class="fas fa-edit"></i>
            Editar
          </button>

          <button
            v-if="isEvolution(instance)"
            class="btn-secondary btn-sm"
            @click="openQrModal(instance)"
            title="Ver QR Code"
          >
            <i class="fas fa-qrcode"></i>
            QR Code
          </button>

          <button
            class="btn-secondary btn-sm"
            :class="{ 'btn-disabled': savingToggleId === instance.id }"
            @click="toggleActiveStatus(instance)"
            :disabled="savingToggleId === instance.id"
          >
            <i :class="instance.isActive ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
            {{ instance.isActive ? 'Desativar' : 'Ativar' }}
          </button>

          <button
            class="btn-danger btn-sm"
            @click="handleDeleteInstance(instance)"
          >
            <i class="fas fa-trash"></i>
            Remover
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingInstance ? 'Editar Instância' : 'Nova Instância' }}</h3>
          <button @click="closeModal" class="icon-btn" title="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent>
            <div v-if="formErrors.length" class="error-list">
              <p v-for="error in formErrors" :key="error">{{ error }}</p>
            </div>

            <div class="form-group">
              <label>Nome</label>
              <input type="text" v-model="form.name" required />
            </div>

            <div class="form-group">
              <label>Telefone (E.164)</label>
              <input type="tel" v-model="form.phone" placeholder="+5511999999999" required />
            </div>

            <div class="form-group">
              <label>Provider</label>
              <select v-model="form.provider">
                <option v-for="option in providerOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="form-divider">Credenciais</div>
            <div v-for="field in credentialFields" :key="field.key" class="form-group">
              <label>{{ field.label }}</label>
              <input
                :type="field.type || 'text'"
                v-model="form.credentials[field.key]"
                :placeholder="field.placeholder"
                required
              />
            </div>

            <div v-if="editingInstance" class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isActive" />
                <span>Instância ativa</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button class="btn-primary" @click="submitForm" :disabled="saving">
            <span v-if="!saving">{{ editingInstance ? 'Salvar alterações' : 'Criar instância' }}</span>
            <span v-else>Salvando...</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showQRModal" class="modal-overlay" @click="closeQrModal">
      <div class="modal qr-modal" @click.stop>
        <div class="modal-header">
          <h3>QR Code - {{ qrModalInstance?.name }}</h3>
          <button @click="closeQrModal" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body qr-modal-body">
          <div v-if="qrLoading" class="loading"></div>

          <div v-else-if="qrError" class="qr-error-block">
            <p>{{ qrError }}</p>
            <button class="btn-secondary btn-sm" @click="retryQrCode">
              Tentar novamente
            </button>
          </div>

          <div v-else-if="qrCode" class="qr-container">
            <div v-if="qrCode.base64" class="qr-image">
              <img :src="qrCode.base64" alt="QR Code" />
              <p class="qr-hint">Escaneie no WhatsApp → Dispositivos conectados</p>
            </div>
            <div v-else-if="qrCode.pairingCode" class="qr-pairing">
              <h4>Código de pareamento</h4>
              <div class="pairing-code">{{ qrCode.pairingCode }}</div>
              <p class="qr-hint">Digite no aplicativo Evolution</p>
            </div>
            <div v-else-if="qrCode.message" class="qr-connected">
              <i class="fas fa-check-circle"></i>
              <p>{{ qrCode.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ServiceProvider, type EvolutionInstanceCredentials, type OfficialMetaInstanceCredentials } from '@/types'
import type { ServiceInstance, QRCodeResponse, ServiceInstanceCredentials } from '@/types'
import { serviceInstanceService } from '@/services/service-instance.service'

type ProviderFilter = 'ALL' | ServiceProvider
type CredentialField = {
  key: string
  label: string
  type?: string
  placeholder?: string
}

const providerOptions = [
  { value: ServiceProvider.EVOLUTION_API, label: 'Evolution API' },
  { value: ServiceProvider.OFFICIAL_META, label: 'Meta Oficial' }
]

const credentialFieldMap: Record<ServiceProvider, CredentialField[]> = {
  [ServiceProvider.EVOLUTION_API]: [
    { key: 'instanceName', label: 'Nome da Instância', placeholder: 'financeiro-01' },
    { key: 'apiToken', label: 'API Token', placeholder: 'xrgr4qjcxhZ...' },
    { key: 'serverUrl', label: 'Server URL', placeholder: 'https://evolution.suaempresa.com', type: 'url' }
  ],
  [ServiceProvider.OFFICIAL_META]: [
    { key: 'wabaId', label: 'WABA ID', placeholder: '123456789' },
    { key: 'phoneId', label: 'Phone ID', placeholder: '987654321' },
    { key: 'accessToken', label: 'Access Token', placeholder: 'EAA...' }
  ]
}

const defaultCredentials = (provider: ServiceProvider): Record<string, string> => {
  if (provider === ServiceProvider.EVOLUTION_API) {
    return {
      instanceName: '',
      apiToken: '',
      serverUrl: ''
    }
  }
  return {
    wabaId: '',
    phoneId: '',
    accessToken: ''
  }
}

const isEvolution = (instanceOrProvider: ServiceInstance | ServiceProvider): boolean => {
  const provider = typeof instanceOrProvider === 'string' ? instanceOrProvider : instanceOrProvider.provider
  return provider === ServiceProvider.EVOLUTION_API
}

const providerLabel = (provider: ServiceProvider) => {
  return providerOptions.find(option => option.value === provider)?.label ?? provider
}

const getEvolutionInstanceName = (instance: ServiceInstance): string => {
  if (isEvolution(instance)) {
    const creds = instance.credentials as EvolutionInstanceCredentials
    return creds.instanceName || ''
  }
  return ''
}

const getEvolutionServerUrl = (instance: ServiceInstance): string => {
  if (isEvolution(instance)) {
    const creds = instance.credentials as EvolutionInstanceCredentials
    return creds.serverUrl || ''
  }
  return ''
}

const getMetaWabaId = (instance: ServiceInstance): string => {
  if (!isEvolution(instance)) {
    const creds = instance.credentials as OfficialMetaInstanceCredentials
    return creds.wabaId || ''
  }
  return ''
}

const getMetaPhoneId = (instance: ServiceInstance): string => {
  if (!isEvolution(instance)) {
    const creds = instance.credentials as OfficialMetaInstanceCredentials
    return creds.phoneId || ''
  }
  return ''
}

const instances = ref<ServiceInstance[]>([])
const loadingList = ref(false)
const includeInactive = ref(false)
const providerFilter = ref<ProviderFilter>('ALL')
const searchQuery = ref('')

const showModal = ref(false)
const editingInstance = ref<ServiceInstance | null>(null)
const formErrors = ref<string[]>([])
const saving = ref(false)
const savingToggleId = ref<string | null>(null)

const suspendCredentialReset = ref(false)
const form = ref({
  name: '',
  phone: '+55',
  provider: ServiceProvider.EVOLUTION_API,
  credentials: defaultCredentials(ServiceProvider.EVOLUTION_API),
  isActive: true
})

const credentialFields = computed(() => credentialFieldMap[form.value.provider])

watch(
  () => form.value.provider,
  (provider) => {
    if (suspendCredentialReset.value) {
      suspendCredentialReset.value = false
      return
    }
    form.value.credentials = defaultCredentials(provider)
  }
)

const filteredInstances = computed(() => {
  return instances.value.filter(instance => {
    if (!includeInactive.value && !instance.isActive) return false
    if (providerFilter.value !== 'ALL' && instance.provider !== providerFilter.value) return false
    if (searchQuery.value.trim()) {
      const term = searchQuery.value.trim().toLowerCase()
      const haystack = `${instance.name} ${instance.phone ?? ''}`.toLowerCase()
      return haystack.includes(term)
    }
    return true
  })
})

const fetchInstances = async () => {
  loadingList.value = true
  try {
    instances.value = await serviceInstanceService.getInstances({ includeInactive: includeInactive.value })
  } catch (error: any) {
    alert(error.response?.data?.message || 'Erro ao carregar instâncias')
  } finally {
    loadingList.value = false
  }
}

watch(includeInactive, () => {
  fetchInstances()
})

const resetForm = () => {
  editingInstance.value = null
  formErrors.value = []
  suspendCredentialReset.value = true
  form.value = {
    name: '',
    phone: '+55',
    provider: ServiceProvider.EVOLUTION_API,
    credentials: defaultCredentials(ServiceProvider.EVOLUTION_API),
    isActive: true
  }
}

const openCreateModal = () => {
  resetForm()
  showModal.value = true
}

const extractCredentials = (instance: ServiceInstance): Record<string, string> => {
  const credentials = instance.credentials as ServiceInstanceCredentials
  if (isEvolution(instance)) {
    const evo = credentials as EvolutionInstanceCredentials
    return {
      instanceName: evo.instanceName ?? '',
      apiToken: evo.apiToken ?? '',
      serverUrl: evo.serverUrl ?? ''
    }
  }
  const meta = credentials as OfficialMetaInstanceCredentials
  return {
    wabaId: meta.wabaId ?? '',
    phoneId: meta.phoneId ?? '',
    accessToken: meta.accessToken ?? ''
  }
}

const openEditModal = (instance: ServiceInstance) => {
  editingInstance.value = instance
  formErrors.value = []
  suspendCredentialReset.value = true
  form.value = {
    name: instance.name,
    phone: instance.phone ?? '',
    provider: instance.provider,
    credentials: extractCredentials(instance),
    isActive: instance.isActive
  }
  showModal.value = true
}

const validateForm = (): string[] => {
  const errors: string[] = []
  if (!form.value.name.trim()) {
    errors.push('Informe o nome da instância.')
  }
  const phone = form.value.phone.trim()
  if (!phone) {
    errors.push('Informe o telefone no formato E.164.')
  } else if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
    errors.push('Telefone inválido. Use o formato +5511999999999.')
  }

  credentialFields.value.forEach(field => {
    const value = (form.value.credentials[field.key] || '').trim()
    if (!value) {
      errors.push(`Informe ${field.label}.`)
    }
    if (field.key === 'serverUrl' && value && !value.startsWith('https://')) {
      errors.push('Server URL deve começar com https://')
    }
  })

  return errors
}

const buildPayload = () => {
  const credentials = { ...form.value.credentials }
  if (form.value.provider === ServiceProvider.EVOLUTION_API && credentials.serverUrl) {
    credentials.serverUrl = credentials.serverUrl.replace(/\/+$/, '')
  }

  return {
    name: form.value.name.trim(),
    phone: form.value.phone.trim(),
    provider: form.value.provider,
    credentials
  }
}

const submitForm = async () => {
  formErrors.value = validateForm()
  if (formErrors.value.length > 0) {
    return
  }

  const payload = buildPayload()
  saving.value = true

  try {
    if (editingInstance.value) {
      await serviceInstanceService.updateInstance(editingInstance.value.id, {
        ...payload,
        isActive: form.value.isActive
      })
    } else {
      await serviceInstanceService.createInstance(payload)
    }
    await fetchInstances()
    closeModal()
  } catch (error: any) {
    const apiMessage = error.response?.data?.message
    formErrors.value = [
      Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage || 'Erro ao salvar instância'
    ]
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const toggleActiveStatus = async (instance: ServiceInstance) => {
  savingToggleId.value = instance.id
  try {
    await serviceInstanceService.updateInstance(instance.id, {
      isActive: !instance.isActive
    })
    await fetchInstances()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Erro ao atualizar status da instância')
  } finally {
    savingToggleId.value = null
  }
}

const handleDeleteInstance = async (instance: ServiceInstance) => {
  const confirmed = confirm('Tem certeza que deseja desativar esta instância?')
  if (!confirmed) return
  try {
    await serviceInstanceService.deleteInstance(instance.id)
    await fetchInstances()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Erro ao remover instância')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showQRModal = ref(false)
const qrModalInstance = ref<ServiceInstance | null>(null)
const qrLoading = ref(false)
const qrError = ref('')
const qrCode = ref<QRCodeResponse | null>(null)
let qrInterval: ReturnType<typeof setInterval> | null = null

const fetchQrCode = async (instanceId: string, silent = false) => {
  if (!silent) {
    qrLoading.value = true
    qrError.value = ''
  }
  try {
    const response = await serviceInstanceService.getQRCode(instanceId)
    qrCode.value = response
    if (response.message && response.message.toLowerCase().includes('conectada')) {
      stopQrPolling()
    }
  } catch (error: any) {
    qrError.value = error.response?.data?.message || 'Não foi possível recuperar o QR Code.'
  } finally {
    qrLoading.value = false
  }
}

const startQrPolling = (instanceId: string) => {
  stopQrPolling()
  qrInterval = setInterval(() => {
    fetchQrCode(instanceId, true)
  }, 7000)
}

const stopQrPolling = () => {
  if (qrInterval) {
    clearInterval(qrInterval)
    qrInterval = null
  }
}

const openQrModal = (instance: ServiceInstance) => {
  qrModalInstance.value = instance
  showQRModal.value = true
  fetchQrCode(instance.id)
  startQrPolling(instance.id)
}

const closeQrModal = () => {
  showQRModal.value = false
  qrModalInstance.value = null
  qrCode.value = null
  qrError.value = ''
  stopQrPolling()
}

const retryQrCode = () => {
  if (!qrModalInstance.value) return
  fetchQrCode(qrModalInstance.value.id)
}

onUnmounted(() => {
  stopQrPolling()
})

onMounted(() => {
  fetchInstances()
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

.toolbar {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
}

.filters-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  align-items: flex-end;

  .form-group.inline {
    flex: 1;

    input,
    select {
      width: 100%;
    }
  }

  .checkbox-label.inline {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.loading-state {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-xl;
  margin-bottom: $spacing-xl;
}

.instances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.instance-card {
  padding: $spacing-lg;

  .instance-header {
    @include flex-between;
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    h3 {
      margin-bottom: $spacing-xs;
    }

    small {
      color: $text-secondary-light;

      .dark & {
        color: $text-secondary-dark;
      }
    }

    .badges {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      align-items: flex-end;
    }

    .provider-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-full;
      background: rgba($primary-light, 0.1);
      color: $primary-light;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-full;
      font-size: 0.75rem;
      font-weight: 600;

      &.active {
        background: rgba($success, 0.12);
        color: $success;
      }

      &.inactive {
        background: rgba($error, 0.12);
        color: $error;
      }
    }
  }

  .instance-info {
    margin-bottom: $spacing-lg;

    p {
      font-size: 0.875rem;
      margin-bottom: $spacing-xs;

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
    flex-wrap: wrap;
    gap: $spacing-sm;

    button {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }
}

.btn-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-2xl;
  text-align: center;
  margin-bottom: $spacing-xl;

  i {
    font-size: 3rem;
    color: $text-secondary-light;
  }
}

.modal-body .error-list {
  background: rgba($error, 0.08);
  border: 1px solid rgba($error, 0.3);
  color: $error;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;

  p + p {
    margin-top: $spacing-xs;
  }
}

.form-divider {
  font-weight: 600;
  margin: $spacing-lg 0 $spacing-sm;
}

.qr-modal-body {
  min-height: 320px;
  @include flex-center;

  .qr-container {
    text-align: center;
    width: 100%;
  }

  .qr-image img {
    max-width: 320px;
    width: 100%;
    border-radius: $radius-md;
  }

  .qr-hint {
    margin-top: $spacing-md;
    font-size: 0.85rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  .pairing-code {
    font-size: 2rem;
    font-family: $font-family-mono;
    background: rgba($primary-light, 0.1);
    color: $primary-light;
    padding: $spacing-md;
    border-radius: $radius-md;
    margin: $spacing-md 0;
    letter-spacing: 0.5rem;
  }

  .qr-connected {
    color: $success;

    i {
      font-size: 3rem;
      margin-bottom: $spacing-md;
    }
  }
}

.qr-error-block {
  text-align: center;

  p {
    margin-bottom: $spacing-md;
    color: $error;
  }
}

.icon-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;

  &:hover {
    color: $primary-light;
  }
}

.checkbox-group .checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
}
</style>

