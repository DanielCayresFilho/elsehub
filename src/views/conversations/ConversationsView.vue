<template>
  <div class="conversations-view">
    <!-- Conversations List -->
    <div class="conversations-sidebar">
      <div class="sidebar-header">
        <h3>Conversas</h3>
        <div class="header-actions">
          <button @click="showNewMessageModal = true" class="icon-btn" title="Nova Mensagem">
            <i class="fas fa-plus"></i>
          </button>
          <button @click="loadConversations" class="icon-btn" title="Atualizar">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div class="search-box">
        <input 
          type="search" 
          v-model="searchQuery"
          placeholder="Buscar conversas..."
        />
        <i class="fas fa-search"></i>
      </div>

      <div v-if="loading" class="loading"></div>

      <div v-else-if="filteredConversations.length === 0" class="empty-state-sidebar">
        <i class="fas fa-comments"></i>
        <p>Nenhuma conversa</p>
      </div>

      <div v-else class="conversations-list">
        <div 
          v-for="conversation in filteredConversations" 
          :key="conversation.id"
          :class="['conversation-item', { active: activeConversationId === conversation.id }]"
          @click="selectConversation(conversation.id)"
        >
          <div class="conversation-avatar">
            {{ getInitials(conversation.contact?.name || 'Desconhecido') }}
          </div>
          <div class="conversation-info">
            <div class="conversation-header">
              <h4>{{ conversation.contact?.name || 'Desconhecido' }}</h4>
              <span class="conversation-time">{{ formatDate(conversation.lastMessageAt) }}</span>
            </div>
            <p class="conversation-phone">{{ formatPhone(conversation.contact?.phone) }}</p>
          </div>
          <span v-if="conversation.unreadCount" class="unread-badge">{{ conversation.unreadCount }}</span>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="chat-area">
      <div v-if="!activeConversationId" class="no-conversation">
        <i class="fas fa-comments"></i>
        <h3>Selecione uma conversa</h3>
        <p>Escolha uma conversa da lista ao lado para começar</p>
      </div>

      <template v-else>
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="contact-info">
            <div class="contact-avatar">
              {{ getInitials(activeConversation?.contact?.name || 'Desconhecido') }}
            </div>
            <div>
              <h3>{{ activeConversation?.contact?.name || 'Desconhecido' }}</h3>
              <p>{{ formatPhone(activeConversation?.contact?.phone) }}</p>
            </div>
          </div>
          <div class="chat-actions">
            <button @click="showTransferModal = true" class="icon-btn" title="Transferir">
              <i class="fas fa-exchange-alt"></i>
            </button>
            <button @click="showCloseModal = true" class="icon-btn" title="Finalizar">
              <i class="fas fa-times-circle"></i>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-container" ref="messagesContainer">
          <div v-for="message in messages" :key="message.id" :class="['message', { 'message-from-me': message.fromMe }]">
            <div class="message-bubble">
              <p class="message-content">{{ message.content }}</p>
              <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input-container">
          <button class="icon-btn" title="Anexar">
            <i class="fas fa-paperclip"></i>
          </button>
          <input 
            v-model="newMessage"
            type="text" 
            placeholder="Digite sua mensagem..."
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage" class="send-btn" :disabled="!newMessage.trim()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </template>
    </div>

    <!-- Transfer Modal -->
    <div v-if="showTransferModal" class="modal-overlay" @click="showTransferModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Transferir Conversa</h3>
          <button @click="showTransferModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Selecione o operador:</label>
            <select v-model="selectedOperatorId">
              <option value="">Selecione...</option>
              <option v-for="operator in onlineOperators" :key="operator.id" :value="operator.id">
                {{ operator.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showTransferModal = false" class="btn-secondary">Cancelar</button>
          <button @click="transferConversation" class="btn-primary" :disabled="!selectedOperatorId">Transferir</button>
        </div>
      </div>
    </div>

    <!-- New Message Modal -->
    <div v-if="showNewMessageModal" class="modal-overlay" @click="showNewMessageModal = false">
      <div class="modal modal-sm" @click.stop>
        <div class="modal-header">
          <h3>Nova Mensagem</h3>
          <button @click="showNewMessageModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Instância</label>
            <select v-model="newMessageInstanceId" :disabled="sendingMessage">
              <option value="">Selecione...</option>
              <option v-for="instance in instances" :key="instance.id" :value="instance.id">
                {{ instance.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Contato</label>
            <select v-model="newMessageContactId" :disabled="!newMessageInstanceId || sendingMessage">
              <option value="">Selecione...</option>
              <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                {{ contact.name }} - {{ formatPhone(contact.phone) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Mensagem</label>
            <textarea 
              v-model="newMessageContent" 
              placeholder="Digite sua mensagem..."
              rows="3"
              :disabled="!newMessageContactId || sendingMessage"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showNewMessageModal = false" class="btn-secondary" :disabled="sendingMessage">Cancelar</button>
          <button @click="sendNewMessage" class="btn-primary" :disabled="!canSendNewMessage || sendingMessage">
            <i class="fas fa-paper-plane"></i>
            {{ sendingMessage ? 'Enviando...' : 'Enviar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Close Modal -->
    <div v-if="showCloseModal" class="modal-overlay" @click="showCloseModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Finalizar Conversa</h3>
          <button @click="showCloseModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Selecione o motivo de finalização:</label>
            <select v-model="selectedTabulationId">
              <option value="">Selecione...</option>
              <option v-for="tabulation in tabulations" :key="tabulation.id" :value="tabulation.id">
                {{ tabulation.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCloseModal = false" class="btn-secondary">Cancelar</button>
          <button @click="closeConversation" class="btn-danger" :disabled="!selectedTabulationId">Finalizar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useConversationStore } from '@/stores/conversation.store'
import { userService } from '@/services/user.service'
import { tabulationService } from '@/services/tabulation.service'
import { conversationService } from '@/services/conversation.service'
import { serviceInstanceService } from '@/services/service-instance.service'
import { contactService } from '@/services/contact.service'
import { wsService } from '@/services/websocket.service'
import type { User, Tabulation, ServiceInstance, Contact } from '@/types'

const conversationStore = useConversationStore()

const loading = ref(false)
const searchQuery = ref('')
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const activeConversationId = ref<string | null>(null)
const onlineOperators = ref<User[]>([])
const tabulations = ref<Tabulation[]>([])

const showTransferModal = ref(false)
const showCloseModal = ref(false)
const showNewMessageModal = ref(false)
const selectedOperatorId = ref('')
const selectedTabulationId = ref('')

// New message modal state
const instances = ref<ServiceInstance[]>([])
const contacts = ref<Contact[]>([])
const newMessageInstanceId = ref('')
const newMessageContactId = ref('')
const newMessageContent = ref('')
const sendingMessage = ref(false)

const conversations = computed(() => conversationStore.conversations)
const activeConversation = computed(() => conversationStore.activeConversation)
const messages = computed(() => conversationStore.messages)

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conv => 
    conv.contact?.name?.toLowerCase().includes(query) ||
    conv.contact?.phone?.includes(query)
  )
})

const loadConversations = async () => {
  loading.value = true
  try {
    await conversationStore.loadConversations()
  } finally {
    loading.value = false
  }
}

const selectConversation = async (id: string) => {
  activeConversationId.value = id
  await conversationStore.selectConversation(id)
  scrollToBottom()
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !activeConversationId.value) return
  
  wsService.sendMessage(activeConversationId.value, newMessage.value.trim())
  newMessage.value = ''
}

const transferConversation = async () => {
  if (!activeConversationId.value || !selectedOperatorId.value) return
  
  try {
    await conversationService.assignOperator(activeConversationId.value, selectedOperatorId.value)
    showTransferModal.value = false
    selectedOperatorId.value = ''
    activeConversationId.value = null
    await loadConversations()
  } catch (error) {
    console.error('Erro ao transferir conversa:', error)
    alert('Erro ao transferir conversa')
  }
}

const canSendNewMessage = computed(() => {
  return !!newMessageInstanceId.value && 
         !!newMessageContactId.value && 
         newMessageContent.value.trim().length > 0
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
  if (!newMessageInstanceId.value) {
    contacts.value = []
    return
  }
  try {
    const response = await contactService.getContacts(1, 100)
    contacts.value = response.data
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
  }
}

watch(newMessageInstanceId, () => {
  newMessageContactId.value = ''
  newMessageContent.value = ''
  loadContacts()
})

watch(showNewMessageModal, (show) => {
  if (show) {
    loadInstances()
    newMessageInstanceId.value = ''
    newMessageContactId.value = ''
    newMessageContent.value = ''
  }
})

const sendNewMessage = async () => {
  if (!canSendNewMessage.value) return
  
  sendingMessage.value = true
  try {
    // Ensure WebSocket is connected
    if (!wsService.isConnected()) {
      wsService.connect()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Find or create conversation
    let conversation = conversations.value.find(
      c => c.contact?.id === newMessageContactId.value && 
           c.serviceInstance?.id === newMessageInstanceId.value
    )
    
    if (!conversation) {
      conversation = await conversationService.createConversation({
        contactId: newMessageContactId.value,
        serviceInstanceId: newMessageInstanceId.value
      })
      await loadConversations()
    }

    // Join room and send message
    wsService.joinRoom(conversation.id)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    wsService.sendMessage(conversation.id, newMessageContent.value.trim())
    
    // Close modal and select conversation
    showNewMessageModal.value = false
    await selectConversation(conversation.id)
    
    // Clear form
    newMessageInstanceId.value = ''
    newMessageContactId.value = ''
    newMessageContent.value = ''
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error)
    alert(error.response?.data?.message || 'Erro ao enviar mensagem')
  } finally {
    sendingMessage.value = false
  }
}

const closeConversation = async () => {
  if (!activeConversationId.value || !selectedTabulationId.value) return
  
  try {
    await conversationStore.closeConversation(activeConversationId.value, selectedTabulationId.value)
    showCloseModal.value = false
    selectedTabulationId.value = ''
    activeConversationId.value = null
  } catch (error) {
    console.error('Erro ao finalizar conversa:', error)
    alert('Erro ao finalizar conversa')
  }
}

const loadOperatorsAndTabulations = async () => {
  try {
    const [operatorsData, tabulationsData] = await Promise.all([
      userService.getOnlineOperators(),
      tabulationService.getTabulations()
    ])
    onlineOperators.value = operatorsData
    tabulations.value = tabulationsData.data
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

const getInitials = (name: string) => {
  const names = name.split(' ')
  return names.length > 1 
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}

const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const formatMessageTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatPhone = (phone?: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
})

onMounted(() => {
  loadConversations()
  loadOperatorsAndTabulations()
  conversationStore.setupWebSocketListeners()
})

onUnmounted(() => {
  if (activeConversationId.value) {
    wsService.leaveRoom(activeConversationId.value)
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.conversations-view {
  display: grid;
  grid-template-columns: 22rem 1fr;
  gap: $spacing-lg;
  height: calc(100vh - #{$header-height} - #{$spacing-lg * 2});

  @include max-width($breakpoint-lg) {
    grid-template-columns: 1fr;
  }
}

.conversations-sidebar {
  @include card;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-xs;
  }
}

.search-box {
  position: relative;
  padding: $spacing-md;

  input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    padding-right: 2.5rem;
  }

  i {
    position: absolute;
    right: $spacing-lg;
    top: 50%;
    transform: translateY(-50%);
    color: $text-secondary-light;
    pointer-events: none;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
}

.empty-state-sidebar {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl $spacing-md;
  color: $text-secondary-light;
  text-align: center;

  .dark & {
    color: $text-secondary-dark;
  }

  i {
    font-size: 2.5rem;
    margin-bottom: $spacing-md;
    opacity: 0.3;
  }

  p {
    font-size: 0.875rem;
  }
}

.conversation-item {
  @include flex-start;
  gap: $spacing-md;
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

  &.active {
    background: rgba($primary-light, 0.1);
    border-left: 3px solid $primary-light;

    .dark & {
      background: rgba($primary-light, 0.15);
    }
  }
}

.conversation-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  @include flex-center;
  font-weight: 600;
  flex-shrink: 0;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  @include flex-between;
  margin-bottom: $spacing-xs;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    @include truncate;
  }

  .conversation-time {
    font-size: 0.75rem;
    color: $text-secondary-light;
    flex-shrink: 0;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.conversation-phone {
  font-size: 0.75rem;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }
}

.unread-badge {
  background: $primary-light;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: $radius-full;
  flex-shrink: 0;
}

.chat-area {
  @include card;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-conversation {
  @include flex-center;
  flex-direction: column;
  height: 100%;
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
    font-size: 1.5rem;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: 0.875rem;
  }
}

.chat-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }
}

.contact-info {
  @include flex-start;
  gap: $spacing-md;

  .contact-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: $radius-full;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    @include flex-center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    font-size: 0.75rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.chat-actions {
  @include flex-start;
  gap: $spacing-sm;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  @include custom-scrollbar;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.message {
  display: flex;
  justify-content: flex-start;

  &.message-from-me {
    justify-content: flex-end;

    .message-bubble {
      background: $primary-light;
      color: white;
    }
  }
}

.message-bubble {
  max-width: 70%;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-lg;
  background: $surface-light;

  .dark & {
    background: $surface-dark;
  }

  .message-content {
    margin-bottom: $spacing-xs;
    font-size: 0.875rem;
    word-wrap: break-word;
  }

  .message-time {
    font-size: 0.75rem;
    opacity: 0.7;
  }
}

.message-input-container {
  @include flex-start;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  input {
    flex: 1;
  }

  .send-btn {
    @include button-primary;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border-radius: $radius-full;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.icon-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;
  font-size: 1.125rem;
  transition: color $transition-fast;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $primary-light;
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

  &.modal-sm {
    max-width: 400px;
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
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-weight: 500;
    font-size: 0.875rem;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }

  select,
  textarea {
    @include input-base;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}
</style>

