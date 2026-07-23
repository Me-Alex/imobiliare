import type { ElementType } from 'react'
import type { AccountRole } from '@/lib/account-roles'
import type { AdminPropertyStatus } from '@/lib/admin-dashboard'

export const ROLE_TONES: Record<AccountRole, string> = {
  CLIENT: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  OWNER: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  AGENT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ADMIN: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export const PROPERTY_STATUS_LABELS: Record<AdminPropertyStatus, string> = {
  DRAFT: 'Ciornă',
  PUBLISHED: 'Publicată',
  SOLD: 'Vândută',
  RENTED: 'Închiriată',
  ARCHIVED: 'Arhivată',
}

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou',
  CONTACTED: 'Contactat',
  QUALIFIED: 'Calificat',
  VIEWING: 'Vizionare',
  OFFER: 'Ofertă',
  CONTRACT: 'Contract',
  WON: 'Câștigat',
  CLOSED: 'Închis',
  LOST: 'Pierdut',
  PENDING: 'În așteptare',
  REQUESTED: 'Solicitat',
  CONFIRMED: 'Confirmată',
  CHECKED_IN: 'Prezent',
  COMPLETED: 'Finalizat',
  DONE: 'Finalizat',
  CANCELLED: 'Anulat',
  CANCELLED_BY_CLIENT: 'Anulat de client',
  CANCELLED_BY_AGENT: 'Anulat de agent',
  NO_SHOW: 'Neprezentare',
  ACTIVE: 'Activ',
  ON_HOLD: 'În așteptare',
  REQUIRED: 'Necesar',
  UPLOADED: 'Încărcat',
  UNDER_REVIEW: 'În verificare',
  APPROVED: 'Aprobat',
  REVIEW_REQUIRED: 'Necesită aviz',
  REJECTED: 'Respins',
  WAIVED: 'Exceptat',
  FULFILLED: 'Onorat',
  IN_REVIEW: 'În analiză',
  NEEDS_INFO: 'Necesită informații',
  ARCHIVED: 'Arhivat',
}

export type Confirmation = {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  run: () => Promise<void>
}

export type AdminTab =
  | 'home'
  | 'tasks'
  | 'people'
  | 'properties'
  | 'transactions'
  | 'settings'
  | 'inbox'
  | 'compliance'
  | 'virtual-tours'
  | 'audit'

export type WorkDestination = 'crm' | 'properties' | 'transactions' | 'documents' | 'compliance'

export type WorkItem = {
  id: string
  title: string
  description: string
  count: number
  priority: 'urgent' | 'normal'
  destination: WorkDestination
  actionLabel: string
  icon: ElementType
}

export type GlobalSearchResult = {
  id: string
  label: string
  meta: string
  kind: string
  tab: AdminTab
  localSearch?: string
  icon: ElementType
}

export function statusTone(status: string): string {
  if (['ACTIVE', 'PUBLISHED', 'APPROVED', 'FULFILLED', 'COMPLETED', 'DONE', 'WON'].includes(status)) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  }
  if (['REJECTED', 'LOST', 'NO_SHOW', 'CANCELLED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_AGENT'].includes(status)) {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
  }
  if (['REQUESTED', 'PENDING', 'REVIEW_REQUIRED', 'UNDER_REVIEW', 'IN_REVIEW', 'NEEDS_INFO'].includes(status)) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }
  return 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
}

export function formatAdminDateTime(value?: string | null): string {
  if (!value) return 'Fără termen'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă'
  return date.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
