/**
 * Owner mandate (mandat de intermediere) — owner side.
 *
 * Sets the scope of the mandate, marketing channels, exclusivity, commission.
 * ADVANCED_OR_QUALIFIED signature, 14-day cooling-off period.
 */

import type { DocumentTemplate } from '../types'

export const ownerMandateTemplate: DocumentTemplate = {
  kind: 'owner_mandate',
  title: 'Contract de intermediere și mandat – proprietar',
  shortTitle: 'Mandat proprietar',
  description: 'Stabilește limitele mandatului, promovarea, exclusivitatea și comisionul.',
  stage: 'NEGOTIATION',
  signature: 'ADVANCED_OR_QUALIFIED',
  consumerWithdrawalRequired: true,
  requiresAgencyProfile: true,
  order: 3,
  participants: [
    { role: 'CLIENT', identityFields: [], required: false },
    { role: 'OWNER', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
  ],
  fields: [
    { key: 'ownership_title', label: 'Titlul proprietarului', group: 'Proprietate', type: 'text', required: true, placeholder: 'Contract de vânzare nr... / certificat moștenitor...', source: { type: 'identity', path: 'property', key: 'ownershipTitle' } },
    { key: 'property_encumbrances', label: 'Sarcini, litigii, coproprietari', group: 'Proprietate', type: 'textarea', required: true, placeholder: 'Nu sunt cunoscute / descriere completă', source: { type: 'identity', path: 'property', key: 'encumbrances' } },
    {
      key: 'transaction_type', label: 'Tip tranzacție', group: 'Mandat', type: 'select', required: true,
      options: [{ value: 'vânzare', label: 'Vânzare' }, { value: 'închiriere', label: 'Închiriere' }],
    },
    { key: 'asking_price', label: 'Preț/chirie solicitat(ă)', group: 'Mandat', type: 'text', required: true },
    {
      key: 'currency', label: 'Monedă', group: 'Mandat', type: 'select', required: true,
      options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }],
    },
    { key: 'contract_start_date', label: 'Data începerii', group: 'Mandat', type: 'date', required: true },
    { key: 'contract_end_date', label: 'Data încetării', group: 'Mandat', type: 'date', required: true },
    {
      key: 'exclusivity_type', label: 'Caracter', group: 'Mandat', type: 'select', required: true,
      options: [{ value: 'neexclusiv', label: 'Neexclusiv' }, { value: 'exclusiv', label: 'Exclusiv' }],
    },
    { key: 'marketing_channels', label: 'Canale de promovare aprobate', group: 'Mandat', type: 'textarea', required: true },
    { key: 'commission_value', label: 'Comision', group: 'Comision', type: 'text', required: true },
    { key: 'commission_unit', label: 'Unitate comision', group: 'Comision', type: 'text', required: true },
    { key: 'vat_treatment', label: 'TVA', group: 'Comision', type: 'text', required: true },
    { key: 'commission_due_event', label: 'Eveniment de exigibilitate', group: 'Comision', type: 'textarea', required: true },
    { key: 'commission_payment_term', label: 'Termen de plată', group: 'Comision', type: 'text', required: true },
    { key: 'commission_example', label: 'Exemplu valoric total', group: 'Comision', type: 'text', required: true },
    { key: 'termination_notice', label: 'Preaviz', group: 'Încetare', type: 'text', required: true },
    { key: 'protection_period', label: 'Perioadă de protecție', group: 'Încetare', type: 'text', required: true },
  ],
} as const
