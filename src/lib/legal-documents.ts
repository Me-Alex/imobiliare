import type { ViewingDocumentType } from '@/lib/types'

export type LegalDocumentKind =
  | 'viewing_report'
  | 'brokerage_agreement'
  | 'owner_mandate'
  | 'reservation_offer'
  | 'rental_contract'
  | 'handover_protocol'

export type LegalSignatureRequirement = 'SIMPLE' | 'ADVANCED_OR_QUALIFIED' | 'QUALIFIED'

export interface LegalDocumentField {
  key: string
  label: string
  group: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select'
  required?: boolean
  readOnly?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

export interface LegalDocumentDefinition {
  kind: LegalDocumentKind
  templateType: string
  documentType: ViewingDocumentType
  title: string
  shortTitle: string
  description: string
  signatureRequirement: LegalSignatureRequirement
  consumerWithdrawalRequired: boolean
  requiresAgencyProfile: boolean
  fields: LegalDocumentField[]
}

const agencyFields: LegalDocumentField[] = [
  { key: 'agency_legal_name', label: 'Denumirea juridică', group: 'Agenție', required: true, readOnly: true },
  { key: 'agency_cui', label: 'CUI/CIF', group: 'Agenție', required: true, readOnly: true },
  { key: 'agency_trade_registry', label: 'Nr. Registrul Comerțului', group: 'Agenție', required: true, readOnly: true },
  { key: 'agency_registered_office', label: 'Sediul social', group: 'Agenție', required: true, readOnly: true },
  { key: 'agency_email', label: 'E-mail agenție', group: 'Agenție', type: 'email', required: true, readOnly: true },
  { key: 'agency_phone', label: 'Telefon agenție', group: 'Agenție', type: 'tel', required: true, readOnly: true },
  { key: 'agency_representative', label: 'Reprezentant legal', group: 'Agenție', required: true, readOnly: true },
]

const privacyFields: LegalDocumentField[] = [
  { key: 'privacy_notice_url', label: 'Informare GDPR', group: 'Conformitate', required: true, readOnly: true },
  { key: 'privacy_notice_version', label: 'Versiune informare GDPR', group: 'Conformitate', required: true, readOnly: true },
]

const clientFields: LegalDocumentField[] = [
  { key: 'client_name', label: 'Nume complet client/locatar', group: 'Client', required: true },
  { key: 'client_id_document', label: 'Act identitate (tip, serie, număr, emitent)', group: 'Client', required: true, placeholder: 'CI seria XX nr. 000000, emisă de...' },
  { key: 'client_address', label: 'Domiciliu', group: 'Client', required: true },
  { key: 'client_email', label: 'E-mail', group: 'Client', type: 'email', required: true },
  { key: 'client_phone', label: 'Telefon', group: 'Client', type: 'tel', required: true },
]

const ownerFields: LegalDocumentField[] = [
  { key: 'owner_name', label: 'Nume complet proprietar/locator', group: 'Proprietar', required: true },
  { key: 'owner_id_document', label: 'Act identitate (tip, serie, număr, emitent)', group: 'Proprietar', required: true },
  { key: 'owner_address', label: 'Domiciliu/sediu', group: 'Proprietar', required: true },
  { key: 'owner_email', label: 'E-mail', group: 'Proprietar', type: 'email', required: true },
  { key: 'owner_phone', label: 'Telefon', group: 'Proprietar', type: 'tel', required: true },
]

const propertyFields: LegalDocumentField[] = [
  { key: 'property_title', label: 'Denumire proprietate', group: 'Proprietate', required: true },
  { key: 'property_reference', label: 'Cod intern/anunț', group: 'Proprietate', required: true },
  { key: 'property_address', label: 'Adresa completă', group: 'Proprietate', required: true },
]

const propertyLegalFields: LegalDocumentField[] = [
  { key: 'property_title', label: 'Denumire proprietate', group: 'Proprietate', required: true },
  { key: 'property_address', label: 'Adresa completă', group: 'Proprietate', required: true },
  { key: 'property_cadastral', label: 'Număr cadastral / carte funciară', group: 'Proprietate', required: true },
]

function definition(value: LegalDocumentDefinition): LegalDocumentDefinition {
  return value
}

export const LEGAL_DOCUMENT_DEFINITIONS: Record<LegalDocumentKind, LegalDocumentDefinition> = {
  viewing_report: definition({
    kind: 'viewing_report',
    templateType: 'viewing_report',
    documentType: 'vizionare_sign',
    title: 'Fișă de vizionare și confirmare de prezentare',
    shortTitle: 'Fișă de vizionare',
    description: 'Confirmă vizionarea fără să creeze singură o obligație de comision.',
    signatureRequirement: 'SIMPLE',
    consumerWithdrawalRequired: false,
    requiresAgencyProfile: true,
    fields: [
      ...agencyFields,
      { key: 'agent_name', label: 'Agent responsabil', group: 'Agenție', required: true },
      ...clientFields,
      ...propertyFields,
      { key: 'viewing_date', label: 'Data vizionării', group: 'Vizionare', type: 'date', required: true },
      { key: 'viewing_time', label: 'Interval orar', group: 'Vizionare', required: true },
      { key: 'actual_check_in_at', label: 'Prezență confirmată la', group: 'Vizionare', required: true, readOnly: true },
      { key: 'actual_completed_at', label: 'Vizionare finalizată la', group: 'Vizionare', required: true, readOnly: true },
      { key: 'notes', label: 'Observații', group: 'Vizionare', type: 'textarea', placeholder: 'Fără observații.' },
      ...privacyFields,
    ],
  }),
  brokerage_agreement: definition({
    kind: 'brokerage_agreement',
    templateType: 'brokerage_agreement',
    documentType: 'brokerage_contract',
    title: 'Contract de intermediere imobiliară – client',
    shortTitle: 'Intermediere client',
    description: 'Definește serviciile, comisionul, exigibilitatea și drepturile consumatorului.',
    signatureRequirement: 'ADVANCED_OR_QUALIFIED',
    consumerWithdrawalRequired: true,
    requiresAgencyProfile: true,
    fields: [
      ...agencyFields,
      ...clientFields,
      ...propertyFields,
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
      { key: 'commission_value', label: 'Comision', group: 'Comision', required: true, placeholder: '3 sau 1500' },
      {
        key: 'commission_unit', label: 'Unitate', group: 'Comision', type: 'select', required: true,
        options: [{ value: '% din prețul tranzacției', label: '% din tranzacție' }, { value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }],
      },
      { key: 'vat_treatment', label: 'TVA', group: 'Comision', required: true, placeholder: 'se adaugă TVA conform cotei legale / este inclus' },
      { key: 'commission_example', label: 'Exemplu valoric total', group: 'Comision', required: true },
      { key: 'commission_due_event', label: 'Evenimentul care face comisionul datorat', group: 'Comision', type: 'textarea', required: true },
      { key: 'commission_payment_term', label: 'Termen de plată', group: 'Comision', required: true },
      { key: 'protection_period', label: 'Perioadă de protecție', group: 'Încetare', required: true, placeholder: '30 de zile pentru imobilele identificate în anexă' },
      { key: 'termination_notice', label: 'Preaviz', group: 'Încetare', required: true },
      ...privacyFields,
    ],
  }),
  owner_mandate: definition({
    kind: 'owner_mandate',
    templateType: 'owner_mandate',
    documentType: 'owner_mandate',
    title: 'Contract de intermediere și mandat – proprietar',
    shortTitle: 'Mandat proprietar',
    description: 'Stabilește limitele mandatului, promovarea, exclusivitatea și comisionul.',
    signatureRequirement: 'ADVANCED_OR_QUALIFIED',
    consumerWithdrawalRequired: true,
    requiresAgencyProfile: true,
    fields: [
      ...agencyFields,
      ...ownerFields,
      ...propertyLegalFields,
      { key: 'ownership_title', label: 'Titlul proprietarului', group: 'Proprietate', required: true, placeholder: 'Contract de vânzare nr... / certificat moștenitor...' },
      { key: 'property_encumbrances', label: 'Sarcini, litigii, coproprietari', group: 'Proprietate', type: 'textarea', required: true, placeholder: 'Nu sunt cunoscute / descriere completă' },
      {
        key: 'transaction_type', label: 'Tip tranzacție', group: 'Mandat', type: 'select', required: true,
        options: [{ value: 'vânzare', label: 'Vânzare' }, { value: 'închiriere', label: 'Închiriere' }],
      },
      { key: 'asking_price', label: 'Preț/chirie solicitat(ă)', group: 'Mandat', required: true },
      { key: 'currency', label: 'Monedă', group: 'Mandat', type: 'select', required: true, options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }] },
      { key: 'contract_start_date', label: 'Data începerii', group: 'Mandat', type: 'date', required: true },
      { key: 'contract_end_date', label: 'Data încetării', group: 'Mandat', type: 'date', required: true },
      { key: 'exclusivity_type', label: 'Caracter', group: 'Mandat', type: 'select', required: true, options: [{ value: 'neexclusiv', label: 'Neexclusiv' }, { value: 'exclusiv', label: 'Exclusiv' }] },
      { key: 'marketing_channels', label: 'Canale de promovare aprobate', group: 'Mandat', type: 'textarea', required: true },
      { key: 'commission_value', label: 'Comision', group: 'Comision', required: true },
      { key: 'commission_unit', label: 'Unitate comision', group: 'Comision', required: true },
      { key: 'vat_treatment', label: 'TVA', group: 'Comision', required: true },
      { key: 'commission_due_event', label: 'Eveniment de exigibilitate', group: 'Comision', type: 'textarea', required: true },
      { key: 'commission_payment_term', label: 'Termen de plată', group: 'Comision', required: true },
      { key: 'commission_example', label: 'Exemplu valoric total', group: 'Comision', required: true },
      { key: 'termination_notice', label: 'Preaviz', group: 'Încetare', required: true },
      { key: 'protection_period', label: 'Perioadă de protecție', group: 'Încetare', required: true },
      ...privacyFields,
    ],
  }),
  reservation_offer: definition({
    kind: 'reservation_offer',
    templateType: 'reservation_offer',
    documentType: 'reservation_offer',
    title: 'Ofertă și acord de rezervare',
    shortTitle: 'Ofertă / rezervare',
    description: 'Clarifică oferta, suma, custodia, restituirea și verificările prealabile.',
    signatureRequirement: 'ADVANCED_OR_QUALIFIED',
    consumerWithdrawalRequired: false,
    requiresAgencyProfile: true,
    fields: [
      ...clientFields,
      ...ownerFields,
      ...propertyLegalFields,
      { key: 'offered_price', label: 'Preț/chirie oferit(ă)', group: 'Ofertă', required: true },
      { key: 'currency', label: 'Monedă', group: 'Ofertă', type: 'select', required: true, options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }] },
      { key: 'offer_conditions', label: 'Condiții esențiale', group: 'Ofertă', type: 'textarea', required: true },
      { key: 'offer_valid_until', label: 'Valabilă până la', group: 'Ofertă', type: 'datetime-local', required: true },
      { key: 'reservation_amount', label: 'Suma de rezervare', group: 'Rezervare', required: true },
      { key: 'reservation_payment_method', label: 'Metoda de plată', group: 'Rezervare', required: true },
      { key: 'reservation_holder', label: 'Cine păstrează suma', group: 'Rezervare', required: true },
      { key: 'reservation_legal_nature', label: 'Natura și destinația sumei', group: 'Rezervare', type: 'textarea', required: true },
      { key: 'refund_conditions', label: 'Cazuri de restituire integrală', group: 'Rezervare', type: 'textarea', required: true },
      { key: 'retention_conditions', label: 'Cazuri permise de reținere', group: 'Rezervare', type: 'textarea', required: true },
      { key: 'due_diligence_deadline', label: 'Termen verificări', group: 'Verificări', type: 'date', required: true },
      { key: 'notary_or_lawyer', label: 'Notar/avocat desemnat', group: 'Verificări', required: true },
      { key: 'reservation_end_event', label: 'Eveniment de încetare', group: 'Încetare', type: 'textarea', required: true },
      ...privacyFields,
    ],
  }),
  rental_contract: definition({
    kind: 'rental_contract',
    templateType: 'rental_contract',
    documentType: 'rental_contract',
    title: 'Contract de închiriere a locuinței',
    shortTitle: 'Contract de închiriere',
    description: 'Include folosința, chiria, garanția, reparațiile, încetarea și obligația fiscală.',
    signatureRequirement: 'ADVANCED_OR_QUALIFIED',
    consumerWithdrawalRequired: false,
    requiresAgencyProfile: true,
    fields: [
      ...ownerFields,
      { key: 'owner_payment_account', label: 'Cont/modalitate încasare locator', group: 'Proprietar', required: true },
      ...clientFields,
      ...propertyLegalFields,
      { key: 'property_description', label: 'Descriere și dependințe', group: 'Proprietate', type: 'textarea', required: true },
      { key: 'ownership_title', label: 'Titlul locatorului', group: 'Proprietate', required: true },
      { key: 'property_encumbrances', label: 'Sarcini/limitări relevante', group: 'Proprietate', type: 'textarea', required: true },
      { key: 'rental_purpose', label: 'Destinație', group: 'Folosință', required: true, placeholder: 'locuință' },
      { key: 'occupants', label: 'Persoane care vor locui', group: 'Folosință', type: 'textarea', required: true },
      { key: 'pets_policy', label: 'Reguli animale de companie', group: 'Folosință', required: true },
      { key: 'lease_start_date', label: 'Început', group: 'Durată', type: 'date', required: true },
      { key: 'lease_end_date', label: 'Sfârșit', group: 'Durată', type: 'date', required: true },
      { key: 'handover_date', label: 'Data predării', group: 'Durată', type: 'date', required: true },
      { key: 'rent_amount', label: 'Chirie lunară', group: 'Plăți', required: true },
      { key: 'currency', label: 'Monedă', group: 'Plăți', type: 'select', required: true, options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }] },
      { key: 'rent_due_day', label: 'Ziua scadenței', group: 'Plăți', type: 'number', required: true },
      { key: 'rent_payment_method', label: 'Metoda de plată', group: 'Plăți', required: true },
      { key: 'exchange_rate_rule', label: 'Regula cursului valutar', group: 'Plăți', required: true },
      { key: 'rent_adjustment_rule', label: 'Regula de modificare a chiriei', group: 'Plăți', type: 'textarea', required: true },
      { key: 'deposit_amount', label: 'Garanție', group: 'Garanție', required: true },
      { key: 'deposit_return_term', label: 'Termen restituire garanție', group: 'Garanție', required: true },
      { key: 'tenant_costs', label: 'Cheltuieli locatar', group: 'Cheltuieli', type: 'textarea', required: true },
      { key: 'landlord_costs', label: 'Cheltuieli locator', group: 'Cheltuieli', type: 'textarea', required: true },
      { key: 'inspection_notice', label: 'Preaviz pentru acces', group: 'Încetare', required: true },
      { key: 'termination_notice', label: 'Preaviz încetare', group: 'Încetare', required: true },
      { key: 'fiscal_registration_due_date', label: 'Termen orientativ înregistrare fiscală', group: 'Conformitate', type: 'date', required: true, readOnly: true },
      ...privacyFields,
    ],
  }),
  handover_protocol: definition({
    kind: 'handover_protocol',
    templateType: 'handover_protocol',
    documentType: 'handover_protocol',
    title: 'Proces-verbal de predare-primire și inventar',
    shortTitle: 'Predare-primire',
    description: 'Fixează starea, defectele, fotografiile, contoarele, inventarul și cheile.',
    signatureRequirement: 'ADVANCED_OR_QUALIFIED',
    consumerWithdrawalRequired: false,
    requiresAgencyProfile: false,
    fields: [
      { key: 'rental_contract_date', label: 'Data contractului de închiriere', group: 'Referință', type: 'date', required: true },
      ...ownerFields.filter((field) => ['owner_name', 'owner_id_document'].includes(field.key)),
      ...clientFields.filter((field) => ['client_name', 'client_id_document'].includes(field.key)),
      { key: 'property_address', label: 'Adresa imobilului', group: 'Proprietate', required: true },
      { key: 'property_cadastral', label: 'Număr cadastral / carte funciară', group: 'Proprietate', required: true },
      { key: 'handover_date_time', label: 'Data și ora predării', group: 'Predare', type: 'datetime-local', required: true },
      { key: 'property_condition', label: 'Starea generală', group: 'Stare', type: 'textarea', required: true },
      { key: 'existing_defects', label: 'Defecte și uzură existente', group: 'Stare', type: 'textarea', required: true },
      { key: 'photo_evidence_reference', label: 'Referință fotografii', group: 'Stare', required: true },
      { key: 'electricity_meter', label: 'Electricitate – serie/index', group: 'Contoare', required: true },
      { key: 'gas_meter', label: 'Gaz – serie/index', group: 'Contoare', required: true },
      { key: 'cold_water_meter', label: 'Apă rece – serie/index', group: 'Contoare', required: true },
      { key: 'hot_water_meter', label: 'Apă caldă – serie/index', group: 'Contoare', required: true },
      { key: 'other_meters', label: 'Alte contoare', group: 'Contoare', required: true },
      { key: 'keys_and_access_devices', label: 'Chei și dispozitive predate', group: 'Acces', type: 'textarea', required: true },
      { key: 'remaining_key_holders', label: 'Duplicate rămase', group: 'Acces', required: true },
      { key: 'inventory', label: 'Inventar detaliat', group: 'Inventar', type: 'textarea', required: true },
      { key: 'delivered_documents', label: 'Documente/manuale predate', group: 'Inventar', type: 'textarea', required: true },
      { key: 'handover_payments', label: 'Sume confirmate la predare', group: 'Inventar', type: 'textarea', required: true },
      { key: 'notes', label: 'Observații', group: 'Inventar', type: 'textarea' },
    ],
  }),
}

export const LEGAL_DOCUMENT_ORDER: LegalDocumentKind[] = [
  'viewing_report',
  'brokerage_agreement',
  'owner_mandate',
  'reservation_offer',
  'rental_contract',
  'handover_protocol',
]

export type LegalDocumentRequestRole = 'CLIENT' | 'OWNER'

const CLIENT_IDENTITY_FIELDS = [
  'client_name', 'client_id_document', 'client_address', 'client_email', 'client_phone',
] as const
const OWNER_IDENTITY_FIELDS = [
  'owner_name', 'owner_id_document', 'owner_address', 'owner_email', 'owner_phone',
] as const

const LEGAL_REQUEST_FIELD_KEYS: Record<
  LegalDocumentRequestRole,
  Partial<Record<LegalDocumentKind, readonly string[]>>
> = {
  CLIENT: {
    brokerage_agreement: [
      ...CLIENT_IDENTITY_FIELDS,
      'transaction_type',
    ],
    reservation_offer: [
      ...CLIENT_IDENTITY_FIELDS,
      'offered_price', 'currency', 'offer_conditions', 'offer_valid_until',
    ],
    rental_contract: [
      ...CLIENT_IDENTITY_FIELDS,
      'rental_purpose', 'occupants', 'pets_policy',
    ],
  },
  OWNER: {
    owner_mandate: [
      ...OWNER_IDENTITY_FIELDS,
      'property_cadastral', 'ownership_title', 'property_encumbrances',
      'transaction_type', 'asking_price', 'currency', 'marketing_channels',
    ],
    reservation_offer: [
      ...OWNER_IDENTITY_FIELDS,
      'property_cadastral',
    ],
    rental_contract: [
      ...OWNER_IDENTITY_FIELDS,
      'owner_payment_account', 'property_cadastral', 'property_description',
      'ownership_title', 'property_encumbrances',
    ],
    handover_protocol: [
      'owner_name', 'owner_id_document', 'property_cadastral',
      'property_condition', 'existing_defects', 'photo_evidence_reference',
      'electricity_meter', 'gas_meter', 'cold_water_meter', 'hot_water_meter',
      'other_meters', 'keys_and_access_devices', 'remaining_key_holders',
      'inventory', 'delivered_documents', 'handover_payments', 'notes',
    ],
  },
}

export const LEGAL_REQUEST_REQUIRED_ROLES: Record<LegalDocumentKind, LegalDocumentRequestRole[]> = {
  viewing_report: [],
  brokerage_agreement: ['CLIENT'],
  owner_mandate: ['OWNER'],
  reservation_offer: ['CLIENT', 'OWNER'],
  rental_contract: ['CLIENT', 'OWNER'],
  handover_protocol: ['OWNER'],
}

export function getLegalRequestKindsForRole(role: LegalDocumentRequestRole): LegalDocumentKind[] {
  return LEGAL_DOCUMENT_ORDER.filter((kind) => Boolean(LEGAL_REQUEST_FIELD_KEYS[role][kind]))
}

export function getLegalRequestFields(
  kind: LegalDocumentKind,
  role: LegalDocumentRequestRole,
): LegalDocumentField[] {
  const keys = new Set(LEGAL_REQUEST_FIELD_KEYS[role][kind] || [])
  return LEGAL_DOCUMENT_DEFINITIONS[kind].fields.filter((field) => keys.has(field.key))
}

export function getLegalDocumentDefinition(kind: LegalDocumentKind): LegalDocumentDefinition {
  return LEGAL_DOCUMENT_DEFINITIONS[kind]
}
