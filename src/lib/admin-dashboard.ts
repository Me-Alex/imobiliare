import type { AccountRole } from '@/lib/account-roles'

export const ADMIN_PROPERTY_STATUSES = ['DRAFT', 'PUBLISHED', 'SOLD', 'RENTED', 'ARCHIVED'] as const
export type AdminPropertyStatus = (typeof ADMIN_PROPERTY_STATUSES)[number]

export interface AdminContact {
  id: string
  name: string
  email: string
  phone?: string | null
  message: string
  propertyTitle?: string | null
  createdAt: string
}
export interface AdminNewsletter {
  id: string
  email: string
  createdAt: string
}

export interface AdminPriceAlert {
  id: string
  email: string
  zone?: string | null
  propertyType?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  minRooms?: number | null
  active: boolean
  createdAt: string
}

export interface AdminUserRow {
  id: string
  email: string | null
  full_name: string | null
  name: string | null
  phone: string | null
  role: AccountRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminPropertyRow {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  type: string
  status: AdminPropertyStatus
  city: string | null
  zone: string | null
  owner_id: string | null
  agent_id: string | null
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminLeadRow {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  source: string
  score: number
  agent_id: string | null
  property_id: string | null
  response_due_at: string | null
  next_follow_up_at: string | null
  created_at: string
}

export interface AdminAppointmentRow {
  id: string
  client_name: string
  client_email: string
  property_title: string | null
  status: string
  start_at: string | null
  requested_at: string
  agent_id: string | null
  client_id: string | null
}

export interface AdminDealRow {
  id: string
  title: string
  stage: string
  status: string
  next_step: string | null
  next_step_due_at: string | null
  agent_id: string | null
  updated_at: string
}

export interface AdminDocumentRequirementRow {
  id: string
  deal_id: string
  label: string
  responsible_role: string
  status: string
  due_at: string | null
  updated_at: string
}

export interface AdminLegalRequestRow {
  id: string
  appointment_id: string
  document_kind: string
  status: string
  staff_note: string | null
  created_at: string
  updated_at: string
}

export interface AdminDocumentTemplateRow {
  id: string
  name: string
  type: string
  status: string
  version: number
  legal_version: string | null
  legal_review_status: string
  legal_reviewer_name: string | null
  legal_reviewed_at: string | null
  updated_at: string
}

export interface AdminCoinRedemptionRow {
  id: string
  user_id: string
  reward_id: string
  reward_snapshot: Record<string, unknown>
  cost: number
  status: string
  requested_at: string
  resolved_at: string | null
  resolution_note: string | null
}

export interface AdminAuditRow {
  id: string
  action: string
  entity: string
  entity_id: string | null
  actor: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface AdminLegalProfileRow {
  id: string
  status: string
  legal_name: string | null
  trade_name: string | null
  cui: string | null
  trade_registry_number: string | null
  privacy_notice_url: string | null
  privacy_notice_version: string | null
  updated_at: string
}

export interface AdminDashboardData {
  generatedAt: string
  contacts: AdminContact[]
  newsletters: AdminNewsletter[]
  alerts: AdminPriceAlert[]
  users: AdminUserRow[]
  properties: AdminPropertyRow[]
  leads: AdminLeadRow[]
  appointments: AdminAppointmentRow[]
  deals: AdminDealRow[]
  documentRequirements: AdminDocumentRequirementRow[]
  legalRequests: AdminLegalRequestRow[]
  templates: AdminDocumentTemplateRow[]
  redemptions: AdminCoinRedemptionRow[]
  audit: AdminAuditRow[]
  legalProfile: AdminLegalProfileRow | null
  stats: {
    totalUsers: number
    activeUsers: number
    clients: number
    owners: number
    agents: number
    admins: number
    totalProperties: number
    publishedProperties: number
    draftProperties: number
    openLeads: number
    overdueLeads: number
    upcomingViewings: number
    activeDeals: number
    pendingDocuments: number
    pendingRedemptions: number
    totalContacts: number
    totalNewsletters: number
    totalAlerts: number
    templatesApproved: number
    templatesPendingReview: number
  }
  health: {
    supabase: 'online' | 'degraded'
    d1: 'online' | 'fallback'
    legalProfileReady: boolean
    warnings: string[]
  }
}
