/**
 * Utilitário centralizado para tratamento de erros amigáveis
 */

interface ApiError {
  response?: {
    status?: number
    data?: {
      message?: string | string[]
    }
  }
  request?: any
  message?: string
}

/**
 * Converte erros da API em mensagens amigáveis para o usuário
 */
export function getErrorMessage(error: ApiError | any, defaultMessage?: string): string {
  // Se já for uma string, retorna
  if (typeof error === 'string') {
    return error
  }

  // Se tiver mensagem customizada do backend
  if (error?.response?.data?.message) {
    const apiMessage = error.response.data.message
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(', ')
    }
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage
    }
  }

  // Tratamento por status HTTP
  const status = error?.response?.status

  if (status) {
    switch (status) {
      case 400:
        return 'Dados inválidos. Verifique as informações e tente novamente.'
      case 401:
        return 'Sessão expirada. Por favor, faça login novamente.'
      case 403:
        return 'Você não tem permissão para realizar esta ação.'
      case 404:
        return 'Recurso não encontrado. Verifique se a informação está correta.'
      case 409:
        return 'Conflito. Esta informação já existe no sistema.'
      case 422:
        return 'Erro de validação. Verifique os dados informados.'
      case 500:
        return 'Erro interno do servidor. Tente novamente em alguns instantes.'
      case 502:
      case 503:
      case 504:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.'
      default:
        break
    }
  }

  // Erro de rede/conexão
  if (error?.request && !error?.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
  }

  // Mensagem de erro genérica do erro
  if (error?.message) {
    // Remove mensagens técnicas como códigos HTTP
    const msg = error.message
    if (!/^\d{3}/.test(msg) && !msg.includes('Network Error')) {
      return msg
    }
  }

  // Mensagem padrão customizada ou genérica
  return defaultMessage || 'Ocorreu um erro inesperado. Tente novamente.'
}

/**
 * Verifica se o erro requer redirecionamento para login
 */
export function shouldRedirectToLogin(error: ApiError | any): boolean {
  return error?.response?.status === 401
}

/**
 * Mensagens específicas para contextos comuns
 */
export const ErrorMessages = {
  login: {
    invalid: 'E-mail ou senha incorretos. Verifique suas credenciais.',
    network: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    default: 'Erro ao fazer login. Tente novamente.'
  },
  save: {
    default: 'Erro ao salvar informações. Tente novamente.',
    validation: 'Verifique os dados informados e tente novamente.'
  },
  delete: {
    default: 'Erro ao excluir. Tente novamente.',
    conflict: 'Não é possível excluir este item pois está em uso.'
  },
  load: {
    default: 'Erro ao carregar dados. Recarregue a página.',
    network: 'Não foi possível carregar os dados. Verifique sua conexão.'
  },
  send: {
    default: 'Erro ao enviar mensagem. Tente novamente.',
    conversation: 'Conversa não encontrada. Recarregue a página.'
  }
}

