<template>
  <div class="tabulations-view">
    <div class="page-header">
      <h2>Tabulações</h2>
      <button @click="openCreateModal" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nova Tabulação
      </button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Data de Criação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tabulation in tabulations" :key="tabulation.id">
            <td>{{ tabulation.name }}</td>
            <td>{{ formatDate(tabulation.createdAt) }}</td>
            <td>
              <button @click="openEditModal(tabulation)" class="btn-secondary btn-sm">Editar</button>
              <button @click="deleteTabulation(tabulation.id)" class="btn-danger btn-sm">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTabulation ? 'Editar Tabulação' : 'Nova Tabulação' }}</h3>
          <button @click="closeModal" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" v-model="form.name" required />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="saveTabulation" class="btn-primary">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tabulationService } from '@/services/tabulation.service'
import type { Tabulation } from '@/types'

const tabulations = ref<Tabulation[]>([])
const showModal = ref(false)
const editingTabulation = ref<Tabulation | null>(null)
const form = ref({ name: '' })

const loadTabulations = async () => {
  try {
    const response = await tabulationService.getTabulations()
    tabulations.value = response.data
  } catch (error) {
    console.error('Erro ao carregar tabulações:', error)
  }
}

const openCreateModal = () => {
  editingTabulation.value = null
  form.value = { name: '' }
  showModal.value = true
}

const openEditModal = (tabulation: Tabulation) => {
  editingTabulation.value = tabulation
  form.value = { name: tabulation.name }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingTabulation.value = null
}

const saveTabulation = async () => {
  try {
    if (editingTabulation.value) {
      await tabulationService.updateTabulation(editingTabulation.value.id, form.value)
    } else {
      await tabulationService.createTabulation(form.value)
    }
    closeModal()
    await loadTabulations()
  } catch (error) {
    alert('Erro ao salvar tabulação')
  }
}

const deleteTabulation = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir esta tabulação?')) return
  
  try {
    await tabulationService.deleteTabulation(id)
    await loadTabulations()
  } catch (error) {
    alert('Erro ao excluir tabulação')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(() => {
  loadTabulations()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.tabulations-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  @include flex-between;
  margin-bottom: $spacing-xl;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $surface-light;

    .dark & {
      background: $background-dark;
    }

    th {
      padding: $spacing-md $spacing-lg;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
    }
  }

  tbody {
    td {
      padding: $spacing-md $spacing-lg;
      font-size: 0.875rem;
      border-top: 1px solid $border-light;

      .dark & {
        border-color: $border-dark;
      }

      button {
        margin-right: $spacing-sm;
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
</style>

