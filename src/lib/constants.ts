import type { StaffMember, DocTypeLabelMap } from './types'

// Document type labels
export const DOC_TYPE_LABELS: DocTypeLabelMap = {
  id_card: 'Carte de Identitate',
  proof_of_income: 'Adeverinta de Venit',
  vizionare_sign: 'Semnatura Vizionare',
  rental_contract: 'Contract de Inchiriere',
  other: 'Alt Document',
}

// Default staff members (hardcoded for MVP)
export const DEFAULT_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Maria Ionescu', email: 'maria@hqs.ro', phone: '+40 721 123 456', role: 'Agent Imobiliar', avatarInitials: 'MI', isActive: true },
  { id: 'staff-2', name: 'Alexandru Popa', email: 'alex@hqs.ro', phone: '+40 722 234 567', role: 'Agent Imobiliar', avatarInitials: 'AP', isActive: true },
  { id: 'staff-3', name: 'Elena Dumitrescu', email: 'elena@hqs.ro', phone: '+40 723 345 678', role: 'Consilier Imobiliar', avatarInitials: 'ED', isActive: true },
  { id: 'staff-4', name: 'Cristian Marinescu', email: 'cristian@hqs.ro', phone: '+40 724 456 789', role: 'Director Vanzari', avatarInitials: 'CM', isActive: true },
]