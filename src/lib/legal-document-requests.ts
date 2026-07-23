/**
 * @deprecated This module is part of the legacy documents pipeline. New
 * code should import from `@/lib/documents` (the foundation module) or
 * `@/components/documents-v2` (the new visual surface). See
 * `src/lib/documents/README.md` for the migration plan. The module is
 * kept here for backwards compatibility with the 18+ files that still
 * depend on its types; do not add new consumers.
 */
import { supabase } from '@/lib/supabase'
import type { LegalDocumentKind } from '@/lib/legal-documents'
import type {
  LegalDocumentRequest,
  LegalDocumentRequestEvent,
  LegalDocumentRequestStatus,
} from '@/lib/types'

const REQUEST_SELECT = `
  id, appointment_id, requester_id, document_kind, status, submitted_data,
  notes, staff_note, fulfilled_document_id, handled_by, handled_at,
  created_at, updated_at,
  legal_document_request_events(id, actor_id, event_type, metadata, created_at)
`

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => typeof item === 'string')
      .map(([key, item]) => [key, String(item)]),
  )
}

function mapRequestEvent(row: Record<string, unknown>): LegalDocumentRequestEvent {
  return {
    id: Number(row.id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    eventType: String(row.event_type) as LegalDocumentRequestEvent['eventType'],
    metadata: (row.metadata as Record<string, unknown> | null) || {},
    createdAt: String(row.created_at),
  }
}

function mapRequest(row: Record<string, unknown>): LegalDocumentRequest {
  const events = Array.isArray(row.legal_document_request_events)
    ? row.legal_document_request_events
    : []
  return {
    id: String(row.id),
    appointmentId: String(row.appointment_id),
    requesterId: String(row.requester_id),
    documentKind: String(row.document_kind) as LegalDocumentRequest['documentKind'],
    status: String(row.status) as LegalDocumentRequestStatus,
    submittedData: stringRecord(row.submitted_data),
    notes: String(row.notes || ''),
    staffNote: String(row.staff_note || ''),
    fulfilledDocumentId: row.fulfilled_document_id ? String(row.fulfilled_document_id) : null,
    handledBy: row.handled_by ? String(row.handled_by) : null,
    handledAt: row.handled_at ? String(row.handled_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    events: events.map((item) => mapRequestEvent(item as Record<string, unknown>)),
  }
}

export async function listLegalDocumentRequests(appointmentId: string): Promise<LegalDocumentRequest[]> {
  const { data, error } = await supabase
    .from('legal_document_requests')
    .select(REQUEST_SELECT)
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapRequest(row as Record<string, unknown>))
}

export async function saveLegalDocumentRequest(input: {
  id?: string
  appointmentId: string
  requesterId: string
  documentKind: Exclude<LegalDocumentKind, 'viewing_report'>
  submittedData: Record<string, string>
  notes: string
}): Promise<LegalDocumentRequest> {
  const payload = {
    appointment_id: input.appointmentId,
    requester_id: input.requesterId,
    document_kind: input.documentKind,
    status: 'REQUESTED',
    submitted_data: input.submittedData,
    notes: input.notes.trim() || null,
    updated_at: new Date().toISOString(),
  }
  const query = input.id
    ? supabase.from('legal_document_requests').update(payload).eq('id', input.id)
    : supabase.from('legal_document_requests').insert(payload)
  const { data, error } = await query.select(REQUEST_SELECT).single()
  if (error) throw new Error(error.message)
  return mapRequest(data as Record<string, unknown>)
}

export async function cancelLegalDocumentRequest(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('legal_document_requests')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['REQUESTED', 'NEEDS_INFO'])
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Solicitarea nu mai poate fi anulată.')
}

export async function claimLegalDocumentRequests(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { data, error } = await supabase
    .from('legal_document_requests')
    .update({ status: 'IN_REVIEW', updated_at: new Date().toISOString() })
    .in('id', ids)
    .in('status', ['REQUESTED', 'IN_REVIEW'])
    .select('id')
  if (error) throw new Error(error.message)
  if ((data || []).length !== ids.length) {
    throw new Error('Una dintre solicitări și-a schimbat starea. Actualizează dosarul.')
  }
}

export async function setLegalDocumentRequestStatus(
  id: string,
  status: Extract<LegalDocumentRequestStatus, 'NEEDS_INFO' | 'REJECTED'>,
  staffNote: string,
): Promise<void> {
  if (staffNote.trim().length < 3) throw new Error('Explicația este obligatorie.')
  const { data, error } = await supabase
    .from('legal_document_requests')
    .update({
      status,
      staff_note: staffNote.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .in('status', status === 'NEEDS_INFO' ? ['REQUESTED', 'IN_REVIEW'] : ['REQUESTED', 'IN_REVIEW', 'NEEDS_INFO'])
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Starea solicitării s-a schimbat. Actualizează dosarul.')
}
