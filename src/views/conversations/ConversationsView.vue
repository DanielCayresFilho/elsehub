<template>
  <div class="conversations-view">
    <!-- Conversations List -->
    <div class="conversations-sidebar" :class="{ 'sidebar-mobile-open': isMobileSidebarOpen }">
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
            {{ getInitials(conversation.contactName || conversation.contact?.name || 'Sem nome') }}
          </div>
          <div class="conversation-info">
            <div class="conversation-header">
              <h4>{{ conversation.contactName || conversation.contact?.name || 'Sem nome' }}</h4>
              <span class="conversation-time">{{ formatDate(conversation.lastMessageAt || conversation.updatedAt) }}</span>
            </div>
            <p class="conversation-preview">{{ getConversationPreview(conversation) }}</p>
          </div>
          <span v-if="conversation.unreadCount" class="unread-badge">{{ conversation.unreadCount }}</span>
        </div>
      </div>
    </div>
    <div 
      v-if="isMobileSidebarOpen" 
      class="mobile-sidebar-overlay" 
      @click="isMobileSidebarOpen = false">
    </div>

    <!-- Chat Area -->
    <div class="chat-area">
      <div v-if="!activeConversationId" class="no-conversation">
        <i class="fas fa-comments"></i>
        <h3>Selecione uma conversa</h3>
        <p>Escolha uma conversa da lista ao lado para começar</p>
        <button class="mobile-open-sidebar" type="button" @click="openSidebarOnMobile">
          Abrir conversas
        </button>
      </div>

      <template v-else>
        <!-- Chat Header -->
        <div class="chat-header">
          <button class="icon-btn mobile-sidebar-toggle" @click="openSidebarOnMobile" title="Conversas">
            <i class="fas fa-bars"></i>
          </button>
          <div class="contact-info">
            <div class="contact-avatar">
              {{ getInitials(activeConversation?.contactName || activeConversation?.contact?.name || 'Sem nome') }}
            </div>
            <div>
              <h3>{{ activeConversation?.contactName || activeConversation?.contact?.name || 'Sem nome' }}</h3>
              <p>{{ formatPhone(activeConversation?.contactPhone || activeConversation?.contact?.phone) }}</p>
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
          <div v-if="messages.length === 0" class="empty-messages">
            <p>Nenhuma mensagem ainda. Envie a primeira mensagem!</p>
          </div>
          <div v-for="message in messages" :key="message.id" :class="['message', { 'message-from-me': message.fromMe || message.direction === 'OUTBOUND' }]">
            <div class="message-bubble">
              <div v-if="message.hasMedia" class="message-media">
                <template v-if="message.mediaType === 'IMAGE'">
                  <img 
                    v-if="mediaUrls[message.id]" 
                    :src="mediaUrls[message.id]" 
                    :alt="message.mediaCaption || 'Imagem recebida'" 
                    class="media-image" />
                  <button 
                    v-else 
                    class="media-action" 
                    @click="loadMedia(message, true)" 
                    :disabled="isMediaLoading(message.id)">
                    {{ isMediaLoading(message.id) ? 'Carregando imagem...' : 'Carregar imagem' }}
                  </button>
                </template>
                <template v-else-if="message.mediaType === 'AUDIO'">
                  <audio 
                    v-if="mediaUrls[message.id]" 
                    :src="mediaUrls[message.id]" 
                    controls 
                    class="media-audio"></audio>
                  <button 
                    v-else 
                    class="media-action" 
                    @click="loadMedia(message, true)" 
                    :disabled="isMediaLoading(message.id)">
                    {{ isMediaLoading(message.id) ? 'Carregando áudio...' : 'Carregar áudio' }}
                  </button>
                </template>
                <template v-else>
                  <button 
                    class="media-action" 
                    @click="downloadMedia(message)" 
                    :disabled="isMediaLoading(message.id)">
                    {{ isMediaLoading(message.id) ? 'Preparando arquivo...' : `Baixar ${getMediaLabel(message)}` }}
                  </button>
                </template>
                <p v-if="message.mediaCaption" class="media-caption">{{ message.mediaCaption }}</p>
                <p v-if="mediaErrors[message.id]" class="media-error">
                  {{ mediaErrors[message.id] }}
                  <button class="media-action link" @click="loadMedia(message, true)">Tentar novamente</button>
                </p>
              </div>
              <p v-if="shouldShowMessageText(message)" class="message-content">{{ message.content }}</p>
              <span class="message-time">{{ formatMessageTime(message.timestamp || message.createdAt) }}</span>
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
            @input="handleTyping"
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
            <div class="contact-selector">
              <select v-model="newMessageContactId" :disabled="!newMessageInstanceId || sendingMessage || loadingContacts">
                <option value="">Selecione...</option>
                <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                  {{ contact.name }} - {{ formatPhone(contact.phone) }}
                </option>
              </select>
              <button 
                v-if="newMessageInstanceId" 
                @click="showCreateContactModal = true" 
                class="btn-link" 
                type="button"
                :disabled="sendingMessage"
                title="Criar novo contato"
              >
                <i class="fas fa-plus"></i> Novo
              </button>
            </div>
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

    <!-- Create Contact Modal -->
    <div v-if="showCreateContactModal" class="modal-overlay" @click="showCreateContactModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Novo Contato</h3>
          <button @click="showCreateContactModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" v-model="newContactForm.name" required />
          </div>
          <div class="form-group">
            <label>Telefone *</label>
            <input type="text" v-model="newContactForm.phone" placeholder="+5511999999999" required />
          </div>
          <div class="form-group">
            <label>CPF</label>
            <input type="text" v-model="newContactForm.cpf" />
          </div>
          <div class="form-group">
            <label>Informação Adicional 1</label>
            <input type="text" v-model="newContactForm.additional1" />
          </div>
          <div class="form-group">
            <label>Informação Adicional 2</label>
            <input type="text" v-model="newContactForm.additional2" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateContactModal = false" class="btn-secondary" :disabled="creatingContact">Cancelar</button>
          <button @click="createContact" class="btn-primary" :disabled="creatingContact || !newContactForm.name.trim() || !newContactForm.phone.trim()">
            {{ creatingContact ? 'Criando...' : 'Criar' }}
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
import { useConversationStore, getMessagePreviewLabel } from '@/stores/conversation.store'
import { userService } from '@/services/user.service'
import { tabulationService } from '@/services/tabulation.service'
import { conversationService } from '@/services/conversation.service'
import { serviceInstanceService } from '@/services/service-instance.service'
import { contactService } from '@/services/contact.service'
import { messageService } from '@/services/message.service'
import { wsService } from '@/services/websocket.service'
import { api } from '@/services/api'
import type { User, Tabulation, ServiceInstance, Contact, Message, Conversation } from '@/types'

const conversationStore = useConversationStore()

const loading = ref(false)
const searchQuery = ref('')
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const typingTimeout = ref<NodeJS.Timeout | null>(null)
const isTyping = ref(false)
const isMobileSidebarOpen = ref(false)

const mediaUrls = ref<Record<string, string>>({})
const mediaLoadingState = ref<Record<string, boolean>>({})
const mediaErrors = ref<Record<string, string>>({})

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
const loadingContacts = ref(false)
const showCreateContactModal = ref(false)
const newContactForm = ref({
  name: '',
  phone: '',
  cpf: '',
  additional1: '',
  additional2: ''
})
const creatingContact = ref(false)

const MOBILE_BREAKPOINT = 1024
const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT

const conversations = computed(() => conversationStore.conversations)
const activeConversation = computed(() => conversationStore.activeConversation)
const messages = computed(() => conversationStore.messages)

const openSidebarOnMobile = () => {
  if (isMobileViewport()) {
    isMobileSidebarOpen.value = true
  }
}

const closeSidebarOnMobile = () => {
  if (isMobileViewport()) {
    isMobileSidebarOpen.value = false
  }
}

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conv => {
    const name = (conv.contactName || conv.contact?.name || '').toLowerCase()
    const phone = conv.contactPhone || conv.contact?.phone || ''
    return name.includes(query) || phone.includes(query)
  })
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
  try {
    console.log('Selecionando conversa na view:', id)
    await conversationStore.selectConversation(id)
    
    // Força scroll após carregar mensagens
    await nextTick()
    scrollToBottom()
    
    // Log para debug
    console.log('Mensagens após selecionar:', conversationStore.messages.length)
    closeSidebarOnMobile()
  } catch (error) {
    console.error('Erro ao selecionar conversa:', error)
    alert('Erro ao carregar conversa. Verifique o console para mais detalhes.')
  }
}

const handleTyping = () => {
  if (!activeConversationId.value) return
  
  // Para de indicar digitação anterior
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  // Indica que está digitando
  if (!isTyping.value) {
    isTyping.value = true
    wsService.sendTypingStart(activeConversationId.value)
  }
  
  // Para de indicar após 1 segundo sem digitar
  typingTimeout.value = setTimeout(() => {
    if (isTyping.value) {
      isTyping.value = false
      wsService.sendTypingStop(activeConversationId.value)
    }
  }, 1000)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !activeConversationId.value) return
  
  // Para indicador de digitação
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = null
  }
  if (isTyping.value) {
    isTyping.value = false
    wsService.sendTypingStop(activeConversationId.value)
  }
  
  const messageContent = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    // Enviar via HTTP API (que usa Evolution API)
    const sentMessage = await messageService.sendMessage(activeConversationId.value, messageContent)
    console.log('Mensagem enviada:', sentMessage)
    
    // Adiciona a mensagem imediatamente à lista (otimista)
    // NÃO recarrega a conversa para não perder as mensagens já carregadas
    conversationStore.addMessage(sentMessage)
    
    // Scroll para baixo após adicionar
    await nextTick()
    scrollToBottom()
    
    // NÃO recarrega a conversa - a mensagem já foi adicionada e o WebSocket vai atualizar
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error)
    // Restaurar mensagem em caso de erro
    newMessage.value = messageContent
    alert(error.response?.data?.message || 'Erro ao enviar mensagem')
  }
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
    instances.value = (await serviceInstanceService.getInstances()).filter(i => i.isActive)
  } catch (error) {
    console.error('Erro ao carregar instâncias:', error)
    alert('Erro ao carregar instâncias')
  }
}

const loadContacts = async () => {
  if (!newMessageInstanceId.value) {
    contacts.value = []
    return
  }
  loadingContacts.value = true
  try {
    const response = await contactService.getContacts(1, 100)
    contacts.value = response.data
  } catch (error) {
    console.error('Erro ao carregar contatos:', error)
    alert('Erro ao carregar contatos')
  } finally {
    loadingContacts.value = false
  }
}

const createContact = async () => {
  if (!newContactForm.value.name.trim() || !newContactForm.value.phone.trim()) {
    alert('Nome e telefone são obrigatórios')
    return
  }

  creatingContact.value = true
  try {
    const contact = await contactService.createContact({
      name: newContactForm.value.name.trim(),
      phone: newContactForm.value.phone.trim(),
      cpf: newContactForm.value.cpf.trim() || undefined,
      additional1: newContactForm.value.additional1.trim() || undefined,
      additional2: newContactForm.value.additional2.trim() || undefined
    })
    
    await loadContacts()
    newMessageContactId.value = contact.id
    showCreateContactModal.value = false
    newContactForm.value = {
      name: '',
      phone: '',
      cpf: '',
      additional1: '',
      additional2: ''
    }
  } catch (error: any) {
    console.error('Erro ao criar contato:', error)
    alert(error.response?.data?.message || 'Erro ao criar contato')
  } finally {
    creatingContact.value = false
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

    // Enviar mensagem via HTTP API
    await messageService.sendMessage(conversation.id, newMessageContent.value.trim())
    
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

const formatDate = (date?: string | null) => {
  if (!date) return 'Agora'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Agora'
    
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch (e) {
    return 'Agora'
  }
}

const formatMessageTime = (timestamp?: string) => {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (e) {
    return ''
  }
}

const formatPhone = (phone?: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
}

const getConversationPreview = (conversation: Conversation) => {
  if (conversation.lastMessagePreview) return conversation.lastMessagePreview
  if (activeConversation.value?.id === conversation.id && messages.value.length > 0) {
    return getMessagePreviewLabel(messages.value[messages.value.length - 1])
  }
  const phone = conversation.contactPhone || conversation.contact?.phone
  if (phone) return formatPhone(phone)
  return 'Sem mensagens ainda'
}

const shouldShowMessageText = (message: Message) => {
  if (!message.content) return false
  const trimmed = message.content.trim()
  if (message.hasMedia && !message.mediaCaption && /^\[.+\]$/.test(trimmed)) {
    return false
  }
  return true
}

const getMediaDownloadUrl = (message: Message) => message.mediaDownloadPath || `/messages/${message.id}/media`
const isMediaLoading = (messageId: string) => !!mediaLoadingState.value[messageId]
const getMediaLabel = (message: Message) => message.mediaFileName || getMessagePreviewLabel(message)

const ensureMediaLoaded = async (message: Message, force = false) => {
  if (!message.hasMedia) return
  const messageId = message.id
  
  if (!force) {
    if (mediaUrls.value[messageId] || mediaLoadingState.value[messageId]) {
      return
    }
  }
  
  mediaErrors.value = { ...mediaErrors.value, [messageId]: '' }
  mediaLoadingState.value = { ...mediaLoadingState.value, [messageId]: true }
  
  try {
    const endpoint = getMediaDownloadUrl(message)
    const response = await api.get(endpoint, { responseType: 'blob' })
    if (mediaUrls.value[messageId]) {
      URL.revokeObjectURL(mediaUrls.value[messageId])
    }
    const blobUrl = URL.createObjectURL(response.data)
    mediaUrls.value = { ...mediaUrls.value, [messageId]: blobUrl }
  } catch (error: any) {
    console.error('Erro ao carregar mídia:', error)
    mediaErrors.value = { 
      ...mediaErrors.value, 
      [messageId]: error.response?.data?.message || 'Erro ao carregar mídia' 
    }
  } finally {
    mediaLoadingState.value = { ...mediaLoadingState.value, [messageId]: false }
  }
}

const loadMedia = (message: Message, force = false) => {
  ensureMediaLoaded(message, force)
}

const downloadMedia = async (message: Message) => {
  await ensureMediaLoaded(message, true)
  const url = mediaUrls.value[message.id]
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = message.mediaFileName || 'arquivo'
  link.click()
}

const preloadMedia = (list: Message[]) => {
  list.forEach(message => {
    if (message.hasMedia) {
      ensureMediaLoaded(message)
    }
  })
}

const cleanupMediaCache = () => {
  Object.values(mediaUrls.value).forEach(url => URL.revokeObjectURL(url))
  mediaUrls.value = {}
  mediaLoadingState.value = {}
  mediaErrors.value = {}
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(messages, (newMessages) => {
  scrollToBottom()
  preloadMedia(newMessages)
}, { deep: true, immediate: true })

// Polling como fallback quando WebSocket não funciona
let messagePollInterval: ReturnType<typeof setInterval> | null = null
let resizeListener: (() => void) | null = null

const startMessagePolling = () => {
  // Limpa intervalo anterior se existir
  if (messagePollInterval) {
    clearInterval(messagePollInterval)
  }
  
  // Polling a cada 3 segundos quando há conversa ativa
  messagePollInterval = setInterval(async () => {
    if (activeConversationId.value) {
      try {
        // Busca mensagens da conversa ativa
        // ✅ Conforme documentação: retorna array direto
        const newMessages = await messageService.getMessages(activeConversationId.value, 1, 100)
        const currentCount = messages.value.length
        
        // Atualiza mensagens se houver novas
        if (newMessages.length > currentCount) {
          console.log('🔄 Polling: Novas mensagens encontradas', newMessages.length - currentCount)
          // Atualiza o store com as mensagens mais recentes
          conversationStore.setMessages(newMessages)
        }
      } catch (error) {
        console.error('Erro ao fazer polling de mensagens:', error)
      }
    }
  }, 3000) // Poll a cada 3 segundos
}

const stopMessagePolling = () => {
  if (messagePollInterval) {
    clearInterval(messagePollInterval)
    messagePollInterval = null
  }
}

// Observa mudanças na conversa ativa para iniciar/parar polling
watch(activeConversationId, (newId) => {
  if (newId) {
    console.log('🔄 Iniciando polling de mensagens para conversa:', newId)
    startMessagePolling()
  } else {
    console.log('🛑 Parando polling de mensagens')
    stopMessagePolling()
  }
})

onMounted(() => {
  loadConversations()
  loadOperatorsAndTabulations()
  conversationStore.setupWebSocketListeners()
  if (isMobileViewport()) {
    isMobileSidebarOpen.value = true
  }
  
  // Log para debug
  console.log('ConversationsView montado')
  console.log('WebSocket conectado?', wsService.isConnected())
  
  // Verifica se WebSocket está conectado, se não, tenta conectar
  if (!wsService.isConnected()) {
    console.log('WebSocket não conectado, tentando conectar...')
    wsService.connect()
  }
  
  // Inicia polling se já houver conversa ativa
  if (activeConversationId.value) {
    startMessagePolling()
  }
  
  resizeListener = () => {
    if (!isMobileViewport()) {
      isMobileSidebarOpen.value = false
    }
  }
  window.addEventListener('resize', resizeListener)
})

onUnmounted(() => {
  // Para polling
  stopMessagePolling()
  cleanupMediaCache()
  
  if (resizeListener) {
    window.removeEventListener('resize', resizeListener)
    resizeListener = null
  }
  
  // Para indicador de digitação
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  if (isTyping.value && activeConversationId.value) {
    wsService.sendTypingStop(activeConversationId.value)
  }
  
  // Sair da sala da conversa
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
    height: auto;
    position: relative;
  }
}

.conversations-sidebar {
  @include card;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform $transition-fast;

  &.sidebar-mobile-open {
    transform: translateX(0);
  }

  @include max-width($breakpoint-lg) {
    position: fixed;
    top: calc(#{$header-height} + $spacing-lg);
    left: $spacing-md;
    right: $spacing-md;
    max-width: 20rem;
    height: calc(100vh - #{$header-height} - #{$spacing-lg * 2});
    z-index: 15;
    transform: translateX(-120%);
  }
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

.conversation-preview {
  font-size: 0.8rem;
  color: $text-secondary-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

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

  .mobile-open-sidebar {
    @include button-primary;
    display: none;
    margin-top: $spacing-md;
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

  .empty-messages {
    @include flex-center;
    flex: 1;
    color: $text-secondary-light;
    font-size: 0.875rem;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.message {
  display: flex;
  justify-content: flex-start;

  .message-bubble {
    color: $text-primary-light;
  }

  .dark & {
    .message-bubble {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
  }

  &.message-from-me {
    justify-content: flex-end;

    .message-bubble {
      background: $primary-light;
      color: white;

      .dark & {
        background: lighten($primary-light, 10%);
        color: #fff;
      }
    }
  }
}

.message-bubble {
  max-width: 70%;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-lg;
  background: $surface-light;
  color: $text-primary-light;

  .dark & {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
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

.message-media {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;

  .media-image {
    width: 100%;
    max-height: 18rem;
    object-fit: cover;
    border-radius: $radius-md;
  }

  .media-audio {
    width: 100%;
  }

  .media-caption {
    font-size: 0.8rem;
    opacity: 0.85;
  }

  .media-error {
    font-size: 0.75rem;
    color: $error;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  .media-action {
    @include button-secondary;
    width: fit-content;
    padding: $spacing-xs $spacing-sm;
    font-size: 0.75rem;

    &.link {
      background: none;
      border: none;
      color: $primary-light;
      padding: 0;
    }
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

.mobile-sidebar-toggle {
  display: none;
  margin-right: $spacing-md;
}

.mobile-sidebar-overlay {
  display: none;
}

@include max-width($breakpoint-lg) {
  .mobile-sidebar-toggle {
    display: inline-flex;
  }

  .mobile-sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 14;
  }

  .no-conversation .mobile-open-sidebar {
    display: inline-flex;
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
  textarea,
  input {
    @include input-base;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.contact-selector {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-start;

  select {
    flex: 1;
  }

  .btn-link {
    background: none;
    border: none;
    color: $primary-light;
    cursor: pointer;
    padding: $spacing-sm;
    font-size: 0.875rem;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    &:hover {
      opacity: 0.8;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>

