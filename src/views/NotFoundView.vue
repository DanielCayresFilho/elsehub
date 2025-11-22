<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p>A página que você está procurando não existe ou foi removida.</p>
      <router-link to="/" class="btn-primary">
        <i class="fas fa-home"></i>
        Voltar ao Início
      </router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.not-found-view {
  @include flex-center;
  min-height: 80vh;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  padding: $spacing-xl;

  h1 {
    font-size: 6rem;
    font-weight: 700;
    background: linear-gradient(135deg, $primary-light, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: $spacing-md;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: $spacing-md;
  }

  p {
    color: $text-secondary-light;
    margin-bottom: $spacing-xl;

    .dark & {
      color: $text-secondary-dark;
    }
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
  }
}
</style>

