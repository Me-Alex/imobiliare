/**
 * Client identity fields.
 *
 * These are filled once on the participant's identity profile and reused
 * across every document the client signs. The template only needs to
 * reference which keys it consumes.
 */

import type { Field } from '../types'

export const CLIENT_IDENTITY_FIELDS: readonly Field[] = [
  { key: 'client_name', label: 'Nume complet client/locatar', group: 'Client', type: 'text', required: true, source: { type: 'identity', path: 'client', key: 'fullName' } },
  { key: 'client_id_document', label: 'Act identitate (tip, serie, număr, emitent)', group: 'Client', type: 'text', required: true, placeholder: 'CI seria XX nr. 000000, emisă de...', source: { type: 'identity', path: 'client', key: 'idDocument' } },
  { key: 'client_address', label: 'Domiciliu', group: 'Client', type: 'textarea', required: true, source: { type: 'identity', path: 'client', key: 'address' } },
  { key: 'client_email', label: 'E-mail', group: 'Client', type: 'email', required: true, source: { type: 'identity', path: 'client', key: 'email' } },
  { key: 'client_phone', label: 'Telefon', group: 'Client', type: 'tel', required: true, source: { type: 'identity', path: 'client', key: 'phone' } },
] as const
