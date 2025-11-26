<template>
  <div class="home-view">
    <div class="home-container">
      <div class="home-header">
        <h1>Bem-vindo ao ElseHub</h1>
        <p>Plataforma de atendimento e gestão de mensagens</p>
      </div>

      <div class="home-content">
        <div class="card">
          <div class="welcome-section">
            <i class="fas fa-comments"></i>
            <h2>Comece agora</h2>
            <p>Gerencie suas conversas, contatos e campanhas de forma eficiente</p>
            <div class="quick-links">
              <router-link to="/conversas" class="btn-conversas">
                <i class="fas fa-message"></i>
                Ver Conversas
              </router-link>
              <router-link to="/dashboard" class="btn-secondary">
                <i class="fas fa-chart-pie"></i>
                Dashboard
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple welcome page
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-xl;
}

.home-header {
  text-align: center;
  margin-bottom: $spacing-2xl;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: $text-primary-light;
    margin-bottom: $spacing-sm;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    font-size: 1.125rem;
    color: $text-secondary-light;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.welcome-section {
  text-align: center;
  padding: $spacing-2xl;

  i {
    font-size: 4rem;
    color: $primary-light;
    margin-bottom: $spacing-lg;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: $text-primary-light;
    margin-bottom: $spacing-md;

    .dark & {
      color: $text-primary-dark;
    }
  }

  p {
    font-size: 1rem;
    color: $text-secondary-light;
    margin-bottom: $spacing-xl;

    .dark & {
      color: $text-secondary-dark;
    }
  }
}

.quick-links {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-conversas {
  @include button-base;
  background: $success;
  color: white;
  box-shadow: 0 2px 8px rgba($success, 0.25);

  &:hover:not(:disabled) {
    background: darken($success, 8%);
    box-shadow: 0 4px 12px rgba($success, 0.35);
  }

  i {
    margin-right: $spacing-xs;
  }
}

@include mobile {
  .home-view {
    padding: $spacing-md;
  }

  .home-header h1 {
    font-size: 2rem;
  }

  .quick-links {
    flex-direction: column;
  }
}
</style>
