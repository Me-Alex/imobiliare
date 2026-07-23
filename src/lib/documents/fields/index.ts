/**
 * Field composition helpers.
 *
 * Templates compose their field list from:
 *   - agency fields (always, when requiresAgencyProfile)
 *   - participant identity fields (sourced from each participant's identity)
 *   - document-specific fields (the template's own list)
 *
 * This replaces the old `LEGAL_REQUEST_FIELD_KEYS` map with a clean
 * "which keys does this template consume" declaration.
 */

import type { Field, IdentityFieldKey } from '../types'
import { AGENCY_FIELDS, PRIVACY_FIELDS } from './agency'
import { CLIENT_IDENTITY_FIELDS } from './client'
import { OWNER_IDENTITY_FIELDS } from './owner'
import { PROPERTY_FIELDS, PROPERTY_LEGAL_FIELDS } from './property'

// Re-export the raw field lists so consumers can `import { AGENCY_FIELDS } from '@/lib/documents'`
export { AGENCY_FIELDS, PRIVACY_FIELDS } from './agency'
export { CLIENT_IDENTITY_FIELDS } from './client'
export { OWNER_IDENTITY_FIELDS } from './owner'
export { PROPERTY_FIELDS, PROPERTY_LEGAL_FIELDS } from './property'

/** Look up a field by key from a list. */
export function findField(fields: readonly Field[], key: string): Field | undefined {
  return fields.find((f) => f.key === key)
}

/** Pick the client identity fields a template needs. */
export function pickClientIdentityFields(keys: readonly IdentityFieldKey[]): readonly Field[] {
  return CLIENT_IDENTITY_FIELDS.filter((f) => keys.includes(f.key as IdentityFieldKey))
}

/** Pick the owner identity fields a template needs. */
export function pickOwnerIdentityFields(keys: readonly IdentityFieldKey[]): readonly Field[] {
  return OWNER_IDENTITY_FIELDS.filter((f) => keys.includes(f.key as IdentityFieldKey))
}

/** All composed fields, in the right order. */
export function composeDocumentFields(args: {
  includeAgencyProfile: boolean
  includeClientFields: boolean
  includeOwnerFields: boolean
  includePropertyShort: boolean
  includePropertyLegal: boolean
  documentFields: readonly Field[]
}): readonly Field[] {
  const result: Field[] = []

  if (args.includeAgencyProfile) {
    result.push(...AGENCY_FIELDS, { key: 'agent_name', label: 'Agent responsabil', group: 'Agenție', type: 'text', required: true })
  }

  if (args.includeClientFields) {
    result.push(...CLIENT_IDENTITY_FIELDS)
  }
  if (args.includeOwnerFields) {
    result.push(...OWNER_IDENTITY_FIELDS)
  }
  if (args.includePropertyShort) {
    result.push(...PROPERTY_FIELDS)
  }
  if (args.includePropertyLegal) {
    result.push(...PROPERTY_LEGAL_FIELDS)
  }

  result.push(...args.documentFields)

  if (args.includeAgencyProfile) {
    result.push(...PRIVACY_FIELDS)
  }

  return result
}
