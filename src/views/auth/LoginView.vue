<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-icon">
            <img src="/logo.png" alt="ElseHub" />
          </div>
          <h1>ElseHub</h1>
          <p>Workstation de Atendimento</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input
              id="email"
              type="email"
              v-model="form.email"
              placeholder="seu@email.com"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              type="password"
              v-model="form.password"
              placeholder="••••••••"
              required
              minlength="6"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary btn-lg" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else>Entrando...</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <p>ElseHub &copy; 2025 - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { wsService } from '@/services/websocket.service'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await authStore.login(form.value)
    
    if (response && response.accessToken && response.user) {
      // Wait a bit to ensure everything is properly saved
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Force reload to clear any stale state
      window.location.href = '/'
    } else {
      error.value = 'Erro ao processar login. Tente novamente.'
    }
  } catch (err: any) {
    console.error('Login error:', err)
    const errorMessage = err.response?.data?.message
    if (Array.isArray(errorMessage)) {
      error.value = errorMessage.join(', ')
    } else {
      error.value = errorMessage || 'Erro ao fazer login. Verifique suas credenciais.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.login-view {
  min-height: 100vh;
  background: $surface-light;
  @include flex-center;
  padding: $spacing-lg;

  .dark & {
    background: $background-dark;
  }
}

.login-container {
  width: 100%;
  max-width: 28rem;
}

.login-card {
  background: $background-light;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid $border-light;

  .dark & {
    background: $surface-dark;
    border-color: $border-dark;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
}

.login-logo {
  text-align: center;
  margin-bottom: $spacing-xl;

  .logo-icon {
    width: 6rem;
    height: 6rem;
    margin: 0 auto $spacing-md;
    background: white;
    border: 3px solid #000;
    border-radius: $radius-xl;
    @include flex-center;

    .dark & {
      background: white;
      border-color: #333;
    }

    img {
      width: 75%;
      height: 75%;
      object-fit: contain;
    }
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: $text-primary-light;
    margin-bottom: $spacing-xs;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    color: $text-secondary-light;
    font-size: 0.875rem;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.login-form {
  .form-group {
    margin-bottom: $spacing-lg;
  }

  .error-message {
    background: rgba($error, 0.1);
    color: $error;
    padding: $spacing-md;
    border-radius: $radius-md;
    margin-bottom: $spacing-lg;
    font-size: 0.875rem;
    text-align: center;
  }

  button[type="submit"] {
    width: 100%;
  }
}

.login-footer {
  margin-top: $spacing-xl;
  text-align: center;
  font-size: 0.75rem;
  color: $text-secondary-light;

  .dark & {
    color: $text-secondary-dark;
  }
}
</style>

