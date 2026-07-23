/**
 * Owner identity fields.
 *
 * Filled once, reused across every document the owner signs.
 */

import type { Field } from '../types'

export const OWNER_IDENTITY_FIELDS: readonly Field[] = [
  { key: 'owner_name', label: 'Nume complet proprietar/locator', group: 'Proprietar', type: 'text', required: true, source: { type: 'identity', path: 'owner', key: 'fullName' } },
  { key: 'owner_id_document', label: 'Act identitate (tip, serie, număr, emitent)', group: 'Proprietar', type: 'text', required: true, source: { type: 'identity', path: 'owner', key: 'idDocument' } },
  { key: 'owner_address', label: 'Domiciliu/sediu', group: 'Proprietar', type: 'textarea', required: true, source: { type: 'identity', path: 'owner', key: 'address' } },
  { key: 'owner_email', label: 'E-mail', group: 'Proprietar', type: 'email', required: true, source: { type: 'identity', path: 'owner', key: 'email' } },
  { key: 'owner_phone', label: 'Telefon', group: 'Proprietar', type: 'tel', required: true, source: { type: 'identity', path: 'owner', key: 'phone' } },
  { key: 'owner_payment_account', label: 'Cont/modalitate încasare', group: 'Proprietar', type: 'text', required: false, source: { type: 'identity', path: 'owner', key: 'paymentAccount' } },
] as const
