/**
 * Reservation offer (ofertă și acord de rezervare).
 *
 * Both client and owner are involved. Sets the offer, reservation amount,
 * custody, refund rules, due diligence deadline. ADVANCED_OR_QUALIFIED signature.
 */

import type { DocumentTemplate } from '../types'

export const reservationOfferTemplate: DocumentTemplate = {
  kind: 'reservation_offer',
  title: 'Ofertă și acord de rezervare',
  shortTitle: 'Ofertă / rezervare',
  description: 'Clarifică oferta, suma, custodia, restituirea și verificările prealabile.',
  stage: 'NEGOTIATION',
  signature: 'ADVANCED_OR_QUALIFIED',
  consumerWithdrawalRequired: false,
  requiresAgencyProfile: true,
  order: 4,
  participants: [
    { role: 'CLIENT', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
    { role: 'OWNER', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
  ],
  fields: [
    { key: 'offered_price', label: 'Preț/chirie oferit(ă)', group: 'Ofertă', type: 'text', required: true },
    {
      key: 'currency', label: 'Monedă', group: 'Ofertă', type: 'select', required: true,
      options: [{ value: 'EUR', label: 'EUR' }, { value: 'RON', label: 'RON' }],
    },
    { key: 'offer_conditions', label: 'Condiții esențiale', group: 'Ofertă', type: 'textarea', required: true },
    { key: 'offer_valid_until', label: 'Valabilă până la', group: 'Ofertă', type: 'datetime-local', required: true },
    { key: 'reservation_amount', label: 'Suma de rezervare', group: 'Rezervare', type: 'text', required: true },
    { key: 'reservation_payment_method', label: 'Metoda de plată', group: 'Rezervare', type: 'text', required: true },
    { key: 'reservation_holder', label: 'Cine păstrează suma', group: 'Rezervare', type: 'text', required: true },
    { key: 'reservation_legal_nature', label: 'Natura și destinația sumei', group: 'Rezervare', type: 'textarea', required: true },
    { key: 'refund_conditions', label: 'Cazuri de restituire integrală', group: 'Rezervare', type: 'textarea', required: true },
    { key: 'retention_conditions', label: 'Cazuri permise de reținere', group: 'Rezervare', type: 'textarea', required: true },
    { key: 'due_diligence_deadline', label: 'Termen verificări', group: 'Verificări', type: 'date', required: true },
    { key: 'notary_or_lawyer', label: 'Notar/avocat desemnat', group: 'Verificări', type: 'text', required: true },
    { key: 'reservation_end_event', label: 'Eveniment de încetare', group: 'Încetare', type: 'textarea', required: true },
  ],
} as const
