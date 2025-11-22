<template>
  <div class="users-view">
    <div class="page-header">
      <h2>Gerenciar Usuários</h2>
      <button @click="showModal = true" class="btn-primary">
        <i class="fas fa-plus"></i>
        Novo Usuário
      </button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td><span class="badge badge-primary">{{ user.role }}</span></td>
            <td>
              <span :class="['badge', user.isActive ? 'badge-success' : 'badge-error']">
                {{ user.isActive ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td>
              <button @click="toggleActive(user)" class="btn-secondary btn-sm">
                {{ user.isActive ? 'Desativar' : 'Ativar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Novo Usuário</h3>
          <button @click="showModal = false" class="icon-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createUser">
            <div class="form-group">
              <label>Nome</label>
              <input type="text" v-model="form.name" required />
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" v-model="form.email" required />
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input type="password" v-model="form.password" required minlength="8" />
            </div>
            <div class="form-group">
              <label>Perfil</label>
              <select v-model="form.role" required>
                <option value="OPERATOR">Operador</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-secondary">Cancelar</button>
          <button @click="createUser" class="btn-primary">Criar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/user.service'
import type { User } from '@/types'

const users = ref<User[]>([])
const showModal = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'OPERATOR'
})

const loadUsers = async () => {
  try {
    const response = await userService.getUsers(1, 50)
    users.value = response.data
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

const createUser = async () => {
  try {
    await userService.createUser(form.value)
    showModal.value = false
    form.value = { name: '', email: '', password: '', role: 'OPERATOR' }
    await loadUsers()
  } catch (error) {
    alert('Erro ao criar usuário')
  }
}

const toggleActive = async (user: User) => {
  try {
    await userService.updateUser(user.id, { isActive: !user.isActive })
    await loadUsers()
  } catch (error) {
    alert('Erro ao atualizar usuário')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.users-view {
  max-width: 1200px;
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

