/**
 * Agency fields. Read-only — filled from the agency's legal profile.
 * Used in any document that needs to identify the agency as a contracting party.
 */

import type { Field } from '../types'

export const AGENCY_FIELDS: readonly Field[] = [
  { key: 'agency_legal_name', label: 'Denumirea juridică', group: 'Agenție', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'legalName' } },
  { key: 'agency_cui', label: 'CUI/CIF', group: 'Agenție', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'cui' } },
  { key: 'agency_trade_registry', label: 'Nr. Registrul Comerțului', group: 'Agenție', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'tradeRegistryNumber' } },
  { key: 'agency_registered_office', label: 'Sediul social', group: 'Agenție', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'registeredOffice' } },
  { key: 'agency_email', label: 'E-mail agenție', group: 'Agenție', type: 'email', required: true, readOnly: true, source: { type: 'agency', key: 'email' } },
  { key: 'agency_phone', label: 'Telefon agenție', group: 'Agenție', type: 'tel', required: true, readOnly: true, source: { type: 'agency', key: 'phone' } },
  { key: 'agency_representative', label: 'Reprezentant legal', group: 'Agenție', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'representative' } },
] as const

/** GDPR informare. Comes from the agency legal profile. */
export const PRIVACY_FIELDS: readonly Field[] = [
  { key: 'privacy_notice_url', label: 'Informare GDPR', group: 'Conformitate', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'privacyNoticeUrl' } },
  { key: 'privacy_notice_version', label: 'Versiune informare GDPR', group: 'Conformitate', type: 'text', required: true, readOnly: true, source: { type: 'agency', key: 'privacyNoticeVersion' } },
] as const
