import type { AccountRole } from '@/lib/account-roles'

const ROLE_LABELS: Record<AccountRole, string> = {
  CLIENT: 'Client',
  OWNER: 'Proprietar',
  AGENT: 'Agent',
  ADMIN: 'Administrator',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activă',
  APPROVED: 'Aprobat',
  ARCHIVED: 'Arhivat',
  CANCELLED: 'Anulată',
  CANCELLED_BY_AGENT: 'Anulată de agenție',
  CANCELLED_BY_CLIENT: 'Anulată de client',
  CHECKED_IN: 'Prezent',
  CLOSED: 'Închisă',
  CLOSED_LOST: 'Închisă',
  CLOSED_WON: 'Finalizată',
  COMPLETED: 'Finalizată',
  CONFIRMED: 'Confirmată',
  DECLINED: 'Refuzat',
  DRAFT: 'Ciornă',
  EXPIRED: 'Expirat',
  NOT_APPLICABLE: 'Nu se aplică',
  NO_SHOW: 'Neprezentare',
  ON_HOLD: 'În așteptare',
  PENDING: 'În așteptare',
  PRESENT: 'Prezent',
  PUBLISHED: 'Publicată',
  QUALIFIED: 'Calificat',
  READY_TO_SIGN: 'De semnat',
  REJECTED: 'Respins',
  REQUIRED: 'Necesar',
  SIGNED: 'Semnat',
  SUPERSEDED: 'Versiune înlocuită',
  UNDER_REVIEW: 'În verificare',
  UPLOADED: 'Încărcat',
  WAIVED: 'Nu este necesar',
}

const POSITIVE_STATUSES = new Set(['APPROVED', 'COMPLETED', 'CONFIRMED', 'PRESENT', 'PUBLISHED', 'SIGNED', 'WAIVED', 'CLOSED_WON'])
const ATTENTION_STATUSES = new Set(['DRAFT', 'PENDING', 'READY_TO_SIGN', 'REQUIRED', 'UNDER_REVIEW', 'UPLOADED', 'ON_HOLD', 'QUALIFIED'])
const NEGATIVE_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_AGENT', 'CANCELLED_BY_CLIENT', 'CLOSED_LOST', 'DECLINED', 'EXPIRED', 'NO_SHOW', 'REJECTED'])

function normalize(value: unknown): string {
  return String(value || '').trim().toUpperCase()
}

export function getRoleLabel(role: unknown): string {
  const normalized = normalize(role) as AccountRole
  return ROLE_LABELS[normalized] || String(role || 'Participant').replaceAll('_', ' ')
}

export function getStatusLabel(status: unknown): string {
  const normalized = normalize(status)
  return STATUS_LABELS[normalized] || normalized.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function getStatusTone(status: unknown): string {
  const normalized = normalize(status)
  if (POSITIVE_STATUSES.has(normalized)) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
  if (ATTENTION_STATUSES.has(normalized)) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
  if (NEGATIVE_STATUSES.has(normalized)) return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
  return 'border-border bg-muted/50 text-muted-foreground'
}
