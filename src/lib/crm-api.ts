/** Client-side helpers for CRM leads & offers. */

import type { LeadPriority, LeadSource, LeadStatus } from '@/lib/crm'
import type { OfferStatus } from '@/lib/offers'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `API error ${res.status}`)
  }
  return data as T
}

// ─── Leads ────────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string
  email: string
  phone?: string
  notes?: string
  source?: LeadSource
  priority?: LeadPriority
  propertyId?: string
  clientUserId?: string
  transaction?: string
  budgetMin?: number
  budgetMax?: number
  preferredZones?: string[]
  preferredTypes?: string[]
  assignedToId?: string
}

export interface UpdateLeadInput {
  status?: LeadStatus
  priority?: LeadPriority
  assignedToId?: string | null
  notes?: string
  budgetMin?: number
  budgetMax?: number
  preferredZones?: string[]
  preferredTypes?: string[]
  transaction?: string
  nextFollowUpAt?: string
  lostReason?: string
  activityNote?: string
  activityType?: string
  actorName?: string
}

export async function listLeads(params: {
  status?: string
  assignedToId?: string
  source?: string
  q?: string
  page?: number
  pageSize?: number
} = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  return request<{ leads: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `${BASE}/leads?${qs}`,
  )
}

export async function getLead(id: string) {
  return request<{ lead: unknown }>(`${BASE}/leads/${id}`)
}

export async function createLead(input: CreateLeadInput) {
  return request<{ lead: unknown; demo?: boolean }>(`${BASE}/leads`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  return request<{ lead: unknown }>(`${BASE}/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteLead(id: string) {
  return request<{ ok: boolean }>(`${BASE}/leads/${id}`, { method: 'DELETE' })
}

// ─── Offers ───────────────────────────────────────────────────

export interface CreateOfferInput {
  propertyId: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  buyerUserId?: string
  amount: number
  currency?: string
  message?: string
  conditions?: string
  leadId?: string
  agentId?: string
  parentOfferId?: string
  validUntil?: string
}

export interface UpdateOfferInput {
  status?: OfferStatus
  actor?: 'buyer' | 'agent' | 'owner' | 'admin' | 'system'
  actorName?: string
  responseNote?: string
  message?: string
  conditions?: string
  amount?: number
}

export async function listOffers(params: {
  propertyId?: string
  leadId?: string
  buyerUserId?: string
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  return request<{ offers: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `${BASE}/offers?${qs}`,
  )
}

export async function getOffer(id: string) {
  return request<{ offer: unknown }>(`${BASE}/offers/${id}`)
}

export async function createOffer(input: CreateOfferInput) {
  return request<{ offer: unknown; demo?: boolean }>(`${BASE}/offers`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateOffer(id: string, input: UpdateOfferInput) {
  return request<{ offer: unknown }>(`${BASE}/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
