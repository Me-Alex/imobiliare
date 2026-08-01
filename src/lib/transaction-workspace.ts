import { supabase } from '@/lib/supabase'
import type { AccountRole } from '@/lib/account-roles'
import { getPublishedPropertyQuality } from '@/lib/property-publication-readiness'

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
  sector?: string | null
  type?: string | null
  transaction_type?: string | null
  status?: string | null
  price?: number | string | null
  currency?: string | null
  area_sqm?: number | string | null
  cover_image_url?: string | null
  description?: string | null
  rooms?: number | null
  bathrooms?: number | null
  year_built?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  gallery_urls?: string[] | null
  amenities?: string[] | null
  agent_id?: string | null
  owner_id?: string | null
  virtual_tours?: Array<{
    id?: string | null
    status?: string | null
    provider?: string | null
    external_url?: string | null
    entry_scene_id?: string | null
    title?: string | null
  }> | {
    id?: string | null
    status?: string | null
    provider?: string | null
    external_url?: string | null
    entry_scene_id?: string | null
    title?: string | null
  } | null
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

export interface DealStageGate {
  ok: boolean
  reason?: string
}

export type DealRoomActionState = 'current' | 'waiting' | 'blocked' | 'complete'

export interface DealRoomActionSummary {
  title: string
  description: string
  state: DealRoomActionState
  priority: 'normal' | 'high'
  page: 'deal-room' | 'documente'
  requirementId?: string
  offerId?: string
}

export function getDealStageGate(
  stage: DealStage,
  offers: readonly DealOffer[],
  requirements: readonly DealRequirement[],
): DealStageGate {
  const hasAcceptedOffer = offers.some((offer) => offer.status === 'ACCEPTED')
  const documentSummary = summarizeDealRequirements(requirements)

  if ((stage === 'CONTRACT' || stage === 'CLOSED_WON') && !hasAcceptedOffer) {
    return { ok: false, reason: 'Accepta o oferta inainte sa muti tranzactia in Contract.' }
  }

  if (stage === 'CONTRACT' && documentSummary.blocked > 0) {
    return { ok: false, reason: 'Corecteaza documentele respinse inainte de etapa Contract.' }
  }

  if (stage === 'CLOSED_WON') {
    if (documentSummary.total === 0) {
      return { ok: false, reason: 'Creeaza checklistul de documente inainte de finalizarea tranzactiei.' }
    }
    if (documentSummary.blocked > 0) {
      return { ok: false, reason: 'Exista documente respinse sau expirate in Deal Room.' }
    }
    if (documentSummary.signatures > 0) {
      return { ok: false, reason: 'Exista semnaturi obligatorii in asteptare.' }
    }
    if (documentSummary.complete < documentSummary.total) {
      return { ok: false, reason: 'Finalizeaza toate documentele obligatorii inainte de inchidere.' }
    }
  }

  return { ok: true }
}

function hasPendingSignatureForUser(requirement: DealRequirement, userId: string) {
  const document = relationOne(requirement.client_documents)
  return Boolean(document?.document_signers?.some((signer) =>
    signer.user_id === userId
    && signer.status === 'PENDING',
  ))
}

function isRequirementOwnedByRole(requirement: DealRequirement, role: AccountRole, userId: string) {
  return requirement.assigned_to === userId || String(requirement.responsible_role || '').toUpperCase() === role
}

function isStaffRole(role: AccountRole) {
  return role === 'AGENT' || role === 'ADMIN'
}

export function isDealRequirementActionableFor(
  requirement: DealRequirement,
  role: AccountRole,
  userId: string,
) {
  const state = getDealRequirementState(requirement)
  if (state.isComplete) return false
  if (isStaffRole(role)) return true
  return hasPendingSignatureForUser(requirement, userId) || isRequirementOwnedByRole(requirement, role, userId)
}

export function countDealRoomDocumentActions(input: {
  role: AccountRole
  userId: string
  rooms: readonly DealRoom[]
}) {
  return input.rooms.reduce((total, room) => total + (room.deal_document_requirements || [])
    .filter((requirement) => isDealRequirementActionableFor(requirement, input.role, input.userId))
    .length, 0)
}

export function getDealRoomActionSummary(input: {
  room: DealRoom
  role: AccountRole
  userId: string
}): DealRoomActionSummary {
  const requirements = input.room.deal_document_requirements || []
  const offers = input.room.property_offers || []
  const activeOffer = getActiveDealOffer(offers)
  const allowedOfferActions = getAllowedDealOfferActions(activeOffer, input.role, input.userId, input.room)
  const canSendOffer = canSubmitDealOffer(input.role, activeOffer)
  const documentSummary = summarizeDealRequirements(requirements)
  const stageGate = getDealStageGate(input.room.stage, offers, requirements)

  const pendingSignatureRequirement = requirements.find((requirement) =>
    hasPendingSignatureForUser(requirement, input.userId),
  )
  if (pendingSignatureRequirement) {
    return {
      title: `Semneaza: ${pendingSignatureRequirement.label}`,
      description: 'Ai o semnatura obligatorie in asteptare. Verifica versiunea exacta si semneaza din dosarul digital.',
      state: 'current',
      priority: 'high',
      page: 'documente',
      requirementId: pendingSignatureRequirement.id,
    }
  }

  const ownRequirement = requirements.find((requirement) =>
    isRequirementOwnedByRole(requirement, input.role, input.userId)
    && !getDealRequirementState(requirement).isComplete,
  )
  if (ownRequirement && !isStaffRole(input.role)) {
    const state = getDealRequirementState(ownRequirement)
    return {
      title: `${state.bucket === 'blocked' ? 'Corecteaza' : 'Rezolva'}: ${ownRequirement.label}`,
      description: state.helper,
      state: state.bucket === 'blocked' ? 'blocked' : 'current',
      priority: 'high',
      page: 'documente',
      requirementId: ownRequirement.id,
    }
  }

  if (isStaffRole(input.role) && documentSummary.blocked > 0) {
    return {
      title: `${documentSummary.blocked} document ${documentSummary.blocked === 1 ? 'blocat' : 'blocate'}`,
      description: 'Exista documente respinse, expirate sau care trebuie reincarcate inainte de contract.',
      state: 'blocked',
      priority: 'high',
      page: 'documente',
    }
  }

  if (allowedOfferActions.length > 0 && activeOffer) {
    return {
      title: activeOffer.offer_kind === 'COUNTER_OFFER' ? 'Raspunde la contraoferta' : 'Raspunde la oferta',
      description: `Negocierea activa este la ${formatDealAmount(activeOffer.offer_price, activeOffer.currency)}. Accepta, respinge sau pregateste o contraoferta.`,
      state: 'current',
      priority: 'high',
      page: 'deal-room',
      offerId: activeOffer.id,
    }
  }

  if (canSendOffer) {
    return {
      title: input.role === 'CLIENT' ? 'Trimite oferta' : 'Trimite contraoferta',
      description: input.role === 'CLIENT'
        ? 'Daca proprietatea este potrivita, poti porni negocierea direct din Deal Room.'
        : 'Poti raspunde clientului cu o valoare revizuita si nota pentru jurnalul negocierii.',
      state: 'current',
      priority: 'normal',
      page: 'deal-room',
      offerId: activeOffer?.id,
    }
  }

  if (isStaffRole(input.role) && !stageGate.ok) {
    return {
      title: 'Tranzactia are un blocaj de etapa',
      description: stageGate.reason || 'Verifica oferta acceptata, documentele si semnaturile inainte de avansarea etapei.',
      state: 'blocked',
      priority: 'high',
      page: stageGate.reason?.toLowerCase().includes('document') ? 'documente' : 'deal-room',
    }
  }

  const staffRequirement = isStaffRole(input.role)
    ? requirements.find((requirement) => !getDealRequirementState(requirement).isComplete)
    : null
  if (staffRequirement) {
    const state = getDealRequirementState(staffRequirement)
    return {
      title: `Verifica documentul: ${staffRequirement.label}`,
      description: state.helper,
      state: state.needsSignature ? 'waiting' : 'current',
      priority: 'normal',
      page: 'documente',
      requirementId: staffRequirement.id,
    }
  }

  if (input.room.next_step) {
    return {
      title: input.room.next_step,
      description: input.room.next_step_due_at
        ? `Termenul este setat pentru ${new Date(input.room.next_step_due_at).toLocaleDateString('ro-RO')}.`
        : 'Urmatorul pas este stabilit in Deal Room.',
      state: 'current',
      priority: 'normal',
      page: 'deal-room',
    }
  }

  if (input.room.stage === 'CLOSED_WON' || input.room.stage === 'CLOSED_LOST' || input.room.status !== 'ACTIVE') {
    return {
      title: 'Tranzactie inchisa',
      description: 'Nu mai exista actiuni curente. Documentele si jurnalul raman disponibile pentru consultare.',
      state: 'complete',
      priority: 'normal',
      page: 'deal-room',
    }
  }

  return {
    title: 'Asteapta actiunea urmatoare',
    description: 'Nu exista o actiune directa pentru rolul tau in acest moment; urmareste jurnalul si responsabilul curent.',
    state: 'waiting',
    priority: 'normal',
    page: 'deal-room',
  }
}

function formatDealAmount(value: number | string, currency = 'EUR') {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
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
  const { error } = await supabase.rpc('update_deal_next_step', {
    p_deal_id: input.dealId,
    p_stage: input.stage,
    p_next_step: input.nextStep.trim() || null,
    p_owner_id: input.ownerId,
    p_due_at: input.dueAt,
  })
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
    .select('id,title,slug,address,city,zone,sector,type,transaction_type,status,price,currency,area_sqm,cover_image_url,description,rooms,bathrooms,year_built,lat,lng,gallery_urls,amenities,agent_id,owner_id,virtual_tours(id,status,provider,external_url,entry_scene_id,title)')
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
  const quality = getPublishedPropertyQuality(property)
  return {
    score: quality.score,
    label: quality.label,
    issues: quality.issues,
    recommendations: quality.recommendations,
    nextAction: quality.nextAction,
  }
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
