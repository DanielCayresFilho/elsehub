<template>
  <div class="templates-view">
    <div class="page-header">
      <h2>Templates de Mensagens</h2>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Novo Template
      </button>
    </div>

    <div class="templates-grid">
      <div v-for="template in templates" :key="template.id" class="template-card card">
        <h3>{{ template.name }}</h3>
        <p class="template-body">{{ template.body }}</p>
        <div class="template-actions">
          <button @click="openEditModal(template)" class="btn-secondary btn-sm">
            <i class="fas fa-edit"></i>
            Editar
          </button>
          <button @click="deleteTemplate(template.id)" class="btn-danger btn-sm">
            <i class="fas fa-trash"></i>
            Excluir
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTemplate ? 'Editar Template' : 'Novo Template' }}</h3>
          <button @click="closeModal" class="icon-btn">
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
              <label>Mensagem</label>
              <textarea v-model="form.body" rows="5" required></textarea>
              <small>Use {{name}} para variáveis</small>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="saveTemplate" class="btn-primary">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { templateService } from '@/services/template.service'
import { serviceInstanceService } from '@/services/service-instance.service'
import type { Template } from '@/types'

const templates = ref<Template[]>([])
const showModal = ref(false)
const editingTemplate = ref<Template | null>(null)

const form = ref({
  name: '',
  body: '',
  serviceInstanceId: ''
})

const loadTemplates = async () => {
  try {
    const response = await templateService.getTemplates()
    templates.value = response.data
  } catch (error) {
    console.error('Erro ao carregar templates:', error)
  }
}

const openCreateModal = async () => {
  editingTemplate.value = null
  form.value = { name: '', body: '', serviceInstanceId: '' }
  
  const instances = await serviceInstanceService.getInstances()
  if (instances.data.length > 0) {
    form.value.serviceInstanceId = instances.data[0].id
  }
  
  showModal.value = true
}

const openEditModal = (template: Template) => {
  editingTemplate.value = template
  form.value = {
    name: template.name,
    body: template.body,
    serviceInstanceId: template.serviceInstanceId
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingTemplate.value = null
}

const saveTemplate = async () => {
  try {
    if (editingTemplate.value) {
      await templateService.updateTemplate(editingTemplate.value.id, form.value)
    } else {
      await templateService.createTemplate(form.value)
    }
    closeModal()
    await loadTemplates()
  } catch (error) {
    alert('Erro ao salvar template')
  }
}

const deleteTemplate = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este template?')) return
  
  try {
    await templateService.deleteTemplate(id)
    await loadTemplates()
  } catch (error) {
    alert('Erro ao excluir template')
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.templates-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  @include flex-between;
  margin-bottom: $spacing-xl;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.template-card {
  padding: $spacing-lg;

  h3 {
    margin-bottom: $spacing-md;
  }

  .template-body {
    font-size: 0.875rem;
    color: $text-secondary-light;
    margin-bottom: $spacing-lg;
    white-space: pre-wrap;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  .template-actions {
    display: flex;
    gap: $spacing-sm;
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

small {
  display: block;
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }
}
</style>

