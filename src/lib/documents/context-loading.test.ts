import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import type { Vizionare } from '@/lib/types'
import { loadLegalDocumentContext } from '@/lib/viewing-documents'
const rows = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => {
  const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: async () => ({ data: rows.value[table] || null, error: null }) }
  return query
} } }))
const actor = { id: 'staff', email: 'staff@example.test', user_metadata: { full_name: 'Staff Person' } } as unknown as User
const viewing = { id: 'appointment', propertyTitle: 'Apartment', propertyId: 'property', date: '2026-09-09', startTime: '10:00', endTime: '11:00' } as Vizionare
beforeEach(() => { rows.value = { admin_document_templates: { id: 'template', type: 'rental_contract', body: 'Document template '.repeat(20), required_fields: [], legal_version: '1' }, agency_legal_profiles: { id: 'agency', status: 'ACTIVE', iban: 'AGENCY-BANK' }, appointments: { id: viewing.id, properties: { id: 'property', transaction_type: 'SALE', price: 245000 } } } })
describe('document party and payment defaults', () => {
  it('never uses staff identity or agency bank details as participant defaults', async () => {
    const { values } = await loadLegalDocumentContext('rental_contract', actor, viewing)
    expect(values).toMatchObject({ client_name: '', client_email: '', owner_payment_account: '', rent_amount: '', deposit_amount: '' })
  })
  it('maps transaction selections for client and owner agreements', async () => {
    expect((await loadLegalDocumentContext('brokerage_agreement', actor, viewing)).values.transaction_type).toBe('cumpărare')
    expect((await loadLegalDocumentContext('owner_mandate', actor, viewing)).values.transaction_type).toBe('vânzare')
    rows.value.appointments = { id: viewing.id, client_name: 'Real client', client_email: 'client@example.test', properties: { transaction_type: 'RENT', price: 500 } }
    expect((await loadLegalDocumentContext('rental_contract', actor, viewing)).values).toMatchObject({ client_name: 'Real client', client_email: 'client@example.test', transaction_type: 'închiriere', rent_amount: '500' })
  })
  it('stops when the selected dossier no longer exists', async () => {
    rows.value.appointments = null
    await expect(loadLegalDocumentContext('rental_contract', actor, viewing)).rejects.toThrow('Dosarul nu mai este disponibil')
  })
})
