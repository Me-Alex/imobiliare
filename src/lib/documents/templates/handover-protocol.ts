/**
 * Handover protocol (proces-verbal de predare-primire).
 *
 * Final step. Sets state, defects, photos, meter readings, inventory, keys.
 * Doesn't require agency profile (it's a private agreement between owner and client).
 */

import type { DocumentTemplate } from '../types'

export const handoverProtocolTemplate: DocumentTemplate = {
  kind: 'handover_protocol',
  title: 'Proces-verbal de predare-primire și inventar',
  shortTitle: 'Predare-primire',
  description: 'Fixează starea, defectele, fotografiile, contoarele, inventarul și cheile.',
  stage: 'HANDOVER',
  signature: 'ADVANCED_OR_QUALIFIED',
  consumerWithdrawalRequired: false,
  requiresAgencyProfile: false,
  order: 6,
  participants: [
    { role: 'CLIENT', identityFields: ['fullName', 'idDocument'], required: true },
    { role: 'OWNER', identityFields: ['fullName', 'idDocument'], required: true },
  ],
  fields: [
    { key: 'rental_contract_date', label: 'Data contractului de închiriere', group: 'Referință', type: 'date', required: true },
    { key: 'property_address', label: 'Adresa imobilului', group: 'Proprietate', type: 'textarea', required: true, source: { type: 'identity', path: 'property', key: 'address' } },
    { key: 'property_cadastral', label: 'Număr cadastral / carte funciară', group: 'Proprietate', type: 'text', required: true, source: { type: 'identity', path: 'property', key: 'cadastralNumber' } },
    { key: 'handover_date_time', label: 'Data și ora predării', group: 'Predare', type: 'datetime-local', required: true },
    { key: 'property_condition', label: 'Starea generală', group: 'Stare', type: 'textarea', required: true },
    { key: 'existing_defects', label: 'Defecte și uzură existente', group: 'Stare', type: 'textarea', required: true },
    { key: 'photo_evidence_reference', label: 'Referință fotografii', group: 'Stare', type: 'text', required: true },
    { key: 'electricity_meter', label: 'Electricitate – serie/index', group: 'Contoare', type: 'text', required: true },
    { key: 'gas_meter', label: 'Gaz – serie/index', group: 'Contoare', type: 'text', required: true },
    { key: 'cold_water_meter', label: 'Apă rece – serie/index', group: 'Contoare', type: 'text', required: true },
    { key: 'hot_water_meter', label: 'Apă caldă – serie/index', group: 'Contoare', type: 'text', required: true },
    { key: 'other_meters', label: 'Alte contoare', group: 'Contoare', type: 'text', required: true },
    { key: 'keys_and_access_devices', label: 'Chei și dispozitive predate', group: 'Acces', type: 'textarea', required: true },
    { key: 'remaining_key_holders', label: 'Duplicate rămase', group: 'Acces', type: 'text', required: true },
    { key: 'inventory', label: 'Inventar detaliat', group: 'Inventar', type: 'textarea', required: true },
    { key: 'delivered_documents', label: 'Documente/manuale predate', group: 'Inventar', type: 'textarea', required: true },
    { key: 'handover_payments', label: 'Sume confirmate la predare', group: 'Inventar', type: 'textarea', required: true },
    { key: 'notes', label: 'Observații', group: 'Inventar', type: 'textarea', required: false },
  ],
} as const
