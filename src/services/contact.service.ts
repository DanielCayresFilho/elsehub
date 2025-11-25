import type { Contact, CreateContactRequest, PaginatedResponse } from '@/types'
import { createEmptyPaginated, logStubCall } from './service-stubs'

export const contactService = {
  async getContacts(page = 1, limit = 10): Promise<PaginatedResponse<Contact>> {
    logStubCall('contactService', 'getContacts')
    return createEmptyPaginated<Contact>({ page, limit })
  },

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    logStubCall('contactService', 'createContact')
    return createMockContact(contactData)
  },

  async updateContact(id: string, contactData: Partial<CreateContactRequest>): Promise<Contact> {
    logStubCall('contactService', 'updateContact')
    return createMockContact({ ...contactData, name: contactData.name ?? 'Contato Atualizado' }, id)
  },

  async deleteContact(id: string): Promise<void> {
    logStubCall('contactService', `deleteContact:${id}`)
  },

  async importCSV(file: File): Promise<{ imported: number; failed: number }> {
    logStubCall('contactService', 'importCSV')
    return { imported: 0, failed: 0 }
  }
}

const createMockContact = (data: Partial<CreateContactRequest>, id = 'stub-contact'): Contact => {
  const now = new Date().toISOString()
  return {
    id,
    name: data.name ?? 'Contato Demo',
    phone: data.phone ?? '(00) 00000-0000',
    createdAt: now,
    updatedAt: now,
    cpf: data.cpf,
    additional1: data.additional1,
    additional2: data.additional2
  }
}

