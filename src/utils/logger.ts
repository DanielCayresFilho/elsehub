/**
 * Sistema de logging seguro
 * Remove logs em produção para segurança
 */

const isDevelopment = import.meta.env.DEV

/**
 * Log apenas em desenvolvimento
 */
export function devLog(...args: any[]) {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * Log de erro sempre (mas sem detalhes sensíveis em produção)
 */
export function devError(message: string, error?: any) {
  if (isDevelopment) {
    console.error(message, error)
  } else {
    // Em produção, apenas loga a mensagem, sem detalhes sensíveis
    console.error(message)
  }
}

/**
 * Log de aviso apenas em desenvolvimento
 */
export function devWarn(...args: any[]) {
  if (isDevelopment) {
    console.warn(...args)
  }
}

/**
 * Remove todos os console.log do código
 * Use estas funções ao invés de console.log diretamente
 */
export const logger = {
  log: devLog,
  error: devError,
  warn: devWarn
}

