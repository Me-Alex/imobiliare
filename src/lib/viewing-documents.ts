import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { VIEWING_BOOKING_TERMS, VIEWING_BOOKING_TERMS_VERSION } from '@/lib/constants'
import {
  getLegalDocumentDefinition,
  type LegalDocumentKind,
  type LegalSignatureRequirement,
} from '@/lib/legal-documents'
import type {
  DocumentEvent,
  DocumentSigner,
  ViewingDocument,
  ViewingDocumentType,
  Vizionare,
} from '@/lib/types'

const DOCUMENT_BUCKET = 'client-documents'

function relationRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function formatDatePart(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimePart(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function normalizeViewingStatus(value: unknown): Vizionare['status'] {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'CONFIRMED') return 'confirmed'
  if (normalized === 'CHECKED_IN') return 'checked_in'
  if (normalized === 'COMPLETED' || normalized === 'DONE') return 'completed'
  if (normalized === 'CANCELLED_BY_CLIENT') return 'cancelled_by_client'
  if (normalized === 'CANCELLED_BY_AGENT') return 'cancelled_by_agent'
  if (normalized === 'NO_SHOW') return 'no_show'
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') return 'cancelled'
  return 'pending'
}

function mapViewing(row: Record<string, unknown>): Vizionare {
  const start = new Date(String(row.start_at || row.requested_at || row.created_at))
  const end = row.end_at
    ? new Date(String(row.end_at))
    : new Date(start.getTime() + 60 * 60 * 1000)
  const property = relationRow(row.properties)

  return {
    id: String(row.id),
    clientId: row.client_id ? String(row.client_id) : null,
    ownerId: property?.owner_id ? String(property.owner_id) : null,
    propertyId: String(row.property_reference || row.property_id || ''),
    propertyUuid: row.property_id ? String(row.property_id) : null,
    propertyTitle: String(row.property_title || property?.title || 'Proprietate'),
    userId: String(row.client_id || ''),
    userName: String(row.client_name || 'Client'),
    userEmail: String(row.client_email || ''),
    staffId: String(row.staff_reference || row.agent_id || ''),
    staffName: String(row.staff_name || 'Agent HQS'),
    date: formatDatePart(start),
    startTime: formatTimePart(start),
    endTime: formatTimePart(end),
    status: normalizeViewingStatus(row.status),
    notes: String(row.notes || ''),
    createdAt: String(row.created_at || new Date().toISOString()),
    rating: row.rating == null ? undefined : Number(row.rating),
    feedback: row.feedback ? String(row.feedback) : undefined,
    wouldProceed: row.would_proceed == null ? undefined : Boolean(row.would_proceed),
    checkedInAt: row.checked_in_at ? String(row.checked_in_at) : undefined,
    completedAt: row.completed_at
      ? String(row.completed_at)
      : normalizeViewingStatus(row.status) === 'completed'
        ? String(row.updated_at || row.end_at || '')
        : undefined,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
    noShowMarkedAt: row.no_show_marked_at ? String(row.no_show_marked_at) : undefined,
    noShowEligibleAt: new Date(
      end.getTime() + Number(row.attendance_grace_minutes || 15) * 60_000,
    ).toISOString(),
    bookingTermsAcceptedAt: row.booking_terms_accepted_at
      ? String(row.booking_terms_accepted_at)
      : undefined,
  }
}

function mapSigner(row: Record<string, unknown>): DocumentSigner {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    role: String(row.signer_role) as DocumentSigner['role'],
    status: String(row.status) as DocumentSigner['status'],
    required: row.required !== false,
    signatureName: row.signature_name ? String(row.signature_name) : null,
    signatureMethod: row.signature_method
      ? String(row.signature_method) as DocumentSigner['signatureMethod']
      : null,
    documentChecksum: row.document_checksum ? String(row.document_checksum) : null,
    signedAt: row.signed_at ? String(row.signed_at) : null,
  }
}

function mapEvent(row: Record<string, unknown>): DocumentEvent {
  return {
    id: Number(row.id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    eventType: String(row.event_type) as DocumentEvent['eventType'],
    metadata: (row.metadata as Record<string, unknown> | null) || {},
    createdAt: String(row.created_at),
  }
}

function mapDocument(row: Record<string, unknown>): ViewingDocument {
  const signerRows = Array.isArray(row.document_signers) ? row.document_signers : []
  const eventRows = Array.isArray(row.document_events) ? row.document_events : []
  return {
    id: String(row.id),
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    propertyId: row.property_id ? String(row.property_id) : null,
    templateId: row.template_id ? String(row.template_id) : null,
    userId: String(row.user_id),
    title: String(row.title),
    docType: String(row.type) as ViewingDocumentType,
    status: String(row.status) as ViewingDocument['status'],
    visibility: String(row.visibility || 'PRIVATE') as ViewingDocument['visibility'],
    storageBucket: String(row.storage_bucket || DOCUMENT_BUCKET),
    storagePath: row.storage_path ? String(row.storage_path) : null,
    fileName: String(row.file_name || row.title),
    fileType: String(row.mime_type || 'application/octet-stream'),
    byteSize: Number(row.byte_size || 0),
    checksum: row.checksum ? String(row.checksum) : null,
    version: Number(row.version || 1),
    uploadedAt: String(row.created_at),
    lockedAt: row.locked_at ? String(row.locked_at) : null,
    signedAt: row.signed_at ? String(row.signed_at) : null,
    signatureLevel: row.signature_level ? String(row.signature_level) : null,
    signatureRequirement: String(row.signature_requirement || 'SIMPLE') as ViewingDocument['signatureRequirement'],
    templateName: row.template_name ? String(row.template_name) : null,
    templateVersion: row.template_version == null ? null : Number(row.template_version),
    legalVersion: row.legal_version ? String(row.legal_version) : null,
    consumerContract: Boolean(row.consumer_contract),
    fiscalRegistrationDueAt: row.fiscal_registration_due_at ? String(row.fiscal_registration_due_at) : null,
    retentionUntil: row.retention_until ? String(row.retention_until) : null,
    signers: signerRows.map((item) => mapSigner(item as Record<string, unknown>)),
    events: eventRows.map((item) => mapEvent(item as Record<string, unknown>)),
  }
}

const DOCUMENT_SELECT = `
  id, appointment_id, property_id, template_id, user_id, title, type, status,
  visibility, storage_bucket, storage_path, file_name, mime_type, byte_size,
  checksum, version, created_at, locked_at, signed_at, signature_level,
  signature_requirement, template_name, template_version, legal_version,
  consumer_contract, fiscal_registration_due_at, retention_until,
  document_signers(id, user_id, signer_role, status, required, signature_name,
    signature_method, document_checksum, signed_at),
  document_events(id, actor_id, event_type, metadata, created_at)
`

export async function listViewings(): Promise<Vizionare[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, client_id, client_name, client_email, requested_at, notes, status,
      property_id, property_reference, property_title, agent_id, staff_reference,
      staff_name, created_at, updated_at, start_at, end_at, rating, feedback,
      would_proceed, checked_in_at, completed_at, cancellation_reason,
      no_show_marked_at, attendance_grace_minutes, booking_terms_accepted_at,
      properties(title, address, owner_id)
    `)
    .order('start_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapViewing(row as Record<string, unknown>))
}

export interface CreateViewingInput {
  user: User
  propertyId: string
  propertyTitle: string
  staffId: string
  staffName: string
  date: string
  startTime: string
  endTime: string
  notes: string
  termsAccepted: boolean
  privacyAccepted: boolean
}

export async function createViewing(input: CreateViewingInput): Promise<Vizionare> {
  const startAt = new Date(`${input.date}T${input.startTime}:00`)
  const endAt = new Date(`${input.date}T${input.endTime}:00`)
  if (!input.termsAccepted || !input.privacyAccepted) {
    throw new Error('Acceptă regulile programării și informarea de confidențialitate.')
  }
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    throw new Error('Intervalul selectat nu este valid.')
  }
  if (startAt.getTime() <= Date.now()) {
    throw new Error('Programarea trebuie să fie într-un interval viitor.')
  }
  let propertyUuid: string | null = null

  const agency = await getAgencyLegalProfile()
  if (!agency || agency.status !== 'ACTIVE' || !agency.privacyNoticeUrl || !agency.privacyNoticeVersion) {
    throw new Error('Agenția trebuie să publice informarea GDPR înainte de a accepta programări.')
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.propertyId)) {
    const { data } = await supabase
      .from('properties')
      .select('id')
      .eq('id', input.propertyId)
      .maybeSingle()
    propertyUuid = data?.id || null
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      client_id: input.user.id,
      client_name: input.user.user_metadata?.full_name || input.user.email?.split('@')[0] || 'Client HQS',
      client_email: input.user.email || '',
      requested_at: new Date().toISOString(),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      property_id: propertyUuid,
      property_reference: input.propertyId,
      property_title: input.propertyTitle,
      staff_reference: input.staffId,
      staff_name: input.staffName,
      status: 'PENDING',
      notes: input.notes.trim() || null,
      source_id: crypto.randomUUID(),
      attendance_grace_minutes: VIEWING_BOOKING_TERMS.grace_minutes,
      booking_terms_version: VIEWING_BOOKING_TERMS_VERSION,
      booking_terms_accepted_at: new Date().toISOString(),
      booking_terms_snapshot: {
        ...VIEWING_BOOKING_TERMS,
        privacy_notice_version: agency.privacyNoticeVersion,
        privacy_notice_url: agency.privacyNoticeUrl,
      },
      privacy_notice_version: agency.privacyNoticeVersion,
    })
    .select(`
      id, client_id, client_name, client_email, requested_at, notes, status,
      property_id, property_reference, property_title, agent_id, staff_reference,
      staff_name, created_at, updated_at, start_at, end_at, rating, feedback,
      would_proceed, checked_in_at, completed_at, cancellation_reason,
      no_show_marked_at, attendance_grace_minutes, booking_terms_accepted_at,
      properties(title, address, owner_id)
    `)
    .single()

  if (error) throw new Error(error.message)
  return mapViewing(data as Record<string, unknown>)
}

async function transitionViewing(
  id: string,
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED_BY_CLIENT' | 'CANCELLED_BY_AGENT' | 'NO_SHOW',
  reason?: string,
): Promise<void> {
  const payload: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (reason?.trim()) payload.cancellation_reason = reason.trim()
  const { data, error } = await supabase
    .from('appointments')
    .update(payload)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Tranziția nu este permisă pentru acest cont sau în starea curentă.')
}

export async function cancelViewing(id: string, reason = 'Anulare solicitată de client'): Promise<void> {
  await transitionViewing(id, 'CANCELLED_BY_CLIENT', reason)
}

export async function cancelViewingByAgent(id: string, reason: string): Promise<void> {
  if (reason.trim().length < 3) throw new Error('Motivul anulării este obligatoriu.')
  await transitionViewing(id, 'CANCELLED_BY_AGENT', reason)
}

export async function confirmViewing(id: string): Promise<void> {
  await transitionViewing(id, 'CONFIRMED')
}

export async function checkInViewing(id: string): Promise<void> {
  await transitionViewing(id, 'CHECKED_IN')
}

export async function completeViewing(id: string): Promise<void> {
  await transitionViewing(id, 'COMPLETED')
}

export async function markViewingNoShow(id: string): Promise<void> {
  await transitionViewing(id, 'NO_SHOW')
}

export async function saveViewingFeedback(
  id: string,
  input: { rating: number; feedback: string; wouldProceed: boolean; notes?: string },
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      rating: input.rating,
      feedback: input.feedback.trim() || null,
      would_proceed: input.wouldProceed,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listViewingDocuments(appointmentId?: string): Promise<ViewingDocument[]> {
  let query = supabase
    .from('client_documents')
    .select(DOCUMENT_SELECT)
    .order('created_at', { ascending: false })

  if (appointmentId) query = query.eq('appointment_id', appointmentId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapDocument(row as Record<string, unknown>))
}

function sanitizeFileName(value: string): string {
  const cleaned = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-')
  return cleaned.replace(/^[-.]+|[-.]+$/g, '').slice(0, 120) || 'document'
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export interface UploadDocumentInput {
  user: User
  viewing: Vizionare
  docType: ViewingDocumentType
  file: File
  title?: string
  templateId?: string | null
  status?: ViewingDocument['status']
  legal?: {
    templateName: string
    templateVersion: number
    legalVersion: string
    templateSnapshot: Record<string, unknown>
    documentData: Record<string, string>
    legalBasis: unknown[]
    signatureRequirement: LegalSignatureRequirement
    consumerContract: boolean
    withdrawalNoticeVersion?: string | null
    fiscalRegistrationDueAt?: string | null
    retentionUntil?: string | null
  }
}

export async function uploadViewingDocument(input: UploadDocumentInput): Promise<ViewingDocument> {
  const documentId = crypto.randomUUID()
  const safeName = sanitizeFileName(input.file.name)
  const storagePath = `${input.user.id}/${input.viewing.id}/${documentId}/v1-${safeName}`
  const checksum = await sha256(input.file)
  const documentOwnerId = input.viewing.clientId || input.viewing.userId || input.user.id

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: '3600',
      contentType: input.file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      id: documentId,
      user_id: documentOwnerId,
      appointment_id: input.viewing.id,
      property_id: input.viewing.propertyUuid || null,
      template_id: input.templateId || null,
      title: input.title || input.file.name,
      type: input.docType,
      status: input.status || 'UPLOADED',
      visibility: input.legal ? 'PARTICIPANTS' : 'PRIVATE',
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || 'application/octet-stream',
      byte_size: input.file.size,
      checksum,
      version: 1,
      uploaded_by: input.user.id,
      template_name: input.legal?.templateName || null,
      template_version: input.legal?.templateVersion || null,
      legal_version: input.legal?.legalVersion || null,
      template_snapshot: input.legal?.templateSnapshot || {},
      document_data: input.legal?.documentData || {},
      legal_basis_snapshot: input.legal?.legalBasis || [],
      signature_requirement: input.legal?.signatureRequirement || 'SIMPLE',
      consumer_contract: input.legal?.consumerContract || false,
      withdrawal_notice_version: input.legal?.withdrawalNoticeVersion || null,
      fiscal_registration_due_at: input.legal?.fiscalRegistrationDueAt || null,
      retention_until: input.legal?.retentionUntil || null,
      jurisdiction: 'RO',
    })
    .select(DOCUMENT_SELECT)
    .single()

  if (error) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath])
    throw new Error(error.message)
  }

  return mapDocument(data as Record<string, unknown>)
}

export async function deleteViewingDocument(document: ViewingDocument): Promise<void> {
  if (document.lockedAt || document.status === 'SIGNED' || document.status === 'PARTIALLY_SIGNED') {
    throw new Error('Documentele semnate sau aflate in semnare nu pot fi sterse.')
  }

  if (document.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(document.storageBucket)
      .remove([document.storagePath])
    if (storageError) throw new Error(storageError.message)
  }

  const { error } = await supabase.from('client_documents').delete().eq('id', document.id)
  if (error) throw new Error(error.message)
}

export async function createDocumentUrl(document: ViewingDocument, download = false): Promise<string> {
  if (!document.storagePath) throw new Error('Documentul nu are un fisier asociat.')
  const { data, error } = await supabase.storage
    .from(document.storageBucket)
    .createSignedUrl(document.storagePath, 120, download ? { download: document.fileName } : undefined)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Nu s-a putut deschide documentul.')
  return data.signedUrl
}

export async function signViewingDocument(
  signerId: string,
  userId: string,
  signatureName: string,
): Promise<void> {
  const consent = 'Confirm ca am citit documentul, ca datele sunt corecte si ca doresc sa il semnez electronic.'
  const { error } = await supabase
    .from('document_signers')
    .update({
      status: 'SIGNED',
      signature_name: signatureName.trim(),
      signature_method: 'TYPED',
      consent_text: consent,
      consent_version: 'RO-SIGN-1.0',
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', signerId)
    .eq('user_id', userId)
    .eq('status', 'PENDING')
  if (error) throw new Error(error.message)
}

function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/{{([a-z0-9_]+)}}/g, (_match, key: string) => values[key] || '________________')
}

function pdfSafeText(value: string): string {
  return value
    .replace(/[ȘŞ]/g, 'S')
    .replace(/[șş]/g, 's')
    .replace(/[ȚŢ]/g, 'T')
    .replace(/[țţ]/g, 't')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
}

function wrapLine(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!value.trim()) return ['']
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawHeader(page: PDFPage, font: PDFFont, bold: PDFFont): number {
  const { height, width } = page.getSize()
  page.drawText('HQS IMOBILIARE', { x: 48, y: height - 48, size: 10, font: bold, color: rgb(0.12, 0.42, 0.36) })
  page.drawText('Document electronic', { x: width - 150, y: height - 48, size: 9, font, color: rgb(0.45, 0.45, 0.45) })
  page.drawLine({ start: { x: 48, y: height - 58 }, end: { x: width - 48, y: height - 58 }, thickness: 1, color: rgb(0.86, 0.88, 0.87) })
  return height - 84
}

async function createPdfFile(title: string, body: string, fileName: string): Promise<File> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(title)
  pdf.setAuthor('HQS Imobiliare')
  pdf.setCreationDate(new Date())
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const size = 10.5
  const lineHeight = 15
  const margin = 48
  let page = pdf.addPage([595.28, 841.89])
  let y = drawHeader(page, font, bold)

  for (const paragraph of pdfSafeText(body).split('\n')) {
    const paragraphLines = wrapLine(paragraph, font, size, page.getWidth() - margin * 2)
    for (const line of paragraphLines) {
      if (y < 64) {
        page = pdf.addPage([595.28, 841.89])
        y = drawHeader(page, font, bold)
      }
      const isHeading = line.length > 0 && line === line.toUpperCase() && line.length < 80
      page.drawText(line, {
        x: margin,
        y,
        size: isHeading ? 11.5 : size,
        font: isHeading ? bold : font,
        color: rgb(0.12, 0.14, 0.13),
      })
      y -= lineHeight
    }
    y -= 5
  }

  for (const [index, currentPage] of pdf.getPages().entries()) {
    currentPage.drawText(`Pagina ${index + 1} din ${pdf.getPageCount()}`, {
      x: currentPage.getWidth() - 120,
      y: 28,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  const bytes = await pdf.save()
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return new File([arrayBuffer], fileName, { type: 'application/pdf', lastModified: Date.now() })
}

export interface AgencyLegalProfile {
  id: string
  status: 'INCOMPLETE' | 'ACTIVE' | 'ARCHIVED'
  legalName: string
  tradeName: string
  legalForm: string
  cui: string
  tradeRegistryNumber: string
  registeredOffice: string
  correspondenceAddress: string
  email: string
  phone: string
  representativeName: string
  representativeCapacity: string
  iban: string
  bankName: string
  privacyNoticeUrl: string
  privacyNoticeVersion: string
  consumerNoticeVersion: string
}

export type AgencyLegalProfileInput = Omit<AgencyLegalProfile, 'id' | 'status'>

export interface LegalTemplateSummary {
  id: string
  name: string
  type: string
  version: number
  legalVersion: string
  legalBasis: unknown[]
  requiredFields: string[]
  signatureRequirement: LegalSignatureRequirement
  consumerWithdrawalRequired: boolean
  legalReviewStatus: 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED'
  legalReviewerName: string | null
  legalReviewedAt: string | null
  body?: string
}

export interface LegalDocumentContext {
  template: LegalTemplateSummary
  values: Record<string, string>
  agencyProfile: AgencyLegalProfile | null
  agencyReady: boolean
}

function mapAgencyLegalProfile(row: Record<string, unknown>): AgencyLegalProfile {
  return {
    id: String(row.id),
    status: String(row.status) as AgencyLegalProfile['status'],
    legalName: String(row.legal_name || ''),
    tradeName: String(row.trade_name || ''),
    legalForm: String(row.legal_form || ''),
    cui: String(row.cui || ''),
    tradeRegistryNumber: String(row.trade_registry_number || ''),
    registeredOffice: String(row.registered_office || ''),
    correspondenceAddress: String(row.correspondence_address || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    representativeName: String(row.representative_name || ''),
    representativeCapacity: String(row.representative_capacity || ''),
    iban: String(row.iban || ''),
    bankName: String(row.bank_name || ''),
    privacyNoticeUrl: String(row.privacy_notice_url || ''),
    privacyNoticeVersion: String(row.privacy_notice_version || '1.0'),
    consumerNoticeVersion: String(row.consumer_notice_version || '1.0'),
  }
}

function mapLegalTemplate(row: Record<string, unknown>, withBody = false): LegalTemplateSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    version: Number(row.version || 1),
    legalVersion: String(row.legal_version || ''),
    legalBasis: Array.isArray(row.legal_basis) ? row.legal_basis : [],
    requiredFields: Array.isArray(row.required_fields) ? row.required_fields.map(String) : [],
    signatureRequirement: String(row.signature_requirement || 'SIMPLE') as LegalSignatureRequirement,
    consumerWithdrawalRequired: Boolean(row.consumer_withdrawal_required),
    legalReviewStatus: String(row.legal_review_status || 'REVIEW_REQUIRED') as LegalTemplateSummary['legalReviewStatus'],
    legalReviewerName: row.legal_reviewer_name ? String(row.legal_reviewer_name) : null,
    legalReviewedAt: row.legal_reviewed_at ? String(row.legal_reviewed_at) : null,
    body: withBody ? String(row.body || '') : undefined,
  }
}

const AGENCY_PROFILE_SELECT = `
  id, status, legal_name, trade_name, legal_form, cui, trade_registry_number,
  registered_office, correspondence_address, email, phone,
  representative_name, representative_capacity, iban, bank_name,
  privacy_notice_url, privacy_notice_version, consumer_notice_version
`

const LEGAL_TEMPLATE_SELECT = `
  id, name, type, body, version, legal_version, legal_basis, required_fields,
  signature_requirement, consumer_withdrawal_required, legal_review_status,
  legal_reviewer_name, legal_reviewed_at
`

export async function getAgencyLegalProfile(): Promise<AgencyLegalProfile | null> {
  const { data, error } = await supabase
    .from('agency_legal_profiles')
    .select(AGENCY_PROFILE_SELECT)
    .eq('is_current', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapAgencyLegalProfile(data as Record<string, unknown>) : null
}

export async function saveAgencyLegalProfile(
  userId: string,
  input: AgencyLegalProfileInput,
  existingId?: string,
): Promise<AgencyLegalProfile> {
  const payload = {
    is_current: true,
    status: 'ACTIVE',
    legal_name: input.legalName.trim(),
    trade_name: input.tradeName.trim(),
    legal_form: input.legalForm.trim(),
    cui: input.cui.trim(),
    trade_registry_number: input.tradeRegistryNumber.trim(),
    registered_office: input.registeredOffice.trim(),
    correspondence_address: input.correspondenceAddress.trim() || null,
    email: input.email.trim(),
    phone: input.phone.trim(),
    representative_name: input.representativeName.trim(),
    representative_capacity: input.representativeCapacity.trim(),
    iban: input.iban.trim() || null,
    bank_name: input.bankName.trim() || null,
    privacy_notice_url: input.privacyNoticeUrl.trim(),
    privacy_notice_version: input.privacyNoticeVersion.trim(),
    consumer_notice_version: input.consumerNoticeVersion.trim(),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }

  const query = existingId
    ? supabase.from('agency_legal_profiles').update(payload).eq('id', existingId)
    : supabase.from('agency_legal_profiles').insert(payload)
  const { data, error } = await query.select(AGENCY_PROFILE_SELECT).single()
  if (error) throw new Error(error.message)
  return mapAgencyLegalProfile(data as Record<string, unknown>)
}

export async function listLegalTemplates(): Promise<LegalTemplateSummary[]> {
  const { data, error } = await supabase
    .from('admin_document_templates')
    .select(LEGAL_TEMPLATE_SELECT)
    .eq('status', 'ACTIVE')
    .not('legal_version', 'is', null)
    .order('type')
  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapLegalTemplate(row as Record<string, unknown>))
}

export async function approveLegalTemplate(
  templateId: string,
  userId: string,
  reviewerName: string,
): Promise<void> {
  if (reviewerName.trim().length < 3) throw new Error('Introdu numele complet al revizorului juridic.')
  const { error } = await supabase
    .from('admin_document_templates')
    .update({
      legal_review_status: 'APPROVED',
      legal_reviewed_by: userId,
      legal_reviewer_name: reviewerName.trim(),
      legal_reviewed_at: new Date().toISOString(),
    })
    .eq('id', templateId)
  if (error) throw new Error(error.message)
}

function inputDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function inputDateTime(value: Date): string {
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

function plusDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function plusYears(value: Date, years: number): Date {
  const next = new Date(value)
  next.setFullYear(next.getFullYear() + years)
  return next
}

export async function loadLegalDocumentContext(
  kind: LegalDocumentKind,
  user: User,
  viewing: Vizionare,
): Promise<LegalDocumentContext> {
  const definition = getLegalDocumentDefinition(kind)
  const [templateResult, agencyResult, appointmentResult] = await Promise.all([
    supabase
      .from('admin_document_templates')
      .select(LEGAL_TEMPLATE_SELECT)
      .eq('type', definition.templateType)
      .eq('status', 'ACTIVE')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agency_legal_profiles')
      .select(AGENCY_PROFILE_SELECT)
      .eq('is_current', true)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select(`
        id, client_id, client_name, client_email, client_phone, agent_id,
        property_reference, property_title, status, checked_in_at, completed_at,
        properties(id, title, address, price, currency, transaction_type, owner_id,
          profiles!properties_owner_id_fkey(full_name, name, email, phone))
      `)
      .eq('id', viewing.id)
      .maybeSingle(),
  ])

  if (templateResult.error) throw new Error(templateResult.error.message)
  if (!templateResult.data) throw new Error('Șablonul juridic activ nu este disponibil.')
  if (agencyResult.error) throw new Error(agencyResult.error.message)
  if (appointmentResult.error) throw new Error(appointmentResult.error.message)

  const template = mapLegalTemplate(templateResult.data as Record<string, unknown>, true)
  if (!template.body || template.body.trim().length < 200) {
    throw new Error('Șablonul juridic este incomplet și nu poate fi folosit.')
  }

  const agency = agencyResult.data
    ? mapAgencyLegalProfile(agencyResult.data as Record<string, unknown>)
    : null
  const appointment = (appointmentResult.data || {}) as Record<string, unknown>
  if (kind === 'viewing_report' && (
    !['COMPLETED', 'DONE'].includes(String(appointment.status || '').toUpperCase())
    || !appointment.checked_in_at
    || !appointment.completed_at
  )) {
    throw new Error('Fișa se generează numai după ce agentul confirmă prezența și finalizează vizionarea.')
  }
  const property = relationRow(appointment.properties)
  const owner = relationRow(property?.profiles)
  let clientProfile: Record<string, unknown> | null = null
  if (appointment.client_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, name, email, phone')
      .eq('id', String(appointment.client_id))
      .maybeSingle()
    clientProfile = data as Record<string, unknown> | null
  }

  const now = new Date()
  const leaseStart = inputDate(now)
  const leaseEnd = inputDate(plusYears(now, 1))
  const clientName = String(
    clientProfile?.full_name
      || clientProfile?.name
      || appointment.client_name
      || user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || '',
  )
  const propertyAddress = String(property?.address || '')
  const propertyTitle = String(appointment.property_title || property?.title || viewing.propertyTitle)
  const privacyUrl = agency?.privacyNoticeUrl || ''

  const values: Record<string, string> = {
    legal_version: template.legalVersion,
    document_reference: `HQS-${inputDate(now).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    agency_legal_name: agency?.legalName || '',
    agency_cui: agency?.cui || '',
    agency_trade_registry: agency?.tradeRegistryNumber || '',
    agency_registered_office: agency?.registeredOffice || '',
    agency_email: agency?.email || '',
    agency_phone: agency?.phone || '',
    agency_representative: agency
      ? `${agency.representativeName}, ${agency.representativeCapacity}`
      : '',
    agent_name: viewing.staffName || '',
    client_name: clientName,
    client_email: String(clientProfile?.email || appointment.client_email || user.email || ''),
    client_phone: String(clientProfile?.phone || appointment.client_phone || ''),
    client_id_document: '',
    client_address: '',
    owner_name: String(owner?.full_name || owner?.name || ''),
    owner_email: String(owner?.email || ''),
    owner_phone: String(owner?.phone || ''),
    owner_id_document: '',
    owner_address: '',
    owner_payment_account: agency?.iban || '',
    property_title: propertyTitle,
    property_reference: String(appointment.property_reference || viewing.propertyId || ''),
    property_address: propertyAddress,
    property_cadastral: '',
    property_description: propertyTitle,
    property_encumbrances: '',
    ownership_title: '',
    transaction_type: String(property?.transaction_type || 'închiriere').toLocaleLowerCase('ro-RO'),
    asking_price: property?.price == null ? '' : String(property.price),
    offered_price: property?.price == null ? '' : String(property.price),
    currency: String(property?.currency || 'EUR'),
    viewing_date: viewing.date,
    viewing_time: `${viewing.startTime} - ${viewing.endTime}`,
    actual_check_in_at: appointment.checked_in_at
      ? new Date(String(appointment.checked_in_at)).toLocaleString('ro-RO')
      : '',
    actual_completed_at: appointment.completed_at
      ? new Date(String(appointment.completed_at)).toLocaleString('ro-RO')
      : '',
    notes: viewing.notes || 'Fără observații.',
    contract_start_date: inputDate(now),
    contract_end_date: inputDate(plusYears(now, 1)),
    exclusivity_type: 'neexclusiv',
    commission_value: '',
    commission_unit: '% din prețul tranzacției',
    vat_treatment: 'se adaugă TVA conform cotei legale aplicabile',
    commission_example: '',
    commission_due_event: '',
    commission_payment_term: '',
    protection_period: '',
    termination_notice: '30 de zile calendaristice',
    marketing_channels: 'site-ul agenției și portalurile imobiliare aprobate de Proprietar',
    privacy_notice_url: privacyUrl,
    privacy_notice_version: agency?.privacyNoticeVersion || '',
    offer_conditions: '',
    offer_valid_until: inputDateTime(plusDays(now, 3)),
    reservation_amount: '',
    reservation_payment_method: 'transfer bancar',
    reservation_holder: '',
    reservation_legal_nature: '',
    refund_conditions: '',
    retention_conditions: '',
    due_diligence_deadline: inputDate(plusDays(now, 10)),
    notary_or_lawyer: '',
    reservation_end_event: '',
    rental_purpose: 'locuință',
    occupants: clientName,
    pets_policy: 'numai cu acordul prealabil scris al Locatorului',
    lease_start_date: leaseStart,
    lease_end_date: leaseEnd,
    handover_date: leaseStart,
    rent_amount: property?.price == null ? '' : String(property.price),
    rent_due_day: '5',
    rent_payment_method: 'transfer bancar',
    exchange_rate_rule: 'cursul BNR din ziua plății',
    rent_adjustment_rule: 'numai prin act adițional acceptat de ambele părți',
    deposit_amount: property?.price == null ? '' : String(property.price),
    deposit_return_term: '15 zile calendaristice',
    tenant_costs: 'utilitățile și cheltuielile de consum individual aferente perioadei de folosință',
    landlord_costs: 'impozitele proprietății și reparațiile care revin locatorului potrivit legii',
    inspection_notice: '48 de ore',
    fiscal_registration_due_date: inputDate(plusDays(now, 30)),
    rental_contract_date: inputDate(now),
    handover_date_time: inputDateTime(now),
    property_condition: '',
    existing_defects: '',
    photo_evidence_reference: '',
    electricity_meter: '',
    gas_meter: '',
    cold_water_meter: '',
    hot_water_meter: '',
    other_meters: 'Nu se aplică',
    keys_and_access_devices: '',
    remaining_key_holders: '',
    inventory: '',
    delivered_documents: '',
    handover_payments: '',
  }

  return {
    template,
    values,
    agencyProfile: agency,
    agencyReady: !definition.requiresAgencyProfile || agency?.status === 'ACTIVE',
  }
}

function validateLegalValues(
  kind: LegalDocumentKind,
  template: LegalTemplateSummary,
  values: Record<string, string>,
): void {
  const missing = template.requiredFields.filter((key) => !values[key]?.trim())
  if (missing.length > 0) {
    throw new Error(`Completează toate câmpurile obligatorii: ${missing.join(', ')}.`)
  }

  const datePairs: Array<[string, string]> = kind === 'rental_contract'
    ? [['lease_start_date', 'lease_end_date']]
    : kind === 'brokerage_agreement' || kind === 'owner_mandate'
      ? [['contract_start_date', 'contract_end_date']]
      : []
  for (const [startKey, endKey] of datePairs) {
    if (new Date(values[endKey]).getTime() <= new Date(values[startKey]).getTime()) {
      throw new Error('Data încetării trebuie să fie ulterioară datei începerii.')
    }
  }

  if (kind === 'rental_contract') {
    const dueDay = Number(values.rent_due_day)
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      throw new Error('Ziua scadenței chiriei trebuie să fie între 1 și 31.')
    }
  }
}

function slugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function generateLegalDocument(input: {
  kind: LegalDocumentKind
  user: User
  viewing: Vizionare
  values: Record<string, string>
  consumerContract?: boolean
}): Promise<ViewingDocument> {
  const definition = getLegalDocumentDefinition(input.kind)
  const context = await loadLegalDocumentContext(input.kind, input.user, input.viewing)
  if (!context.agencyReady) {
    throw new Error('Profilul juridic al agenției trebuie completat și activat de administrator.')
  }

  const trustedKeys = new Set(
    definition.fields.filter((field) => field.readOnly).map((field) => field.key),
  )
  const values = Object.fromEntries(
    Object.entries({ ...context.values, ...input.values }).map(([key, value]) => [key, String(value || '').trim()]),
  )
  for (const key of trustedKeys) values[key] = context.values[key] || ''
  values.legal_version = context.template.legalVersion
  values.document_reference = context.values.document_reference

  validateLegalValues(input.kind, context.template, values)
  const body = renderTemplate(context.template.body || '', values)
  if (/{{[a-z0-9_]+}}/.test(body)) {
    throw new Error('Șablonul conține câmpuri care nu au fost rezolvate.')
  }

  const reviewed = context.template.legalReviewStatus === 'APPROVED'
  const status: ViewingDocument['status'] = reviewed
    && context.template.signatureRequirement === 'SIMPLE'
    ? 'READY_TO_SIGN'
    : 'DRAFT'
  const title = `${definition.title} - ${input.viewing.propertyTitle}`
  const fileName = `${slugPart(definition.shortTitle)}-${input.viewing.date}-${context.template.legalVersion}.pdf`
  const file = await createPdfFile(title, body, fileName)

  return uploadViewingDocument({
    user: input.user,
    viewing: input.viewing,
    docType: definition.documentType,
    file,
    title,
    templateId: context.template.id,
    status,
    legal: {
      templateName: context.template.name,
      templateVersion: context.template.version,
      legalVersion: context.template.legalVersion,
      templateSnapshot: {
        id: context.template.id,
        name: context.template.name,
        type: context.template.type,
        body: context.template.body,
        version: context.template.version,
        legal_version: context.template.legalVersion,
        legal_review_status: context.template.legalReviewStatus,
        legal_reviewer_name: context.template.legalReviewerName,
        legal_reviewed_at: context.template.legalReviewedAt,
      },
      documentData: values,
      legalBasis: context.template.legalBasis,
      signatureRequirement: context.template.signatureRequirement,
      consumerContract: Boolean(input.consumerContract),
      withdrawalNoticeVersion: input.consumerContract
        ? context.agencyProfile?.consumerNoticeVersion || null
        : null,
      fiscalRegistrationDueAt: input.kind === 'rental_contract'
        ? values.fiscal_registration_due_date
        : null,
    },
  })
}
