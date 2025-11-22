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
          <p>Plataforma de Atendimento WhatsApp</p>
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
    await authStore.login(form.value)
    
    // Connect WebSocket
    wsService.connect()
    
    // Redirect to dashboard
    router.push('/')
  } catch (err: any) {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  @include flex-center;
  padding: $spacing-lg;
}

.login-container {
  width: 100%;
  max-width: 28rem;
}

.login-card {
  background: $background-light;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  box-shadow: $shadow-xl;

  .dark & {
    background: $surface-dark;
  }
}

.login-logo {
  text-align: center;
  margin-bottom: $spacing-xl;

  .logo-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto $spacing-md;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    border-radius: $radius-xl;
    @include flex-center;

    img {
      width: 80%;
      height: 80%;
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

