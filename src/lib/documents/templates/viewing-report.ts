/**
 * Viewing report (fișă de vizionare).
 *
 * Confirms a viewing happened. Simple signature. Triggered by staff after
 * check-in + completion of a vizionare.
 */

import type { DocumentTemplate } from '../types'

export const viewingReportTemplate: DocumentTemplate = {
  kind: 'viewing_report',
  title: 'Fișă de vizionare și confirmare de prezentare',
  shortTitle: 'Fișă de vizionare',
  description: 'Confirmă vizionarea fără să creeze singură o obligație de comision.',
  stage: 'VIEWING',
  signature: 'SIMPLE',
  consumerWithdrawalRequired: false,
  requiresAgencyProfile: true,
  order: 1,
  participants: [
    { role: 'CLIENT', identityFields: ['fullName', 'idDocument', 'address', 'email', 'phone'], required: true },
    { role: 'OWNER', identityFields: [], required: false },
  ],
  fields: [
    { key: 'viewing_date', label: 'Data vizionării', group: 'Vizionare', type: 'date', required: true },
    { key: 'viewing_time', label: 'Interval orar', group: 'Vizionare', type: 'text', required: true },
    { key: 'actual_check_in_at', label: 'Prezență confirmată la', group: 'Vizionare', type: 'datetime-local', required: true, readOnly: true },
    { key: 'actual_completed_at', label: 'Vizionare finalizată la', group: 'Vizionare', type: 'datetime-local', required: true, readOnly: true },
    { key: 'notes', label: 'Observații', group: 'Vizionare', type: 'textarea', required: false, placeholder: 'Fără observații.' },
  ],
} as const
