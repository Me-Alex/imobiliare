/**
 * Brokerage agreement (contract de intermediere) — client side.
 *
 * Defines services, commission, due events. ADVANCED_OR_QUALIFIED signature,
 * 14-day cooling-off period for consumers.
 */

import type { DocumentTemplate } from '../types'

export const brokerageAgreementTemplate: DocumentTemplate = {
  kind: 'brokerage_agreement',
  title: 'Contract de intermediere imobiliară – client',
  shortTitle: 'Intermediere client',
  description: 'Definește serviciile, comisionul, exigibilitatea și drepturile consumatorului.',
  stage: 'NEGOTIATION',
  signature: 'ADVANCED_OR_QUALIFIED',
  consumerWithdrawalRequired: true,
  requiresAgencyProfile: true,
  order: 2,
  participants: [
    { role: 'CLIENT', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
    { role: 'OWNER', identityFields: [], required: false },
  ],
  fields: [
    {
      key: 'transaction_type', label: 'Tip tranzacție', group: 'Serviciu', type: 'select', required: true,
      options: [{ value: 'cumpărare', label: 'Cumpărare' }, { value: 'închiriere', label: 'Închiriere' }],
    },
    { key: 'contract_start_date', label: 'Data începerii', group: 'Serviciu', type: 'date', required: true },
    { key: 'contract_end_date', label: 'Data încetării', group: 'Serviciu', type: 'date', required: true },
    {
      key: 'exclusivity_type', label: 'Caracter', group: 'Serviciu', type: 'select', required: true,
      options: [{ value: 'neexclusiv', label: 'Neexclusiv' }, { value: 'exclusiv', label: 'Exclusiv' }],
    },
    { key: 'commission_value', label: 'Comision', group: 'Comision', type: 'text', required: true, placeholder: '3 sau 1500' },
    {
      key: 'commission_unit', label: 'Unitate', group: 'Comision', type: 'select', required: true,
      options: [
        { value: '% din prețul tranzacției', label: '% din tranzacție' },
        { value: 'EUR', label: 'EUR' },
        { value: 'RON', label: 'RON' },
      ],
    },
    { key: 'vat_treatment', label: 'TVA', group: 'Comision', type: 'text', required: true, placeholder: 'se adaugă TVA conform cotei legale / este inclus' },
    { key: 'commission_example', label: 'Exemplu valoric total', group: 'Comision', type: 'text', required: true },
    { key: 'commission_due_event', label: 'Evenimentul care face comisionul datorat', group: 'Comision', type: 'textarea', required: true },
    { key: 'commission_payment_term', label: 'Termen de plată', group: 'Comision', type: 'text', required: true },
    { key: 'protection_period', label: 'Perioadă de protecție', group: 'Încetare', type: 'text', required: true, placeholder: '30 de zile pentru imobilele identificate în anexă' },
    { key: 'termination_notice', label: 'Preaviz', group: 'Încetare', type: 'text', required: true },
  ],
} as const
