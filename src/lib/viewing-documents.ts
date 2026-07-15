import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type {
  DocumentEvent,
  DocumentSigner,
  ViewingDocument,
  ViewingDocumentType,
  Vizionare,
} from '@/lib/types'

const DOCUMENT_BUCKET = 'client-documents'
const SIGNING_TYPES = new Set<ViewingDocumentType>(['vizionare_sign', 'rental_contract'])

const FALLBACK_TEMPLATES: Record<'viewing_report' | 'rental_contract', string> = {
  viewing_report: `FISA DE VIZIONARE

Client: {{client_name}}
E-mail: {{client_email}}
Proprietate: {{property_title}}
Data: {{viewing_date}}
Interval: {{viewing_time}}
Agent: {{agent_name}}

Prin semnare, clientul confirma efectuarea vizionarii la data si ora indicate si faptul ca informatiile de mai sus sunt corecte.

Observatii:
{{notes}}

Semnatura electronica simpla si jurnalul de audit sunt pastrate separat de acest PDF.`,
  rental_contract: `CONTRACT DE INCHIRIERE - MODEL DE LUCRU

Parti:
PROPRIETAR: {{owner_name}}
LOCATAR: {{client_name}} ({{client_email}})

Proprietate: {{property_title}}
Adresa: {{property_address}}

Durata, chiria, garantia, obligatiile partilor si conditiile de incetare se completeaza si se verifica de parti inainte de semnare.

Acest model trebuie verificat juridic si completat cu toate clauzele aplicabile tranzactiei.

Semnatura electronica simpla si jurnalul de audit sunt pastrate separat de acest PDF.`,
}

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
  if (normalized === 'COMPLETED' || normalized === 'DONE') return 'completed'
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
    completedAt: normalizeViewingStatus(row.status) === 'completed'
      ? String(row.updated_at || row.end_at || '')
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
    signers: signerRows.map((item) => mapSigner(item as Record<string, unknown>)),
    events: eventRows.map((item) => mapEvent(item as Record<string, unknown>)),
  }
}

const DOCUMENT_SELECT = `
  id, appointment_id, property_id, template_id, user_id, title, type, status,
  visibility, storage_bucket, storage_path, file_name, mime_type, byte_size,
  checksum, version, created_at, locked_at, signed_at, signature_level,
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
      would_proceed, properties(title, address, owner_id)
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
}

export async function createViewing(input: CreateViewingInput): Promise<Vizionare> {
  const startAt = new Date(`${input.date}T${input.startTime}:00`)
  const endAt = new Date(`${input.date}T${input.endTime}:00`)
  let propertyUuid: string | null = null

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
    })
    .select(`
      id, client_id, client_name, client_email, requested_at, notes, status,
      property_id, property_reference, property_title, agent_id, staff_reference,
      staff_name, created_at, updated_at, start_at, end_at, rating, feedback,
      would_proceed, properties(title, address, owner_id)
    `)
    .single()

  if (error) throw new Error(error.message)
  return mapViewing(data as Record<string, unknown>)
}

export async function cancelViewing(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
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
}

export async function uploadViewingDocument(input: UploadDocumentInput): Promise<ViewingDocument> {
  const documentId = crypto.randomUUID()
  const safeName = sanitizeFileName(input.file.name)
  const storagePath = `${input.user.id}/${input.viewing.id}/${documentId}/v1-${safeName}`
  const checksum = await sha256(input.file)
  const isSigningDocument = SIGNING_TYPES.has(input.docType)
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
      status: isSigningDocument ? 'READY_TO_SIGN' : 'UPLOADED',
      visibility: isSigningDocument ? 'PARTICIPANTS' : 'PRIVATE',
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || 'application/octet-stream',
      byte_size: input.file.size,
      checksum,
      version: 1,
      uploaded_by: input.user.id,
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
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', signerId)
    .eq('user_id', userId)
    .eq('status', 'PENDING')
  if (error) throw new Error(error.message)
}

function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/{{([a-z_]+)}}/g, (_match, key: string) => values[key] || '________________')
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

export async function generateViewingDocument(
  kind: 'viewing_report' | 'rental_contract',
  user: User,
  viewing: Vizionare,
): Promise<ViewingDocument> {
  const { data: template } = await supabase
    .from('admin_document_templates')
    .select('id, name, body')
    .eq('type', kind)
    .eq('status', 'ACTIVE')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let propertyAddress = ''
  let ownerName = ''
  if (viewing.propertyUuid) {
    const { data: property } = await supabase
      .from('properties')
      .select('address, owner_id, profiles!properties_owner_id_fkey(full_name, name)')
      .eq('id', viewing.propertyUuid)
      .maybeSingle()
    propertyAddress = String(property?.address || '')
    const owner = relationRow(property?.profiles)
    ownerName = String(owner?.full_name || owner?.name || '')
  }

  const body = renderTemplate(template?.body || FALLBACK_TEMPLATES[kind], {
    client_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client HQS',
    client_email: user.email || '',
    property_title: viewing.propertyTitle,
    property_address: propertyAddress,
    owner_name: ownerName,
    viewing_date: viewing.date,
    viewing_time: `${viewing.startTime} - ${viewing.endTime}`,
    agent_name: viewing.staffName,
    notes: viewing.notes || 'Fara observatii.',
  })

  const isReport = kind === 'viewing_report'
  const title = isReport ? `Fisa de vizionare - ${viewing.propertyTitle}` : `Contract de inchiriere - ${viewing.propertyTitle}`
  const fileName = `${isReport ? 'fisa-vizionare' : 'contract-inchiriere'}-${viewing.date}.pdf`
  const file = await createPdfFile(title, body, fileName)

  return uploadViewingDocument({
    user,
    viewing,
    docType: isReport ? 'vizionare_sign' : 'rental_contract',
    file,
    title,
    templateId: template?.id || null,
  })
}
