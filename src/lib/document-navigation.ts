import type { PageKey } from '@/store/use-app-store'
import { LS_KEYS } from '@/lib/constants'
import { saveToLS } from '@/lib/storage'

const APPOINTMENT_PARAM = 'appointment'
const DEAL_PARAM = 'deal'
const DOCUMENT_FOCUS_PARAM = 'focus'

type Navigate = (page: PageKey) => void
export type DocumentFocusTarget = 'primary' | 'advanced' | 'archive'

interface DocumentContextOptions {
  focus?: DocumentFocusTarget | null
}

function getUrl(): URL | null {
  if (typeof window === 'undefined') return null
  return new URL(window.location.href)
}

function isDocumentFocusTarget(value: string | null): value is DocumentFocusTarget {
  return value === 'primary' || value === 'advanced' || value === 'archive'
}

function replaceContext(
  page: PageKey,
  appointmentId?: string | null,
  dealId?: string | null,
  options: DocumentContextOptions = {},
) {
  const url = getUrl()
  if (!url) return
  url.searchParams.set('page', page)
  if (appointmentId) url.searchParams.set(APPOINTMENT_PARAM, appointmentId)
  else url.searchParams.delete(APPOINTMENT_PARAM)
  if (dealId) url.searchParams.set(DEAL_PARAM, dealId)
  else url.searchParams.delete(DEAL_PARAM)
  if (page === 'documente') {
    if ('focus' in options) {
      if (options.focus) url.searchParams.set(DOCUMENT_FOCUS_PARAM, options.focus)
      else url.searchParams.delete(DOCUMENT_FOCUS_PARAM)
    }
  } else {
    url.searchParams.delete(DOCUMENT_FOCUS_PARAM)
  }
  window.history.replaceState({ hqsPage: page, appointmentId, dealId }, '', `${url.pathname}${url.search}`)
}

export function readAppointmentContext(): string | null {
  return getUrl()?.searchParams.get(APPOINTMENT_PARAM) || null
}

export function readDealContext(): string | null {
  return getUrl()?.searchParams.get(DEAL_PARAM) || null
}

export function readDocumentFocusContext(): DocumentFocusTarget | null {
  const value = getUrl()?.searchParams.get(DOCUMENT_FOCUS_PARAM) || null
  return isDocumentFocusTarget(value) ? value : null
}

export function clearDocumentFocusContext() {
  const url = getUrl()
  if (!url) return
  url.searchParams.delete(DOCUMENT_FOCUS_PARAM)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
}

export function selectDocumentAppointment(appointmentId: string, dealId?: string | null) {
  saveToLS(LS_KEYS.SELECTED_VIZIONARE, appointmentId)
  replaceContext('documente', appointmentId, dealId)
}

export function openViewingDocuments(
  navigate: Navigate,
  appointmentId: string,
  dealId?: string | null,
  options: DocumentContextOptions = {},
) {
  saveToLS(LS_KEYS.SELECTED_VIZIONARE, appointmentId)
  navigate('documente')
  replaceContext('documente', appointmentId, dealId, options)
}

export function openDealRoomForViewing(navigate: Navigate, appointmentId: string, dealId?: string | null) {
  navigate('deal-room')
  replaceContext('deal-room', appointmentId, dealId)
}

/**
 * Keeps the user inside the active transaction when the document workspace was
 * opened from a Deal Room. When there is no transaction context, callers can
 * still provide their most useful role-specific destination.
 */
export function returnToWorkflow(navigate: Navigate, fallback: PageKey) {
  const appointmentId = readAppointmentContext()
  const dealId = readDealContext()

  if (dealId) {
    navigate('deal-room')
    replaceContext('deal-room', appointmentId, dealId)
    return
  }

  navigate(fallback)
}

export function selectDealRoom(dealId: string, appointmentId?: string | null) {
  replaceContext('deal-room', appointmentId, dealId)
}
