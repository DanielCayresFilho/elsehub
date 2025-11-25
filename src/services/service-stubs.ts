import type { PaginatedResponse } from '@/types'

export const createEmptyPaginated = <T>(overrides?: Partial<{
  page: number
  limit: number
}>): PaginatedResponse<T> => {
  const page = overrides?.page ?? 1
  const limit = overrides?.limit ?? 10

  return {
    data: [],
    meta: {
      total: 0,
      page,
      limit,
      totalPages: 0
    }
  }
}

export const logStubCall = (scope: string, action: string) => {
  console.warn(`[stub:${scope}] ${action} executado – backend desativado.`)
}

