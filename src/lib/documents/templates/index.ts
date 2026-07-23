/**
 * Document template registry.
 *
 * One place to look up any template by kind, list them in flow order, or
 * get the list of templates a participant can start.
 *
 * To add a new document kind:
 *   1. Add the kind to `DocumentKind` in types.ts
 *   2. Create a new file in this directory
 *   3. Register it below
 */

import type { DocumentKind, DocumentTemplate, TransactionStage } from '../types'
import { viewingReportTemplate } from './viewing-report'
import { brokerageAgreementTemplate } from './brokerage-agreement'
import { ownerMandateTemplate } from './owner-mandate'
import { reservationOfferTemplate } from './reservation-offer'
import { rentalContractTemplate } from './rental-contract'
import { handoverProtocolTemplate } from './handover-protocol'

export const TEMPLATES: Record<DocumentKind, DocumentTemplate> = {
  viewing_report: viewingReportTemplate,
  brokerage_agreement: brokerageAgreementTemplate,
  owner_mandate: ownerMandateTemplate,
  reservation_offer: reservationOfferTemplate,
  rental_contract: rentalContractTemplate,
  handover_protocol: handoverProtocolTemplate,
}

/** All templates, ordered as they appear in a typical transaction. */
export const TEMPLATES_IN_ORDER: readonly DocumentTemplate[] = Object.values(TEMPLATES)
  .slice()
  .sort((a, b) => a.order - b.order)

/** Look up a template by kind. */
export function getTemplate(kind: DocumentKind): DocumentTemplate {
  return TEMPLATES[kind]
}

/** Templates a participant can start, filtered by their role. */
export function getStartableTemplatesForRole(
  role: 'CLIENT' | 'OWNER',
  currentStage: TransactionStage,
): readonly DocumentTemplate[] {
  return TEMPLATES_IN_ORDER.filter(
    (t) => t.stage === currentStage && t.participants.some((p) => p.role === role && p.required),
  )
}
