import { supabase } from '@/lib/supabase'

export const DEAL_STAGES = ['NEW', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST'] as const
export const CRM_STAGES = ['NEW', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT'] as const

export type DealStage = (typeof DEAL_STAGES)[number]
export type CrmStage = (typeof CRM_STAGES)[number]

export interface WorkspaceProfile {
  id?: string
  full_name?: string | null
  name?: string | null
  email?: string | null
  avatar_url?: string | null
}

export interface WorkspaceProperty {
  id: string
  title: string
  slug?: string | null
  address?: string | null
  city?: string | null
  zone?: string | null
  type?: string | null
  status?: string | null
  price?: number | string | null
  currency?: string | null
  area_sqm?: number | string | null
  cover_image_url?: string | null
  description?: string | null
  rooms?: number | null
  bathrooms?: number | null
  gallery_urls?: string[] | null
  amenities?: string[] | null
  agent_id?: string | null
  owner_id?: string | null
}

export interface DealParticipant {
  profile_id: string
  participant_role: string
  attendance_status: string
  confirmed_at?: string | null
  profiles?: WorkspaceProfile | WorkspaceProfile[] | null
}

export interface DealAppointment {
  appointment_id: string
  appointments?: {
    id: string
    requested_at: string
    start_at?: string | null
    end_at?: string | null
    status: string
    checked_in_at?: string | null
    completed_at?: string | null
    rating?: number | null
    feedback?: string | null
    would_proceed?: boolean | null
    client_name?: string | null
    staff_name?: string | null
  } | Array<{
    id: string
    requested_at: string
    start_at?: string | null
    end_at?: string | null
    status: string
    checked_in_at?: string | null
    completed_at?: string | null
    rating?: number | null
    feedback?: string | null
    would_proceed?: boolean | null
    client_name?: string | null
    staff_name?: string | null
  }> | null
}

export interface DealRequirement {
  id: string
  document_id?: string | null
  document_type: string
  label: string
  responsible_role: string
  assigned_to?: string | null
  status: string
  due_at?: string | null
  notes?: string | null
  client_documents?: {
    id: string
    title: string
    type: string
    status: string
    version: number
    signed_at?: string | null
    signature_requirement?: string | null
    document_signers?: Array<{
      id: string
      user_id: string
      signer_role: string
      status: string
      signed_at?: string | null
    }> | null
  } | Array<{
    id: string
    title: string
    type: string
    status: string
    version: number
    signed_at?: string | null
    signature_requirement?: string | null
    document_signers?: Array<{
      id: string
      user_id: string
      signer_role: string
      status: string
      signed_at?: string | null
    }> | null
  }> | null
}

export interface DealEvent {
  id: number
  actor_id?: string | null
  event_type: string
  summary: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface DealOffer {
  id: string
  user_id?: string | null
  parent_offer_id?: string | null
  created_by?: string | null
  offer_kind: 'OFFER' | 'COUNTER_OFFER'
  offer_price: number | string
  list_price: number | string
  currency: string
  status: string
  notes?: string | null
  submitted_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface DealRoom {
  id: string
  property_id: string
  primary_client_id?: string | null
  owner_id?: string | null
  agent_id?: string | null
  lead_id?: string | null
  title: string
  stage: DealStage
  status: string
  next_step?: string | null
  next_step_owner_id?: string | null
  next_step_due_at?: string | null
  created_at: string
  updated_at: string
  properties?: WorkspaceProperty | WorkspaceProperty[] | null
  deal_participants?: DealParticipant[] | null
  deal_appointments?: DealAppointment[] | null
  deal_document_requirements?: DealRequirement[] | null
  deal_events?: DealEvent[] | null
  property_offers?: DealOffer[] | null
}

export interface CrmLead {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  status: string
  source?: string | null
  score: number
  property_id?: string | null
  agent_id?: string | null
  zone_interest?: string | null
  budget_min?: number | string | null
  budget_max?: number | string | null
  first_response_at?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  response_due_at?: string | null
  created_at: string
  updated_at?: string | null
  properties?: WorkspaceProperty | WorkspaceProperty[] | null
}

export interface CrmFollowUp {
  id: string
  lead_id: string
  assigned_to: string
  task_type: string
  title: string
  notes?: string | null
  due_at: string
  status: string
  outcome?: string | null
  completed_at?: string | null
}

export interface PropertyMetric {
  property_id: string
  metric_date: string
  views: number
  favorites: number
  inquiries: number
  viewings: number
}

export function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export const TERMINAL_OFFER_STATUSES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const
export type DealOfferAction = 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTERED'

const COMPLETE_REQUIREMENT_STATUSES = new Set(['APPROVED', 'WAIVED'])
const RECEIVED_REQUIREMENT_STATUSES = new Set(['UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'WAIVED'])
const COMPLETE_DOCUMENT_STATUSES = new Set(['SIGNED', 'APPROVED'])
const BLOCKED_DOCUMENT_STATUSES = new Set(['REJECTED', 'DECLINED', 'EXPIRED'])

export type DealRequirementBucket = 'missing' | 'received' | 'signing' | 'complete' | 'blocked'

export interface DealRequirementState {
  bucket: DealRequirementBucket
  displayStatus: string
  helper: string
  isReceived: boolean
  isComplete: boolean
  needsSignature: boolean
}

export function getDealRequirementState(requirement: DealRequirement): DealRequirementState {
  const document = relationOne(requirement.client_documents)
  const signers = document?.document_signers || []
  const requiredSigners = signers.filter((signer) => signer.status !== 'DECLINED')
  const signedCount = signers.filter((signer) => signer.status === 'SIGNED').length
  const needsSignature = signers.some((signer) => signer.status === 'PENDING')

  if (requirement.status === 'REJECTED' || (document && BLOCKED_DOCUMENT_STATUSES.has(document.status))) {
    return {
      bucket: 'blocked',
      displayStatus: 'REJECTED',
      helper: 'Documentul trebuie corectat sau reincarcat.',
      isReceived: false,
      isComplete: false,
      needsSignature: false,
    }
  }

  if (COMPLETE_REQUIREMENT_STATUSES.has(requirement.status) || (document && COMPLETE_DOCUMENT_STATUSES.has(document.status))) {
    return {
      bucket: 'complete',
      displayStatus: requirement.status === 'WAIVED' ? 'WAIVED' : document?.status || requirement.status,
      helper: requiredSigners.length > 0
        ? `Semnaturi complete: ${signedCount}/${requiredSigners.length}.`
        : 'Document verificat in dosar.',
      isReceived: true,
      isComplete: true,
      needsSignature: false,
    }
  }

  if (needsSignature && document) {
    return {
      bucket: 'signing',
      displayStatus: document.status,
      helper: `Asteapta semnaturi: ${signedCount}/${requiredSigners.length || signers.length}.`,
      isReceived: true,
      isComplete: false,
      needsSignature: true,
    }
  }

  if (document || RECEIVED_REQUIREMENT_STATUSES.has(requirement.status)) {
    return {
      bucket: 'received',
      displayStatus: document?.status || requirement.status,
      helper: document
        ? 'Document primit. Agentul il verifica si il asociaza cu pasul potrivit.'
        : 'Document primit, dar legatura cu fisierul nu este vizibila in acest cont.',
      isReceived: true,
      isComplete: false,
      needsSignature: false,
    }
  }

  return {
    bucket: 'missing',
    displayStatus: requirement.status || 'REQUIRED',
    helper: 'Document lipsa. Responsabilul trebuie sa il incarce sau sa ceara generarea lui.',
    isReceived: false,
    isComplete: false,
    needsSignature: false,
  }
}

export function summarizeDealRequirements(requirements: readonly DealRequirement[]) {
  const states = requirements.map((requirement) => getDealRequirementState(requirement))
  return {
    states,
    total: requirements.length,
    received: states.filter((state) => state.isReceived).length,
    complete: states.filter((state) => state.isComplete).length,
    missing: states.filter((state) => state.bucket === 'missing').length,
    blocked: states.filter((state) => state.bucket === 'blocked').length,
    signatures: states.filter((state) => state.needsSignature).length,
    receivedProgress: requirements.length ? Math.round(states.filter((state) => state.isReceived).length / requirements.length * 100) : 0,
    completeProgress: requirements.length ? Math.round(states.filter((state) => state.isComplete).length / requirements.length * 100) : 0,
  }
}

export function isTerminalDealOffer(offer: DealOffer): boolean {
  return (TERMINAL_OFFER_STATUSES as readonly string[]).includes(offer.status)
}

export function getActiveDealOffer(offers: readonly DealOffer[]): DealOffer | null {
  return [...offers]
    .sort((a, b) => +new Date(b.submitted_at || b.created_at) - +new Date(a.submitted_at || a.created_at))
    .find((offer) => !isTerminalDealOffer(offer)) || null
}

export function getAllowedDealOfferActions(
  offer: DealOffer | null,
  role?: string | null,
  userId?: string | null,
  room?: DealRoom | null,
): DealOfferAction[] {
  if (!offer || !role || !userId || isTerminalDealOffer(offer) || offer.status !== 'SUBMITTED') return []
  const normalizedRole = role.toUpperCase()
  const isClient = normalizedRole === 'CLIENT' || room?.primary_client_id === userId || offer.user_id === userId
  const isStaffSide = ['OWNER', 'AGENT', 'ADMIN'].includes(normalizedRole)

  if (offer.offer_kind === 'OFFER') {
    if (isStaffSide) return ['ACCEPTED', 'REJECTED', 'COUNTERED']
    if (isClient && (offer.created_by === userId || offer.user_id === userId || room?.primary_client_id === userId)) {
      return ['WITHDRAWN']
    }
  }

  if (offer.offer_kind === 'COUNTER_OFFER') {
    if (isClient) return ['ACCEPTED', 'REJECTED', 'COUNTERED']
    if (normalizedRole === 'AGENT' || normalizedRole === 'ADMIN') return ['ACCEPTED', 'REJECTED']
  }

  return []
}

export function canSubmitDealOffer(
  role?: string | null,
  activeOffer?: DealOffer | null,
): boolean {
  const normalizedRole = String(role || '').toUpperCase()
  if (!activeOffer) return normalizedRole === 'CLIENT'
  if (activeOffer.status !== 'SUBMITTED') return normalizedRole === 'CLIENT'
  if (activeOffer.offer_kind === 'OFFER') return ['OWNER', 'AGENT', 'ADMIN'].includes(normalizedRole)
  if (activeOffer.offer_kind === 'COUNTER_OFFER') return normalizedRole === 'CLIENT'
  return false
}

export function normalizeCrmStage(status: string): CrmStage {
  if (status === 'CONTACTED') return 'QUALIFIED'
  if (status === 'CLOSED') return 'CONTRACT'
  return CRM_STAGES.includes(status as CrmStage) ? status as CrmStage : 'NEW'
}

export async function fetchDealRooms(): Promise<DealRoom[]> {
  const { data, error } = await supabase
    .from('deal_rooms')
    .select(`
      id, property_id, primary_client_id, owner_id, agent_id, lead_id, title,
      stage, status, next_step, next_step_owner_id, next_step_due_at, created_at, updated_at,
      properties!deal_rooms_property_id_fkey(id,title,slug,address,city,zone,type,status,price,currency,area_sqm,cover_image_url,agent_id,owner_id),
      deal_participants(profile_id,participant_role,attendance_status,confirmed_at,profiles!deal_participants_profile_id_fkey(id,full_name,name,email,avatar_url)),
      deal_appointments(appointment_id,appointments!deal_appointments_appointment_id_fkey(id,requested_at,start_at,end_at,status,checked_in_at,completed_at,rating,feedback,would_proceed,client_name,staff_name)),
      deal_document_requirements(id,document_id,document_type,label,responsible_role,assigned_to,status,due_at,notes,client_documents!deal_document_requirements_document_id_fkey(id,title,type,status,version,signed_at,signature_requirement,document_signers(id,user_id,signer_role,status,signed_at))),
      deal_events(id,actor_id,event_type,summary,metadata,created_at),
      property_offers!property_offers_deal_id_fkey(id,user_id,parent_offer_id,created_by,offer_kind,offer_price,list_price,currency,status,notes,submitted_at,expires_at,created_at,updated_at)
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as DealRoom[]
}

export async function updateDealNextStep(input: {
  dealId: string
  stage: DealStage
  nextStep: string
  ownerId: string | null
  dueAt: string | null
}) {
  const { error } = await supabase
    .from('deal_rooms')
    .update({
      stage: input.stage,
      next_step: input.nextStep.trim() || null,
      next_step_owner_id: input.ownerId,
      next_step_due_at: input.dueAt,
    })
    .eq('id', input.dealId)
  if (error) throw error
}

export async function transitionDealOffer(input: {
  offerId: string
  nextStatus: DealOfferAction
  actor?: string | null
  note?: string
}) {
  const { error } = await supabase.rpc('transition_deal_offer', {
    p_offer_id: input.offerId,
    p_next_status: input.nextStatus,
    p_actor: input.actor || null,
    p_note: input.note?.trim() || null,
  })
  if (error) throw error
}

export async function submitDealOffer(input: {
  room: DealRoom
  userId: string
  userName: string
  userEmail: string
  amount: number
  kind: 'OFFER' | 'COUNTER_OFFER'
  parentOfferId?: string | null
  actor?: string | null
  notes?: string
}) {
  const property = relationOne(input.room.properties)
  const { error } = await supabase.from('property_offers').insert({
    deal_id: input.room.id,
    property_id: input.room.property_id,
    property_title: property?.title || input.room.title,
    user_id: input.room.primary_client_id || input.userId,
    created_by: input.userId,
    client_name: input.userName,
    client_email: input.userEmail || null,
    list_price: Number(property?.price || input.amount),
    offer_price: input.amount,
    currency: property?.currency || 'EUR',
    offer_kind: input.kind,
    parent_offer_id: input.parentOfferId || null,
    status: 'SUBMITTED',
    submitted_at: new Date().toISOString(),
    notes: input.notes?.trim() || null,
  })
  if (error) throw error

  if (input.parentOfferId) {
    await transitionDealOffer({
      offerId: input.parentOfferId,
      nextStatus: 'COUNTERED',
      actor: input.actor,
      note: input.kind === 'COUNTER_OFFER'
        ? 'Contraoferta trimisa in Deal Room.'
        : 'Oferta revizuita trimisa in Deal Room.',
    })
  }
}

export async function fetchCrmSnapshot() {
  const [leadResult, followUpResult, appointmentResult] = await Promise.all([
    supabase
      .from('leads')
      .select(`id,name,email,phone,status,source,score,property_id,agent_id,zone_interest,budget_min,budget_max,first_response_at,last_contact_at,next_follow_up_at,response_due_at,created_at,updated_at,properties!leads_property_id_fkey(id,title,slug,address,zone,city,price,currency,cover_image_url)`)
      .order('created_at', { ascending: false }),
    supabase
      .from('crm_follow_ups')
      .select('id,lead_id,assigned_to,task_type,title,notes,due_at,status,outcome,completed_at')
      .order('due_at', { ascending: true }),
    supabase
      .from('appointments')
      .select('id,agent_id,start_at,requested_at,status,property_title,client_name')
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(20),
  ])

  if (leadResult.error) throw leadResult.error
  if (followUpResult.error) throw followUpResult.error
  if (appointmentResult.error) throw appointmentResult.error

  return {
    leads: (leadResult.data ?? []) as unknown as CrmLead[],
    followUps: (followUpResult.data ?? []) as unknown as CrmFollowUp[],
    appointments: (appointmentResult.data ?? []) as Array<Record<string, unknown>>,
  }
}

export async function updateLeadStage(leadId: string, status: CrmStage) {
  const { error } = await supabase
    .from('leads')
    .update({ status, last_contact_at: new Date().toISOString() })
    .eq('id', leadId)
  if (error) throw error
}

export async function createFollowUp(input: {
  leadId: string
  assignedTo: string
  createdBy: string
  title: string
  dueAt: string
}) {
  const { error } = await supabase.from('crm_follow_ups').insert({
    lead_id: input.leadId,
    assigned_to: input.assignedTo,
    created_by: input.createdBy,
    task_type: 'CALL',
    title: input.title,
    due_at: input.dueAt,
  })
  if (error) throw error

  await supabase
    .from('leads')
    .update({ next_follow_up_at: input.dueAt })
    .eq('id', input.leadId)
}

export async function completeFollowUp(followUpId: string) {
  const { error } = await supabase
    .from('crm_follow_ups')
    .update({ status: 'DONE', completed_at: new Date().toISOString() })
    .eq('id', followUpId)
  if (error) throw error
}

export async function autoAssignLeads() {
  const { data, error } = await supabase.rpc('reassign_leads_automatically')
  if (error) throw error
  return Number(data || 0)
}

export async function fetchOwnerSnapshot(ownerId: string) {
  const propertyResult = await supabase
    .from('properties')
    .select('id,title,slug,address,city,zone,type,status,price,currency,area_sqm,cover_image_url,description,rooms,bathrooms,gallery_urls,amenities,agent_id,owner_id')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })

  if (propertyResult.error) throw propertyResult.error
  const properties = (propertyResult.data ?? []) as unknown as WorkspaceProperty[]
  const ids = properties.map((property) => property.id)
  if (ids.length === 0) return { properties, metrics: [], appointments: [], requirements: [], events: [], comparables: [] }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [metricsResult, appointmentResult, requirementsResult, eventResult, comparableResult] = await Promise.all([
    supabase
      .from('property_daily_metrics')
      .select('property_id,metric_date,views,favorites,inquiries,viewings')
      .in('property_id', ids)
      .gte('metric_date', since.toISOString().slice(0, 10))
      .order('metric_date', { ascending: true }),
    supabase
      .from('appointments')
      .select('id,property_id,status,start_at,requested_at,rating,feedback,would_proceed,agent_id')
      .in('property_id', ids)
      .order('requested_at', { ascending: false }),
    supabase
      .from('deal_document_requirements')
      .select('id,deal_id,document_type,label,responsible_role,status,due_at,deal_rooms!deal_document_requirements_deal_id_fkey(id,property_id)')
      .order('created_at', { ascending: false }),
    supabase
      .from('deal_events')
      .select('id,deal_id,actor_id,event_type,summary,metadata,created_at,deal_rooms!deal_events_deal_id_fkey(property_id,agent_id)')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('properties')
      .select('id,title,zone,type,price,currency,area_sqm,status')
      .eq('status', 'PUBLISHED')
      .limit(100),
  ])

  if (metricsResult.error) throw metricsResult.error
  if (appointmentResult.error) throw appointmentResult.error
  if (requirementsResult.error) throw requirementsResult.error
  if (eventResult.error) throw eventResult.error
  if (comparableResult.error) throw comparableResult.error

  return {
    properties,
    metrics: (metricsResult.data ?? []) as unknown as PropertyMetric[],
    appointments: (appointmentResult.data ?? []) as Array<Record<string, unknown>>,
    requirements: (requirementsResult.data ?? []) as Array<Record<string, unknown>>,
    events: (eventResult.data ?? []) as Array<Record<string, unknown>>,
    comparables: (comparableResult.data ?? []) as unknown as WorkspaceProperty[],
  }
}

export function listingQuality(property: WorkspaceProperty) {
  const checks = [
    Boolean(property.title && property.title.length >= 20),
    Boolean(property.description && property.description.length >= 250),
    Boolean(property.cover_image_url),
    Boolean(property.gallery_urls && property.gallery_urls.length >= 5),
    Boolean(property.address && property.zone),
    Boolean(property.area_sqm && property.rooms),
    Boolean(property.amenities && property.amenities.length >= 4),
  ]
  const score = Math.round(checks.filter(Boolean).length / checks.length * 100)
  const issues = [
    !checks[1] ? 'Extinde descrierea la minimum 250 de caractere.' : null,
    !checks[3] ? 'Adaugă minimum 5 fotografii relevante.' : null,
    !checks[6] ? 'Completează facilitățile principale.' : null,
  ].filter((value): value is string => Boolean(value))
  return { score, issues }
}

export async function recordPropertyView(propertyId: string) {
  if (typeof window === 'undefined' || !/^[0-9a-f-]{36}$/i.test(propertyId)) return
  const storageKey = 'hqs-anonymous-viewer-key'
  let viewerKey = window.localStorage.getItem(storageKey)
  if (!viewerKey) {
    viewerKey = `${crypto.randomUUID()}-${Date.now()}`
    window.localStorage.setItem(storageKey, viewerKey)
  }
  await supabase.rpc('record_property_view', { p_property_id: propertyId, p_viewer_key: viewerKey })
}
