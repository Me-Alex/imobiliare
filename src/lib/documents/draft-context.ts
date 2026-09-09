import type { DraftDefinition } from './drafting'

interface DraftContextSnapshot {
  template: object
  values: Record<string, string>
  agencyReady: boolean
}

/** Saving rechecks the authoritative source without silently replacing what the user reviewed. */
export function assertDraftContextCurrent(definition: DraftDefinition, expected: DraftContextSnapshot, current: DraftContextSnapshot) {
  const keys = new Set([
    ...definition.fields.filter(field => field.readOnly).map(field => field.key),
    'client_name', 'client_email', 'client_phone', 'owner_name', 'owner_email', 'owner_phone',
    'property_reference', 'property_address', 'property_title', 'transaction_type',
  ])
  if (JSON.stringify(expected.template) !== JSON.stringify(current.template)
    || expected.agencyReady !== current.agencyReady
    || [...keys].some(key => expected.values[key] !== current.values[key])) {
    throw new Error('Șablonul sau datele dosarului s-au schimbat după verificare. Reîncarcă datele și verifică din nou textul înainte de salvare.')
  }
  if (!expected.values.document_reference) throw new Error('Referința documentului lipsește. Reîncarcă datele înainte de salvare.')
}
