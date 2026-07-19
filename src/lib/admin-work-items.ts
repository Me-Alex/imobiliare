import {
  Building2,
  CalendarDays,
  Coins,
  FileCheck2,
  FileWarning,
  Handshake,
  ShieldAlert,
} from 'lucide-react'
import type { AdminDashboardData } from '@/lib/admin-dashboard'
import type { WorkItem } from '@/lib/admin-labels'

/** Build the prioritized admin work queue from dashboard stats. */
export function buildAdminWorkItems(data: AdminDashboardData): WorkItem[] {
  const items: WorkItem[] = []
  const pendingAppointments = data.appointments.filter((item) =>
    ['PENDING', 'REQUESTED'].includes(item.status),
  ).length

  if (data.stats.overdueLeads > 0) {
    items.push({
      id: 'overdue-leads',
      title: 'Lead-uri fără răspuns la timp',
      description: 'Repartizează un agent și stabilește următorul follow-up.',
      count: data.stats.overdueLeads,
      priority: 'urgent',
      destination: 'crm',
      actionLabel: 'Deschide CRM',
      icon: Handshake,
    })
  }
  if (!data.health.legalProfileReady) {
    items.push({
      id: 'legal-profile',
      title: 'Profilul juridic trebuie verificat',
      description: 'Datele firmei sau informarea GDPR nu sunt pregătite pentru documentele finale.',
      count: 1,
      priority: 'urgent',
      destination: 'compliance',
      actionLabel: 'Verifică profilul',
      icon: ShieldAlert,
    })
  }
  if (data.stats.templatesPendingReview > 0) {
    items.push({
      id: 'legal-templates',
      title: 'Șabloane juridice fără aviz',
      description: 'Contractele rămân ciorne până la aprobarea nominală a profesionistului juridic.',
      count: data.stats.templatesPendingReview,
      priority: 'urgent',
      destination: 'compliance',
      actionLabel: 'Vezi conformitatea',
      icon: FileWarning,
    })
  }
  if (data.stats.draftProperties > 0) {
    items.push({
      id: 'draft-properties',
      title: 'Proprietăți în ciornă',
      description: 'Verifică informațiile, agentul repartizat și starea publicării.',
      count: data.stats.draftProperties,
      priority: 'normal',
      destination: 'properties',
      actionLabel: 'Verifică proprietățile',
      icon: Building2,
    })
  }
  if (pendingAppointments > 0) {
    items.push({
      id: 'pending-appointments',
      title: 'Vizionări care așteaptă confirmare',
      description: 'Confirmă responsabilul, ora și documentele necesare vizionării.',
      count: pendingAppointments,
      priority: 'normal',
      destination: 'transactions',
      actionLabel: 'Vezi vizionările',
      icon: CalendarDays,
    })
  }
  if (data.stats.pendingDocuments > 0) {
    items.push({
      id: 'pending-documents',
      title: 'Documente solicitate sau restante',
      description: 'Verifică responsabilul și următorul termen în Deal Room.',
      count: data.stats.pendingDocuments,
      priority: 'normal',
      destination: 'documents',
      actionLabel: 'Deschide documentele',
      icon: FileCheck2,
    })
  }
  if (data.stats.pendingRedemptions > 0) {
    items.push({
      id: 'coin-redemptions',
      title: 'Solicitări HQS Coins',
      description: 'Onorează recompensa sau respinge cererea cu restituire automată.',
      count: data.stats.pendingRedemptions,
      priority: 'normal',
      destination: 'transactions',
      actionLabel: 'Soluționează cererile',
      icon: Coins,
    })
  }

  return items
}
