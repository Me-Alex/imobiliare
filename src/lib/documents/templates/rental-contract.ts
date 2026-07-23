/**
 * Rental contract (contract de închiriere).
 *
 * Includes use, rent, deposit, repairs, termination, fiscal obligations.
 * Both client and owner involved. ADVANCED_OR_QUALIFIED signature.
 */

import type { DocumentTemplate } from '../types'

export const rentalContractTemplate: DocumentTemplate = {
  kind: 'rental_contract',
  title: 'Contract de închiriere a locuinței',
  shortTitle: 'Contract de închiriere',
  description: 'Include folosința, chiria, garanția, reparațiile, încetarea și obligația fiscală.',
  stage: 'CONTRACT',
  signature: 'ADVANCED_OR_QUALIFIED',
  consumerWithdrawalRequired: false,
  requiresAgencyProfile: true,
  order: 5,
  participants: [
    { role: 'CLIENT', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
    { role: 'OWNER', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone', 'paymentAccount'], required: true },
  ],
  fields: [
    { key: 'property_description', label: 'Descriere și dependințe', group: 'Proprietate', type: 'textarea', required: true },
    { key: 'ownership_title', label: 'Titlul locatorului', group: 'Proprietate', type: 'text', required: true, source: { type: 'identity', path: 'property', key: 'ownershipTitle' } },
    { key: 'property_encumbrances', label: 'Sarcini/limitări relevante', group: 'Proprietate', type: 'textarea', required: true, source: { type: 'identity', path: 'property', key: 'encumbrances' } },
    { key: 'rental_purpose', label: 'Destinație', group: 'Folosință', type: 'text', required: true, placeholder: 'locuință' },
    { key: 'occupants', label: 'Persoane care vor locui', group: 'Folosință', type: 'textarea', required: true },
    { key: 'pets_policy', label: 'Reguli animale de companie', group: 'Folosință', type: 'text', required: true },
    { key: 'lease_start_date', label: 'Început', group: 'Durată', type: 'date', required: true },
    { key: 'lease_end_date', label: 'Sfârșit', group: 'Durată', type: 'date', required: true },
    { key: 'handover_date', label: 'Data predării', group: 'Durată', type: 'date', required: true },
    { key: 'rent_amount', label: 'Chirie lunară', group: 'Plăți', type: 'text', required: true },
    {
      key: 'currency', label: 'Monedă', group: 'Plăți', type: 'select', required: true,
      options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }],
    },
    { key: 'rent_due_day', label: 'Ziua scadenței', group: 'Plăți', type: 'number', required: true, validation: { min: 1, max: 31 } },
    { key: 'rent_payment_method', label: 'Metoda de plată', group: 'Plăți', type: 'text', required: true },
    { key: 'exchange_rate_rule', label: 'Regula cursului valutar', group: 'Plăți', type: 'text', required: true },
    { key: 'rent_adjustment_rule', label: 'Regula de modificare a chiriei', group: 'Plăți', type: 'textarea', required: true },
    { key: 'deposit_amount', label: 'Garanție', group: 'Garanție', type: 'text', required: true },
    { key: 'deposit_return_term', label: 'Termen restituire garanție', group: 'Garanție', type: 'text', required: true },
    { key: 'tenant_costs', label: 'Cheltuieli locatar', group: 'Cheltuieli', type: 'textarea', required: true },
    { key: 'landlord_costs', label: 'Cheltuieli locator', group: 'Cheltuieli', type: 'textarea', required: true },
    { key: 'inspection_notice', label: 'Preaviz pentru acces', group: 'Încetare', type: 'text', required: true },
    { key: 'termination_notice', label: 'Preaviz încetare', group: 'Încetare', type: 'text', required: true },
    { key: 'fiscal_registration_due_date', label: 'Termen orientativ înregistrare fiscală', group: 'Conformitate', type: 'date', required: true, readOnly: true },
  ],
} as const
