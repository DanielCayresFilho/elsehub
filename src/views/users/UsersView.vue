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
      <div v-if="loading" class="loading"></div>
      <table v-else class="data-table">
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
import type { User, UserRole } from '@/types'
import { userService } from '@/services/user.service'

const users = ref<User[]>([])
const loading = ref(false)
const showModal = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'OPERATOR' as UserRole
})

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await userService.getUsers(1, 100)
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    users.value = []
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  try {
    await userService.createUser(form.value)
    showModal.value = false
    form.value = { name: '', email: '', password: '', role: 'OPERATOR' }
    await loadUsers()
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    alert(error.response?.data?.message || error.message || 'Erro ao criar usuário')
  }
}

const toggleActive = async (user: User) => {
  try {
    await userService.updateUser(user.id, { isActive: !user.isActive })
    await loadUsers()
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    alert(error.response?.data?.message || error.message || 'Erro ao atualizar usuário')
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

  h2 {
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $surface-light;

    .dark & {
      background: $surface-dark;
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
      transition: background $transition-fast;

      &:hover {
        background: rgba($primary-light, 0.05);

        .dark & {
          background: rgba($primary-light, 0.1);
        }
      }
    }

    td {
      padding: $spacing-md $spacing-lg;
      font-size: 0.875rem;
      border-top: 1px solid $border-light;
      color: $text-primary-light;

      .dark & {
        border-color: $border-dark;
        color: $text-primary-dark;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;

  label {
    font-weight: 500;
    font-size: 0.875rem;
    color: $text-primary-light;

    .dark & {
      color: $text-primary-dark;
    }
  }

  input,
  select {
    @include input-base;
  }
}
</style>

