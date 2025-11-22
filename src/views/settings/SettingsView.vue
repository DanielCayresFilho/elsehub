<template>
  <div class="settings-view">
    <h2>Configurações</h2>

    <div class="card">
      <h3>Perfil do Usuário</h3>
      <form @submit.prevent="saveProfile">
        <div class="form-group">
          <label>Nome</label>
          <input type="text" v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="form.email" required />
        </div>
        <div class="form-group">
          <label>Nova Senha (deixe em branco para não alterar)</label>
          <input type="password" v-model="form.password" minlength="6" />
        </div>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </form>
    </div>

    <div class="card">
      <h3>Preferências</h3>
      <div class="preference-item">
        <div>
          <strong>Tema</strong>
          <p>Alterne entre tema claro e escuro</p>
        </div>
        <button @click="toggleTheme" class="btn-secondary">
          <i :class="['fas', isDark ? 'fa-sun' : 'fa-moon']"></i>
          {{ isDark ? 'Modo Claro' : 'Modo Escuro' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { userService } from '@/services/user.service'

const authStore = useAuthStore()
const themeStore = useThemeStore()

const form = ref({
  name: '',
  email: '',
  password: ''
})

const saving = ref(false)
const isDark = computed(() => themeStore.isDark)

const loadProfile = () => {
  if (authStore.user) {
    form.value.name = authStore.user.name
    form.value.email = authStore.user.email
  }
}

const saveProfile = async () => {
  if (!authStore.user) return
  
  saving.value = true
  try {
    const payload: any = { name: form.value.name }
    if (form.value.password) {
      payload.password = form.value.password
    }
    
    await userService.updateUser(authStore.user.id, payload)
    await authStore.refreshProfile()
    alert('Perfil atualizado com sucesso!')
    form.value.password = ''
  } catch (error) {
    alert('Erro ao atualizar perfil')
  } finally {
    saving.value = false
  }
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.settings-view {
  max-width: 800px;
  margin: 0 auto;

  h2 {
    margin-bottom: $spacing-xl;
  }

  .card {
    margin-bottom: $spacing-lg;
    padding: $spacing-xl;

    h3 {
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-md;
      border-bottom: 1px solid $border-light;

      .dark & {
        border-color: $border-dark;
      }
    }

    form {
      .form-group {
        margin-bottom: $spacing-lg;
      }
    }
  }
}

.preference-item {
  @include flex-between;
  padding: $spacing-lg 0;

  strong {
    display: block;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: 0.875rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}
</style>

