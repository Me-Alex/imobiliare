import type { PageKey } from '@/store/use-app-store'
import { LS_KEYS } from '@/lib/constants'
import { saveToLS } from '@/lib/storage'

const APPOINTMENT_PARAM = 'appointment'
const DEAL_PARAM = 'deal'

type Navigate = (page: PageKey) => void

function getUrl(): URL | null {
  if (typeof window === 'undefined') return null
  return new URL(window.location.href)
}

function replaceContext(page: PageKey, appointmentId?: string | null, dealId?: string | null) {
  const url = getUrl()
  if (!url) return
  url.searchParams.set('page', page)
  if (appointmentId) url.searchParams.set(APPOINTMENT_PARAM, appointmentId)
  else url.searchParams.delete(APPOINTMENT_PARAM)
  if (dealId) url.searchParams.set(DEAL_PARAM, dealId)
  else url.searchParams.delete(DEAL_PARAM)
  window.history.replaceState({ hqsPage: page, appointmentId, dealId }, '', `${url.pathname}${url.search}`)
}

export function readAppointmentContext(): string | null {
  return getUrl()?.searchParams.get(APPOINTMENT_PARAM) || null
}

export function readDealContext(): string | null {
  return getUrl()?.searchParams.get(DEAL_PARAM) || null
}

export function selectDocumentAppointment(appointmentId: string, dealId?: string | null) {
  saveToLS(LS_KEYS.SELECTED_VIZIONARE, appointmentId)
  replaceContext('documente', appointmentId, dealId)
}

export function openViewingDocuments(navigate: Navigate, appointmentId: string, dealId?: string | null) {
  saveToLS(LS_KEYS.SELECTED_VIZIONARE, appointmentId)
  navigate('documente')
  replaceContext('documente', appointmentId, dealId)
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
