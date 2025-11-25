<template>
  <div class="contacts-view">
    <div class="page-header">
      <h2>Contatos</h2>
      <div class="header-actions">
        <button @click="showImportModal = true" class="btn-secondary">
          <i class="fas fa-file-import"></i>
          Importar CSV
        </button>
        <button @click="openCreateModal" class="btn-primary">
          <i class="fas fa-plus"></i>
          Novo Contato
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <input 
          type="search" 
          v-model="searchQuery"
          placeholder="Buscar por nome ou telefone..."
        />
        <i class="fas fa-search"></i>
      </div>
    </div>

    <!-- Contacts Table -->
    <div class="card">
      <div v-if="loading" class="loading"></div>

      <div v-else-if="contacts.length === 0" class="empty-state">
        <i class="fas fa-users"></i>
        <h3>Nenhum contato encontrado</h3>
        <p>Comece adicionando um novo contato ou importando uma lista</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Informações Adicionais</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contact in filteredContacts" :key="contact.id">
              <td>{{ contact.name }}</td>
              <td>{{ formatPhone(contact.phone) }}</td>
              <td>{{ contact.cpf || '-' }}</td>
              <td>
                <div class="additional-info">
                  <span v-if="contact.additional1">{{ contact.additional1 }}</span>
                  <span v-if="contact.additional2">{{ contact.additional2 }}</span>
                  <span v-if="!contact.additional1 && !contact.additional2">-</span>
                </div>
              </td>
              <td>
                <div class="table-actions">
                  <button @click="openEditModal(contact)" class="icon-btn" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="confirmDelete(contact)" class="icon-btn text-error" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="btn-secondary btn-sm"
        >
          Anterior
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="btn-secondary btn-sm"
        >
          Próxima
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingContact ? 'Editar Contato' : 'Novo Contato' }}</h3>
          <button @click="closeModal" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveContact">
            <div class="form-group">
              <label for="name">Nome *</label>
              <input
                id="name"
                type="text"
                v-model="form.name"
                placeholder="Nome completo"
                required
              />
            </div>

            <div class="form-group">
              <label for="phone">Telefone *</label>
              <input
                id="phone"
                type="tel"
                v-model="form.phone"
                placeholder="5511999999999"
                required
              />
              <small>Formato: código do país + DDD + número (ex: 5511999999999)</small>
            </div>

            <div class="form-group">
              <label for="cpf">CPF</label>
              <input
                id="cpf"
                type="text"
                v-model="form.cpf"
                placeholder="000.000.000-00"
              />
            </div>

            <div class="form-group">
              <label for="additional1">Informação Adicional 1</label>
              <input
                id="additional1"
                type="text"
                v-model="form.additional1"
                placeholder="Ex: Empresa, Cargo, etc"
              />
            </div>

            <div class="form-group">
              <label for="additional2">Informação Adicional 2</label>
              <input
                id="additional2"
                type="text"
                v-model="form.additional2"
                placeholder="Informação extra"
              />
            </div>

            <div v-if="formError" class="error-message">{{ formError }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="saveContact" class="btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import CSV Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Importar Contatos CSV</h3>
          <button @click="showImportModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="import-instructions">
            <h4>Formato do arquivo CSV:</h4>
            <p>O arquivo deve conter as colunas: <code>name,phone,cpf,additional1</code></p>
            <p>Exemplo:</p>
            <pre>name,phone,cpf,additional1
João Silva,5511999999999,12345678900,Empresa ABC
Maria Santos,5511988888888,,Cliente Premium</pre>
          </div>

          <div class="form-group">
            <label>Selecione o arquivo CSV:</label>
            <input 
              type="file" 
              accept=".csv" 
              @change="handleFileSelect"
              ref="fileInput"
            />
          </div>

          <div v-if="importError" class="error-message">{{ importError }}</div>
          <div v-if="importSuccess" class="success-message">{{ importSuccess }}</div>
        </div>
        <div class="modal-footer">
          <button @click="showImportModal = false" class="btn-secondary">Cancelar</button>
          <button @click="importCSV" class="btn-primary" :disabled="!selectedFile || importing">
            {{ importing ? 'Importando...' : 'Importar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button @click="showDeleteModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o contato <strong>{{ contactToDelete?.name }}</strong>?</p>
          <p class="text-error">Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancelar</button>
          <button @click="deleteContact" class="btn-danger" :disabled="deleting">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Contact, CreateContactRequest } from '@/types'

const contacts = ref<Contact[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const showModal = ref(false)
const showImportModal = ref(false)
const showDeleteModal = ref(false)

const editingContact = ref<Contact | null>(null)
const contactToDelete = ref<Contact | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const form = ref<CreateContactRequest>({
  name: '',
  phone: '',
  cpf: '',
  additional1: '',
  additional2: ''
})

const saving = ref(false)
const deleting = ref(false)
const importing = ref(false)
const formError = ref('')
const importError = ref('')
const importSuccess = ref('')

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  
  const query = searchQuery.value.toLowerCase()
  return contacts.value.filter(contact => 
    contact.name.toLowerCase().includes(query) ||
    contact.phone.includes(query) ||
    contact.cpf?.includes(query)
  )
})

const loadContacts = () => {
  loading.value = true
  contacts.value = [
    {
      id: 'contact-1',
      name: 'Carlos Demo',
      phone: '5511999999999',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  totalPages.value = 1
  loading.value = false
}

const openCreateModal = () => {
  editingContact.value = null
  form.value = {
    name: '',
    phone: '',
    cpf: '',
    additional1: '',
    additional2: ''
  }
  formError.value = ''
  showModal.value = true
}

const openEditModal = (contact: Contact) => {
  editingContact.value = contact
  form.value = {
    name: contact.name,
    phone: contact.phone,
    cpf: contact.cpf || '',
    additional1: contact.additional1 || '',
    additional2: contact.additional2 || ''
  }
  formError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingContact.value = null
  formError.value = ''
}

const saveContact = () => {
  saving.value = true
  formError.value = ''

  if (editingContact.value) {
    contacts.value = contacts.value.map(contact =>
      contact.id === editingContact.value?.id
        ? {
            ...contact,
            ...form.value,
            updatedAt: new Date().toISOString()
          }
        : contact
    )
  } else {
    contacts.value.unshift({
      id: `contact-${Date.now()}`,
      ...form.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  closeModal()
  saving.value = false
}

const confirmDelete = (contact: Contact) => {
  contactToDelete.value = contact
  showDeleteModal.value = true
}

const deleteContact = () => {
  if (!contactToDelete.value) return

  deleting.value = true
  contacts.value = contacts.value.filter(contact => contact.id !== contactToDelete.value?.id)
  showDeleteModal.value = false
  contactToDelete.value = null
  deleting.value = false
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
  importError.value = ''
  importSuccess.value = ''
}

const importCSV = () => {
  if (!selectedFile.value) return

  importing.value = true
  importError.value = ''
  importSuccess.value = `Arquivo ${selectedFile.value.name} processado localmente.`

  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  importing.value = false
}

const changePage = (page: number) => {
  currentPage.value = page
  loadContacts()
}

const formatPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
}

onMounted(() => {
  loadContacts()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.contacts-view {
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

  .header-actions {
    @include flex-start;
    gap: $spacing-md;
  }
}

.filters-bar {
  margin-bottom: $spacing-lg;

  .search-box {
    position: relative;
    max-width: 400px;

    input {
      width: 100%;
      padding-right: 2.5rem;
    }

    i {
      position: absolute;
      right: $spacing-md;
      top: 50%;
      transform: translateY(-50%);
      color: $text-secondary-light;
      pointer-events: none;

      .dark & {
        color: $text-secondary-dark;
      }
    }
  }
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $surface-light;
    border-bottom: 2px solid $border-light;

    .dark & {
      background: $background-dark;
      border-color: $border-dark;
    }

    th {
      padding: $spacing-md $spacing-lg;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: $text-primary-light;

      .dark & {
        color: $text-primary-dark;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $border-light;
      transition: background $transition-fast;

      .dark & {
        border-color: $border-dark;
      }

      &:hover {
        background: rgba($primary-light, 0.05);
      }
    }

    td {
      padding: $spacing-md $spacing-lg;
      font-size: 0.875rem;
      color: $text-primary-light;

      .dark & {
        color: $text-primary-dark;
      }
    }
  }
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }
}

.table-actions {
  @include flex-start;
  gap: $spacing-sm;
}

.icon-btn {
  background: none;
  border: none;
  color: $text-secondary-light;
  cursor: pointer;
  padding: $spacing-xs;
  font-size: 1rem;
  transition: color $transition-fast;

  .dark & {
    color: $text-secondary-dark;
  }

  &:hover {
    color: $primary-light;
  }

  &.text-error:hover {
    color: $error;
  }
}

.pagination {
  @include flex-between;
  padding: $spacing-lg;
  border-top: 1px solid $border-light;

  .dark & {
    border-color: $border-dark;
  }

  .page-info {
    font-size: 0.875rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.import-instructions {
  background: $surface-light;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;

  .dark & {
    background: $background-dark;
  }

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: $spacing-sm;
  }

  p {
    font-size: 0.875rem;
    margin-bottom: $spacing-xs;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  code {
    background: rgba($primary-light, 0.1);
    color: $primary-light;
    padding: $spacing-xs;
    border-radius: $radius-sm;
    font-family: $font-family-mono;
    font-size: 0.75rem;
  }

  pre {
    background: $background-light;
    padding: $spacing-sm;
    border-radius: $radius-sm;
    overflow-x: auto;
    margin-top: $spacing-sm;
    font-family: $font-family-mono;
    font-size: 0.75rem;

    .dark & {
      background: $surface-dark;
    }
  }
}

.success-message {
  background: rgba($success, 0.1);
  color: $success;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin-top: $spacing-md;
  font-size: 0.875rem;
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
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
  }
}
</style>

