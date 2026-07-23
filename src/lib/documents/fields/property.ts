/**
 * Property fields. Two flavors:
 *   - PROPERTY_FIELDS         — short form (used for short contracts)
 *   - PROPERTY_LEGAL_FIELDS   — full legal form (used for mandates, contracts)
 *
 * Sourced from the property's legal identity; the form just confirms they're current.
 */

import type { Field } from '../types'

export const PROPERTY_FIELDS: readonly Field[] = [
  { key: 'property_title', label: 'Denumire proprietate', group: 'Proprietate', type: 'text', required: true, source: { type: 'identity', path: 'property', key: 'title' } },
  { key: 'property_reference', label: 'Cod intern/anunț', group: 'Proprietate', type: 'text', required: true, helpText: 'Codul intern al anunțului. Confirmă că este corect.' },
  { key: 'property_address', label: 'Adresa completă', group: 'Proprietate', type: 'textarea', required: true, source: { type: 'identity', path: 'property', key: 'address' } },
] as const

export const PROPERTY_LEGAL_FIELDS: readonly Field[] = [
  { key: 'property_title', label: 'Denumire proprietate', group: 'Proprietate', type: 'text', required: true, source: { type: 'identity', path: 'property', key: 'title' } },
  { key: 'property_address', label: 'Adresa completă', group: 'Proprietate', type: 'textarea', required: true, source: { type: 'identity', path: 'property', key: 'address' } },
  { key: 'property_cadastral', label: 'Număr cadastral / carte funciară', group: 'Proprietate', type: 'text', required: true, source: { type: 'identity', path: 'property', key: 'cadastralNumber' } },
] as const
