import { api } from './api'
import type { Contact, CreateContactRequest } from '@/types'

interface ImportCSVResponse {
  success: boolean
  total: number
  imported: number
  failed: number
  errors?: Array<{
    row: number
    error: string
  }>
}

export const contactService = {
  /**
   * GET /api/contacts
   * Lista contatos com filtros e paginação
   * Backend retorna array direto conforme documentação
   */
  async getContacts(page = 1, limit = 25, search?: string): Promise<Contact[]> {
    const { data } = await api.get<Contact[]>('/contacts', {
      params: {
        page,
        limit,
        ...(search && { search })
      }
    })
    return data || []
  },

  /**
   * GET /api/contacts/:id
   * Retorna um contato por ID
   */
  async getContact(id: string): Promise<Contact> {
    const { data } = await api.get<Contact>(`/contacts/${id}`)
    return data
  },

  /**
   * POST /api/contacts
   * Cria um novo contato
   */
  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    const { data } = await api.post<Contact>('/contacts', contactData)
    return data
  },

  /**
   * PATCH /api/contacts/:id
   * Atualiza um contato
   */
  async updateContact(id: string, contactData: Partial<CreateContactRequest>): Promise<Contact> {
    const { data } = await api.patch<Contact>(`/contacts/${id}`, contactData)
    return data
  },

  /**
   * DELETE /api/contacts/:id
   * Remove um contato
   */
  async deleteContact(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`)
  },

  /**
   * POST /api/contacts/import/csv
   * Importa contatos em massa via arquivo CSV
   */
  async importCSV(file: File): Promise<ImportCSVResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await api.post<ImportCSVResponse>('/contacts/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  }
}

