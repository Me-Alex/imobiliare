// Appointment Workspace Types for HQS Imobiliare

// ============================================================================
// Enums
// ============================================================================

export type AppointmentStep = 'SCHEDULE' | 'PREPARE' | 'SIGN' | 'CONFIRM'

export type SignatureMethod = 'TYPED' | 'DRAWN'

export type DocumentChecklistStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'

export type AppointmentStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELED'
  | 'CANCELLED'
  | 'NO_SHOW'

// ============================================================================
// Core Types
// ============================================================================

export interface Appointment {
  id: string
  client_id?: string | null
  property_id: string
  property_reference?: string | null
  property_title?: string | null
  agent_id?: string | null
  staff_reference?: string | null
  staff_name?: string | null
  scheduled_at: string
  scheduled_end: string
  status: AppointmentStatus
  notes?: string | null
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  source_id?: string | null
  rating?: number | null
  feedback?: string | null
  would_proceed?: boolean | null
  confirmed_at?: string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
  checked_in_at?: string | null
  cancellation_reason?: string | null
  no_show_marked_at?: string | null
  no_show_eligible_at?: string | null
  booking_terms_accepted_at?: string | null
}

export interface DocumentChecklist {
  id: string
  appointment_id: string
  document_type: DocumentType
  status: DocumentChecklistStatus
  label: string
  description?: string
  required: boolean
  uploaded_document_id?: string | null
  uploaded_at?: string | null
  verified_at?: string | null
  verified_by?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Signature {
  id: string
  appointment_id: string
  document_type: string
  signer_id: string
  signer_name: string
  signer_role: 'CLIENT' | 'AGENT' | 'OWNER' | 'ADMIN'
  method: SignatureMethod
  signature_text?: string | null
  signature_image_url?: string | null
  consent_accepted_at: string
  signed_at: string
}

export interface DocumentUpload {
  id: string
  appointmentId?: string | null
  propertyId?: string | null
  templateId?: string | null
  userId: string
  title: string
  docType: DocumentType
  status: DocumentStatus
  visibility: 'PRIVATE' | 'PARTICIPANTS' | 'AGENT' | 'OWNER'
  storageBucket?: string | null
  storagePath?: string | null
  fileName?: string | null
  fileType?: string | null
  byteSize?: number | null
  checksum?: string | null
  version: number
  uploadedAt: string
  lockedAt?: string | null
  signedAt?: string | null
  signatureLevel?: string | null
  uploadedBy?: string | null
}

export interface NotificationPreferences {
  emailAppointmentReminders: boolean
  emailDocumentUpdates: boolean
  emailSignatureRequests: boolean
  smsAppointmentReminders: boolean
  pushNotifications: boolean
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType =
  | 'id_card'
  | 'proof_of_income'
  | 'ownership_title'
  | 'land_registry_excerpt'
  | 'fiscal_certificate'
  | 'energy_certificate'
  | 'vizionare_sign'
  | 'brokerage_contract'
  | 'owner_mandate'
  | 'reservation_offer'
  | 'rental_contract'
  | 'handover_protocol'
  | 'addendum'
  | 'termination_notice'
  | 'other'

export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'UPLOADED'
  | 'READY_TO_SIGN'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  | 'DECLINED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'

// ============================================================================
// Document Type Labels
// ============================================================================

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_card: 'Carte de identitate / Buletin',
  proof_of_income: 'Dovadă venit',
  ownership_title: 'Titlu de proprietate',
  land_registry_excerpt: 'Extras de carte funciară',
  fiscal_certificate: 'Certificat fiscal',
  energy_certificate: 'Certificat energetic',
  vizionare_sign: 'Fișă de vizionare',
  brokerage_contract: 'Contract de intermediere',
  owner_mandate: 'Mandatar proprietar',
  reservation_offer: 'Ofertă de rezervare',
  rental_contract: 'Contract de închiriere',
  handover_protocol: 'Protocol de predare',
  addendum: 'Act adițional',
  termination_notice: 'Notă de reziliere',
  other: 'Alt document',
}

// ============================================================================
// Required Documents for Appointments
// ============================================================================

export const REQUIRED_DOCUMENTS_FOR_APPOINTMENT: DocumentType[] = [
  'id_card',
  'proof_of_income',
]

export const OPTIONAL_DOCUMENTS_FOR_APPOINTMENT: DocumentType[] = [
  'ownership_title',
  'land_registry_excerpt',
  'fiscal_certificate',
  'energy_certificate',
]

// ============================================================================
// Workspace State Types
// ============================================================================

export interface AppointmentWorkspaceState {
  appointment: Appointment | null
  currentStep: AppointmentStep
  documents: DocumentChecklist[]
  signatures: Signature[]
  isLoading: boolean
  error: string | null
}

export interface ScheduleData {
  propertyId: string
  propertyTitle: string
  agentId: string
  agentName: string
  date: string
  startTime: string
  endTime: string
  notes?: string
}

export interface PrepareData {
  privacyAccepted: boolean
  documentsUploaded: string[] // document IDs
}

export interface SignData {
  documentId: string
  signatureMethod: SignatureMethod
  signatureName?: string
  signatureImageUrl?: string
  consentText: string
}

export interface ConfirmData {
  appointmentId: string
  allDocumentsUploaded: boolean
  allSignaturesComplete: boolean
}

// ============================================================================
// Supabase Response Types
// ============================================================================

export interface DocumentSignerRow {
  id: string
  document_id: string
  user_id: string
  signer_role: 'CLIENT' | 'OWNER' | 'AGENT' | 'ADMIN'
  status: 'PENDING' | 'SIGNED' | 'DECLINED'
  required: boolean
  signature_name: string | null
  signature_method: SignatureMethod | null
  consent_text: string | null
  document_checksum: string | null
  signed_at: string | null
  created_at: string
  updated_at: string
}

export interface DocumentEventRow {
  id: number
  document_id: string
  actor_id: string | null
  event_type: string
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type DocumentChecklistMap = Record<DocumentType, DocumentChecklist | undefined>

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatarInitials: string
  isActive: boolean
}

export interface AvailabilitySlot {
  id: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
  bookedBy: string | null
  bookedByName: string | null
}
