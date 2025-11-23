<template>
  <div class="home-view">
    <div class="home-container">
      <!-- Header -->
      <div class="home-header">
        <h1>Enviar Mensagem</h1>
        <p>Envie mensagens diretas para seus contatos</p>
      </div>

      <!-- Form Section -->
      <div class="card">
        <div class="form-section">
          <!-- Service Instance Selection -->
          <div class="form-group">
            <label>
              <i class="fas fa-microchip"></i>
              Instância de Serviço
            </label>
            <select v-model="selectedInstanceId" @change="onInstanceChange" :disabled="loading">
              <option value="">Selecione uma instância...</option>
              <option 
                v-for="instance in instances" 
                :key="instance.id" 
                :value="instance.id"
              >
                {{ instance.name }} ({{ instance.provider }})
              </option>
            </select>
            <p v-if="!selectedInstanceId" class="form-hint">
              Selecione uma instância para começar
            </p>
          </div>

          <!-- Contact Selection/Creation -->
          <div class="form-group">
            <label>
              <i class="fas fa-user"></i>
              Contato
            </label>
            <div class="contact-selector">
              <select 
                v-model="selectedContactId" 
                @change="onContactChange"
                :disabled="!selectedInstanceId || loading"
              >
                <option value="">Selecione ou crie um contato...</option>
                <option 
                  v-for="contact in contacts" 
                  :key="contact.id" 
                  :value="contact.id"
                >
                  {{ contact.name }} - {{ formatPhone(contact.phone) }}
                </option>
              </select>
              <button 
                @click="showCreateContact = true" 
                class="btn-secondary btn-sm"
                :disabled="!selectedInstanceId || loading"
              >
                <i class="fas fa-plus"></i>
                Novo
              </button>
            </div>
          </div>

          <!-- Message Input -->
          <div class="form-group">
            <label>
              <i class="fas fa-message"></i>
              Mensagem
            </label>
            <textarea 
              v-model="messageContent"
              placeholder="Digite sua mensagem aqui..."
              rows="4"
              :disabled="!selectedContactId || !selectedInstanceId || loading"
            ></textarea>
            <p class="form-hint">
              {{ messageContent.length }} / 4096 caracteres
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button 
              @click="sendDirectMessage" 
              class="btn-primary"
              :disabled="!canSend || loading"
            >
              <i class="fas fa-paper-plane"></i>
              {{ loading ? 'Enviando...' : 'Enviar Mensagem' }}
            </button>
            <button 
              @click="clearForm" 
              class="btn-secondary"
              :disabled="loading"
            >
              <i class="fas fa-eraser"></i>
              Limpar
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Messages -->
      <div v-if="recentConversations.length > 0" class="card">
        <div class="card-header">
          <h3>Conversas Recentes</h3>
        </div>
        <div class="recent-list">
          <div 
            v-for="conv in recentConversations" 
            :key="conv.id"
            class="recent-item"
            @click="loadConversation(conv)"
          >
            <div class="recent-avatar">
              {{ getInitials(conv.contact?.name || 'Desconhecido') }}
            </div>
            <div class="recent-info">
              <h4>{{ conv.contact?.name || 'Desconhecido' }}</h4>
              <p>{{ formatPhone(conv.contact?.phone || '') }}</p>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Contact Modal -->
    <div v-if="showCreateContact" class="modal-overlay" @click="showCreateContact = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Criar Novo Contato</h3>
          <button @click="showCreateContact = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="newContact.name" type="text" placeholder="Nome do contato" />
          </div>
          <div class="form-group">
            <label>Telefone (E.164)</label>
            <input 
              v-model="newContact.phone" 
              type="text" 
              placeholder="5511999999999" 
            />
            <p class="form-hint">Formato: código do país + DDD + número (sem espaços ou caracteres especiais)</p>
          </div>
          <div class="form-group">
            <label>CPF (Opcional)</label>
            <input v-model="newContact.cpf" type="text" placeholder="12345678900" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateContact = false" class="btn-secondary">Cancelar</button>
          <button @click="createContact" class="btn-primary" :disabled="!canCreateContact || creatingContact">
            {{ creatingContact ? 'Criando...' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { serviceInstanceService } from '@/services/service-instance.service'
import { contactService } from '@/services/contact.service'
import { conversationService } from '@/services/conversation.service'
import { wsService } from '@/services/websocket.service'
import type { ServiceInstance, Contact, Conversation } from '@/types'

const router = useRouter()

const loading = ref(false)
const selectedInstanceId = ref('')
const selectedContactId = ref('')
const messageContent = ref('')
const showCreateContact = ref(false)
const creatingContact = ref(false)

const instances = ref<ServiceInstance[]>([])
const contacts = ref<Contact[]>([])
const recentConversations = ref<Conversation[]>([])

const newContact = ref({
  name: '',
  phone: '',
  cpf: ''
})

const canSend = computed(() => {
  return !!selectedInstanceId.value && 
         !!selectedContactId.value && 
         messageContent.value.trim().length > 0 &&
         messageContent.value.length <= 4096
})

const canCreateContact = computed(() => {
  return newContact.value.name.trim().length > 0 && 
         newContact.value.phone.trim().length > 0
})

const loadInstances = async () => {
  try {
    const response = await serviceInstanceService.getInstances(1, 100)
    instances.value = response.data.filter(i => i.isActive)
  } catch (error) {
    console.error('Erro ao carregar instâncias:', error)
  }
}

const loadContacts = async () => {
  if (!selectedInstanceId.value) return
  
  try {
    const response = await contactService.getContacts(1, 100)
    contacts.value = response.data
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
  }
}

const loadRecentConversations = async () => {
  try {
    const response = await conversationService.getConversations(1, 5)
    recentConversations.value = response.data
  } catch (error) {
    console.error('Erro ao carregar conversas recentes:', error)
  }
}

const onInstanceChange = () => {
  selectedContactId.value = ''
  messageContent.value = ''
  loadContacts()
}

const onContactChange = () => {
  messageContent.value = ''
}

const createContact = async () => {
  if (!canCreateContact.value) return
  
  creatingContact.value = true
  try {
    const contact = await contactService.createContact({
      name: newContact.value.name.trim(),
      phone: newContact.value.phone.trim().replace(/\D/g, ''),
      cpf: newContact.value.cpf?.trim() || undefined
    })
    
    contacts.value.push(contact)
    selectedContactId.value = contact.id
    showCreateContact.value = false
    newContact.value = { name: '', phone: '', cpf: '' }
  } catch (error: any) {
    console.error('Erro ao criar contato:', error)
    alert(error.response?.data?.message || 'Erro ao criar contato')
  } finally {
    creatingContact.value = false
  }
}

const sendDirectMessage = async () => {
  if (!canSend.value) return
  
  loading.value = true
  try {
    // Ensure WebSocket is connected
    if (!wsService.isConnected()) {
      wsService.connect()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Find or create conversation
    let conversation: Conversation | null = null
    
    // Check if conversation already exists
    const existingConvs = recentConversations.value.filter(
      c => c.contact?.id === selectedContactId.value && 
           c.serviceInstance?.id === selectedInstanceId.value
    )
    
    if (existingConvs.length > 0) {
      conversation = existingConvs[0]
    } else {
      // Create new conversation
      conversation = await conversationService.createConversation({
        contactId: selectedContactId.value,
        serviceInstanceId: selectedInstanceId.value
      })
      recentConversations.value.unshift(conversation)
    }

    // Join room and send message
    wsService.joinRoom(conversation.id)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    wsService.sendMessage(conversation.id, messageContent.value.trim())
    
    // Clear message
    messageContent.value = ''
    
    // Show success
    alert('Mensagem enviada com sucesso!')
    
    // Optionally redirect to conversations
    setTimeout(() => {
      router.push(`/conversas?id=${conversation.id}`)
    }, 1000)
    
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error)
    alert(error.response?.data?.message || 'Erro ao enviar mensagem')
  } finally {
    loading.value = false
  }
}

const loadConversation = (conversation: Conversation) => {
  router.push(`/conversas?id=${conversation.id}`)
}

const clearForm = () => {
  selectedContactId.value = ''
  messageContent.value = ''
}

const formatPhone = (phone: string) => {
  if (!phone) return ''
  // Format: +55 (11) 99999-9999
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

const getInitials = (name: string) => {
  const names = name.split(' ')
  return names.length > 1 
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}

onMounted(async () => {
  await loadInstances()
  await loadRecentConversations()
  wsService.connect()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-xl;
}

.home-header {
  text-align: center;
  margin-bottom: $spacing-2xl;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: $text-primary-light;
    margin-bottom: $spacing-sm;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    font-size: 1rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.form-section {
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  label {
    font-weight: 600;
    color: $text-primary-light;
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .dark & {
      color: $text-primary-dark;
    }

    i {
      color: $primary-light;
    }
  }

  select,
  input,
  textarea {
    padding: $spacing-md;
    border: 1px solid $border-light;
    border-radius: $radius-md;
    font-family: inherit;
    font-size: 0.9375rem;
    transition: all $transition-fast;
    background: $background-light;
    color: $text-primary-light;

    .dark & {
      background: $surface-dark;
      border-color: $border-dark;
      color: $text-primary-dark;
    }

    &:focus {
      outline: none;
      border-color: $primary-light;
      box-shadow: 0 0 0 3px rgba($primary-light, 0.1);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.contact-selector {
  display: flex;
  gap: $spacing-md;

  select {
    flex: 1;
  }
}

.form-hint {
  font-size: 0.8125rem;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }
}

.form-actions {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  @include flex-between;
  padding: $spacing-md $spacing-lg;
  cursor: pointer;
  transition: background $transition-fast;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  &:hover {
    background: rgba($primary-light, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
}

.recent-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: $radius-full;
  background: linear-gradient(135deg, $primary-light, #7c3aed);
  color: white;
  @include flex-center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
  margin-left: $spacing-md;

  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $text-primary-light;
    margin-bottom: $spacing-xs;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    font-size: 0.8125rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
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
  cursor: pointer;
  color: $text-secondary-light;
  font-size: 1.25rem;
  padding: $spacing-xs;
  @include flex-center;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
  }
}

@include mobile {
  .home-view {
    padding: $spacing-md;
  }

  .form-section {
    padding: $spacing-lg;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

