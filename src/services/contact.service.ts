import { api } from './api'
import type { Contact, CreateContactRequest, PaginatedResponse } from '@/types'

export const contactService = {
  async getContacts(page = 1, limit = 10): Promise<PaginatedResponse<Contact>> {
    const { data } = await api.get<PaginatedResponse<Contact>>('/contacts', {
      params: { page, limit }
    })
    return data
  },

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    const { data } = await api.post<Contact>('/contacts', contactData)
    return data
  },

  async updateContact(id: string, contactData: Partial<CreateContactRequest>): Promise<Contact> {
    const { data } = await api.patch<Contact>(`/contacts/${id}`, contactData)
    return data
  },

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`)
  },

  async importCSV(file: File): Promise<{ imported: number; failed: number }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await api.post<{ imported: number; failed: number }>(
      '/contacts/import/csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return data
  }
}

