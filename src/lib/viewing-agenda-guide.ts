import type { AccountRole } from '@/lib/account-roles'
import type { Vizionare } from '@/lib/types'
import { getViewingGuidance, type ViewingAudience, type ViewingPrimaryAction } from '@/lib/viewing-guidance'

export type ViewingAgendaActionTarget = ViewingPrimaryAction | 'schedule' | 'active_tab' | 'history_tab'
export type ViewingAgendaTone = 'primary' | 'warning' | 'success' | 'neutral'

export interface ViewingAgendaAction {
  target: ViewingAgendaActionTarget
  label: string
  viewingId?: string
}

export interface ViewingAgendaCard {
  id: 'now' | 'queue' | 'documents' | 'history'
  title: string
  description: string
  badgeLabel: string
  tone: ViewingAgendaTone
  action: ViewingAgendaAction
}

export interface ViewingAgendaGuide {
  headline: string
  description: string
  primaryAction: ViewingAgendaAction
  cards: readonly ViewingAgendaCard[]
  metrics: {
    active: number
    pending: number
    confirmed: number
    checkedIn: number
    completed: number
    needsFeedback: number
    readyForDocuments: number
    readyForDealRoom: number
    reschedulable: number
    history: number
  }
}

interface ViewingAgendaGuideInput {
  role: AccountRole
  userId: string
  viewings: readonly Vizionare[]
}

const ACTIVE_STATUSES = new Set<Vizionare['status']>(['pending', 'confirmed', 'checked_in'])
const HISTORY_STATUSES = new Set<Vizionare['status']>([
  'completed',
  'cancelled',
  'cancelled_by_client',
  'cancelled_by_agent',
  'no_show',
])

const ACTION_PRIORITY: Record<ViewingPrimaryAction, number> = {
  confirm: 100,
  check_in: 95,
  complete: 90,
  feedback: 85,
  documents: 80,
  deal_room: 75,
  reschedule: 70,
  none: 0,
}

function isStaffRole(role: AccountRole) {
  return role === 'AGENT' || role === 'ADMIN'
}

function audienceFor(role: AccountRole, userId: string, viewing: Vizionare): ViewingAudience {
  if (isStaffRole(role)) return 'staff'
  if (role === 'CLIENT' && viewing.clientId === userId) return 'client'
  return 'observer'
}

function sortByTime(a: Vizionare, b: Vizionare) {
  return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
}

function reverseByTime(a: Vizionare, b: Vizionare) {
  return b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
}

function plural(value: number, singular: string, pluralValue: string) {
  return `${value} ${value === 1 ? singular : pluralValue}`
}

function viewingLabel(viewing: Vizionare) {
  return `${viewing.propertyTitle} · ${viewing.date}, ${viewing.startTime}`
}

function buildAction(viewing: Vizionare, action: ViewingPrimaryAction): ViewingAgendaAction {
  const labels: Record<ViewingPrimaryAction, string> = {
    confirm: 'Confirmă programarea',
    check_in: 'Confirmă prezența',
    complete: 'Finalizează vizionarea',
    feedback: 'Adaugă feedback',
    documents: 'Deschide documentele',
    deal_room: 'Deschide Deal Room',
    reschedule: 'Reprogramează',
    none: 'Vezi vizionarea',
  }

  return {
    target: action === 'none' ? 'active_tab' : action,
    label: labels[action],
    viewingId: viewing.id,
  }
}

function pickPrimary(role: AccountRole, userId: string, viewings: readonly Vizionare[]) {
  const candidates = [...viewings]
    .map((viewing) => {
      const guidance = getViewingGuidance(viewing, audienceFor(role, userId, viewing))
      return { viewing, guidance, score: ACTION_PRIORITY[guidance.action] }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || sortByTime(a.viewing, b.viewing))

  return candidates[0] ?? null
}

export function getViewingAgendaGuide({
  role,
  userId,
  viewings,
}: ViewingAgendaGuideInput): ViewingAgendaGuide {
  const active = viewings.filter((viewing) => ACTIVE_STATUSES.has(viewing.status)).sort(sortByTime)
  const history = viewings.filter((viewing) => HISTORY_STATUSES.has(viewing.status)).sort(reverseByTime)
  const pending = active.filter((viewing) => viewing.status === 'pending')
  const confirmed = active.filter((viewing) => viewing.status === 'confirmed')
  const checkedIn = active.filter((viewing) => viewing.status === 'checked_in')
  const completed = viewings.filter((viewing) => viewing.status === 'completed')
  const needsFeedback = completed.filter((viewing) =>
    role === 'CLIENT'
    && viewing.clientId === userId
    && !(typeof viewing.rating === 'number' && viewing.rating > 0),
  )
  const readyForDocuments = completed.filter((viewing) => isStaffRole(role) || viewing.clientId === userId)
  const readyForDealRoom = completed.filter((viewing) => viewing.wouldProceed === true)
  const reschedulable = viewings.filter((viewing) =>
    role === 'CLIENT'
    && viewing.clientId === userId
    && ['cancelled', 'cancelled_by_client', 'cancelled_by_agent', 'no_show'].includes(viewing.status),
  )
  const primary = pickPrimary(role, userId, viewings)

  const metrics = {
    active: active.length,
    pending: pending.length,
    confirmed: confirmed.length,
    checkedIn: checkedIn.length,
    completed: completed.length,
    needsFeedback: needsFeedback.length,
    readyForDocuments: readyForDocuments.length,
    readyForDealRoom: readyForDealRoom.length,
    reschedulable: reschedulable.length,
    history: history.length,
  }

  if (!viewings.length) {
    return {
      headline: isStaffRole(role) ? 'Agenda nu are vizionări de gestionat' : 'Nu ai vizionări în lucru',
      description: isStaffRole(role)
        ? 'Când apar programări, aici vei vedea primul pas operațional: confirmare, prezență, finalizare sau documente.'
        : 'Alege o proprietate și programează primul interval. După confirmare, tot traseul apare aici.',
      primaryAction: {
        target: isStaffRole(role) ? 'active_tab' : 'schedule',
        label: isStaffRole(role) ? 'Agenda este liberă' : 'Programează o vizionare',
      },
      metrics,
      cards: [
        {
          id: 'now',
          title: 'Nicio acțiune urgentă',
          description: isStaffRole(role) ? 'Nu există cereri de confirmat sau prezențe de marcat.' : 'Începe din catalogul de proprietăți.',
          badgeLabel: '0 active',
          tone: 'neutral',
          action: { target: isStaffRole(role) ? 'active_tab' : 'schedule', label: isStaffRole(role) ? 'Vezi agenda' : 'Programează' },
        },
        {
          id: 'queue',
          title: 'Coada de lucru',
          description: 'Vizionările active vor fi grupate aici după status și urgență.',
          badgeLabel: 'Pregătit',
          tone: 'neutral',
          action: { target: 'active_tab', label: 'Vezi active' },
        },
        {
          id: 'history',
          title: 'Istoric curat',
          description: 'Anulările, neprezentările și vizionările finalizate rămân în audit.',
          badgeLabel: 'Audit',
          tone: 'neutral',
          action: { target: 'history_tab', label: 'Vezi istoricul' },
        },
      ],
    }
  }

  const primaryAction = primary
    ? buildAction(primary.viewing, primary.guidance.action)
    : active.length > 0
      ? { target: 'active_tab' as const, label: 'Vezi vizionările active', viewingId: active[0]?.id }
      : history.length > 0
        ? { target: 'history_tab' as const, label: 'Vezi istoricul', viewingId: history[0]?.id }
        : { target: 'schedule' as const, label: 'Programează o vizionare' }

  const headline = primary
    ? primary.guidance.title
    : active.length > 0
      ? 'Vizionările sunt în așteptare'
      : 'Agenda este la zi'
  const description = primary
    ? `${primary.guidance.description} Vizionare: ${viewingLabel(primary.viewing)}.`
    : active.length > 0
      ? 'Nu există o acțiune directă pentru rolul tău, dar poți urmări statusul vizionărilor active.'
      : 'Nu ai vizionări active; istoricul rămâne disponibil pentru audit.'

  const queueCard: ViewingAgendaCard = isStaffRole(role)
    ? {
        id: 'queue',
        title: pending.length > 0 ? 'Confirmări în așteptare' : 'Agenda operațională',
        description: pending.length > 0
          ? `${plural(pending.length, 'programare trebuie confirmată', 'programări trebuie confirmate')} înainte de vizionare.`
          : checkedIn.length > 0
            ? `${plural(checkedIn.length, 'client este prezent', 'clienți sunt prezenți')} și așteaptă finalizarea vizionării.`
            : `${plural(active.length, 'vizionare activă', 'vizionări active')} în agenda echipei.`,
        badgeLabel: pending.length > 0 ? `${pending.length} pending` : `${active.length} active`,
        tone: pending.length > 0 || checkedIn.length > 0 ? 'warning' : 'neutral',
        action: pending[0]
          ? buildAction(pending[0], 'confirm')
          : checkedIn[0]
            ? buildAction(checkedIn[0], 'complete')
            : { target: 'active_tab', label: 'Vezi agenda' },
      }
    : {
        id: 'queue',
        title: active.length > 0 ? 'Vizionări active' : 'Fără vizionări active',
        description: active.length > 0
          ? `${plural(active.length, 'vizionare este în lucru', 'vizionări sunt în lucru')}. Vezi ora, agentul și statusul.`
          : 'Poți programa o vizionare nouă când găsești o proprietate potrivită.',
        badgeLabel: `${active.length} active`,
        tone: active.length > 0 ? 'success' : 'neutral',
        action: active.length > 0 ? { target: 'active_tab', label: 'Vezi active' } : { target: 'schedule', label: 'Programează' },
      }

  return {
    headline,
    description,
    primaryAction,
    metrics,
    cards: [
      {
        id: 'now',
        title: primary ? 'Primul pas recomandat' : 'Totul este la zi',
        description: primary
          ? viewingLabel(primary.viewing)
          : 'Nu există acțiuni urgente pentru rolul tău în acest moment.',
        badgeLabel: primary ? primary.guidance.actionLabel ?? 'Acum' : 'La zi',
        tone: primary ? primary.guidance.tone === 'warning' ? 'warning' : 'primary' : 'success',
        action: primaryAction,
      },
      queueCard,
      {
        id: 'documents',
        title: isStaffRole(role) ? 'Fișe și documente' : 'Feedback și tranzacție',
        description: isStaffRole(role)
          ? `${plural(readyForDocuments.length, 'vizionare finalizată poate cere documente', 'vizionări finalizate pot cere documente')}.`
          : needsFeedback.length > 0
            ? `${plural(needsFeedback.length, 'vizionare așteaptă feedback', 'vizionări așteaptă feedback')}.`
            : readyForDealRoom.length > 0
              ? `${plural(readyForDealRoom.length, 'vizionare poate continua în Deal Room', 'vizionări pot continua în Deal Room')}.`
              : 'După finalizare vei vedea feedbackul, fișa și pașii tranzacției.',
        badgeLabel: isStaffRole(role) ? `${readyForDocuments.length} dosare` : `${needsFeedback.length} feedback`,
        tone: readyForDocuments.length > 0 || needsFeedback.length > 0 || readyForDealRoom.length > 0 ? 'warning' : 'neutral',
        action: needsFeedback[0]
          ? buildAction(needsFeedback[0], 'feedback')
          : readyForDealRoom[0]
            ? buildAction(readyForDealRoom[0], 'deal_room')
            : readyForDocuments[0]
              ? buildAction(readyForDocuments[0], 'documents')
              : { target: 'history_tab', label: 'Vezi istoricul' },
      },
      {
        id: 'history',
        title: 'Istoric și reprogramări',
        description: reschedulable.length > 0
          ? `${plural(reschedulable.length, 'vizionare poate fi reprogramată', 'vizionări pot fi reprogramate')}.`
          : `${plural(history.length, 'înregistrare în istoric', 'înregistrări în istoric')} pentru audit.`,
        badgeLabel: reschedulable.length > 0 ? `${reschedulable.length} de reluat` : `${history.length} istoric`,
        tone: reschedulable.length > 0 ? 'warning' : 'neutral',
        action: reschedulable[0]
          ? buildAction(reschedulable[0], 'reschedule')
          : { target: 'history_tab', label: 'Vezi istoricul' },
      },
    ],
  }
}
