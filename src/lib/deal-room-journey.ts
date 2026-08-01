import {
  getActiveDealOffer,
  getDealStageGate,
  summarizeDealRequirements,
  type DealAppointment,
  type DealOffer,
  type DealParticipant,
  type DealRequirement,
  type DealRoom,
} from '@/lib/transaction-workspace'

export type DealRoomJourneyStageId = 'viewing' | 'participants' | 'offer' | 'documents' | 'nextStep'
export type DealRoomJourneyState = 'blocked' | 'attention' | 'active' | 'waiting' | 'complete'
export type DealRoomJourneyTarget = 'viewing' | 'participants' | 'offers' | 'documents' | 'next-step'

export interface DealRoomJourneyStage {
  id: DealRoomJourneyStageId
  title: string
  description: string
  state: DealRoomJourneyState
  value: string
  target: DealRoomJourneyTarget
}

export interface DealRoomJourney {
  headline: string
  description: string
  progressPercent: number
  completedCount: number
  totalCount: number
  primaryStage: DealRoomJourneyStage
  stages: DealRoomJourneyStage[]
}

export interface DealRoomJourneyInput {
  room: Pick<DealRoom, 'stage' | 'next_step' | 'next_step_due_at'>
  appointments: readonly DealAppointment[]
  participants: readonly DealParticipant[]
  offers: readonly DealOffer[]
  requirements: readonly DealRequirement[]
  selectedStage?: DealRoom['stage']
}

const COMPLETE_APPOINTMENT_STATUSES = new Set(['COMPLETED', 'DONE'])
const CANCELLED_APPOINTMENT_STATUSES = new Set(['CANCELLED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_AGENT', 'NO_SHOW'])
const ATTENDED_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'PRESENT', 'ATTENDED'])
const MISSING_ATTENDANCE_STATUSES = new Set(['PENDING', 'REQUESTED', 'INVITED'])

function appointmentStatus(appointments: readonly DealAppointment[]) {
  const statuses = appointments
    .map((item) => {
      const appointment = Array.isArray(item.appointments) ? item.appointments[0] : item.appointments
      return String(appointment?.status || '').toUpperCase()
    })
    .filter(Boolean)

  if (statuses.some((status) => CANCELLED_APPOINTMENT_STATUSES.has(status))) return 'blocked'
  if (statuses.some((status) => COMPLETE_APPOINTMENT_STATUSES.has(status))) return 'complete'
  if (statuses.length > 0) return 'active'
  return 'waiting'
}

function participantState(participants: readonly DealParticipant[]) {
  if (participants.length === 0) return 'waiting'
  const statuses = participants.map((participant) => String(participant.attendance_status || '').toUpperCase())
  if (statuses.some((status) => status === 'NO_SHOW' || status === 'DECLINED')) return 'attention'
  if (statuses.some((status) => MISSING_ATTENDANCE_STATUSES.has(status))) return 'attention'
  if (statuses.every((status) => ATTENDED_STATUSES.has(status) || status === 'CONFIRMED')) return 'complete'
  return 'active'
}

function offerStage(offers: readonly DealOffer[]) {
  const activeOffer = getActiveDealOffer(offers)
  const accepted = offers.some((offer) => offer.status === 'ACCEPTED')
  if (accepted) return { state: 'complete' as const, value: 'acceptată' }
  if (activeOffer) {
    return {
      state: 'active' as const,
      value: activeOffer.offer_kind === 'COUNTER_OFFER' ? 'contraofertă' : 'ofertă',
    }
  }
  if (offers.some((offer) => offer.status === 'REJECTED' || offer.status === 'WITHDRAWN')) {
    return { state: 'attention' as const, value: 'de reluat' }
  }
  return { state: 'waiting' as const, value: 'fără ofertă' }
}

function documentStage(requirements: readonly DealRequirement[]) {
  const summary = summarizeDealRequirements(requirements)
  if (summary.blocked > 0) return { state: 'blocked' as const, value: `${summary.blocked} blocate`, summary }
  if (summary.signatures > 0) return { state: 'attention' as const, value: `${summary.signatures} semnături`, summary }
  if (summary.missing > 0) return { state: 'attention' as const, value: `${summary.missing} lipsă`, summary }
  if (summary.total > 0 && summary.complete === summary.total) return { state: 'complete' as const, value: 'complete', summary }
  if (summary.received > 0) return { state: 'active' as const, value: `${summary.received}/${summary.total} primite`, summary }
  return { state: 'waiting' as const, value: 'în așteptare', summary }
}

function pickPrimary(stages: readonly DealRoomJourneyStage[]) {
  return stages.find((stage) => stage.state === 'blocked')
    ?? stages.find((stage) => stage.state === 'attention')
    ?? stages.find((stage) => stage.state === 'active')
    ?? stages.find((stage) => stage.state === 'waiting')
    ?? stages[stages.length - 1]
}

export function getDealRoomJourney({
  room,
  appointments,
  participants,
  offers,
  requirements,
  selectedStage,
}: DealRoomJourneyInput): DealRoomJourney {
  const viewingState = appointmentStatus(appointments)
  const attendanceState = participantState(participants)
  const negotiation = offerStage(offers)
  const documents = documentStage(requirements)
  const stageGate = getDealStageGate(selectedStage ?? room.stage, offers, requirements)
  const hasNextStep = Boolean(room.next_step?.trim())

  const nextStepState: DealRoomJourneyState = !stageGate.ok
    ? 'blocked'
    : hasNextStep
      ? 'active'
      : room.stage === 'CLOSED_WON' || room.stage === 'CLOSED_LOST'
        ? 'complete'
        : 'attention'

  const stages: DealRoomJourneyStage[] = [
    {
      id: 'viewing',
      title: 'Vizionare',
      description: viewingState === 'blocked'
        ? 'Vizionarea este anulată sau marcată ca neprezentare; stabilește dacă se reprogramează.'
        : viewingState === 'complete'
          ? 'Vizionarea este finalizată și poate alimenta feedbackul și oferta.'
          : viewingState === 'active'
            ? 'Vizionarea este în curs de confirmare sau desfășurare.'
            : 'Spațiul tranzacției așteaptă o vizionare asociată.',
      state: viewingState,
      value: appointments.length > 0 ? `${appointments.length} legată` : 'niciuna',
      target: 'viewing',
    },
    {
      id: 'participants',
      title: 'Participanți',
      description: attendanceState === 'complete'
        ? 'Participanții relevanți sunt confirmați sau au prezența înregistrată.'
        : attendanceState === 'attention'
          ? 'Există participanți neconfirmați sau o prezență care necesită clarificare.'
          : attendanceState === 'active'
            ? 'Participanții sunt înregistrați; verifică rolurile și prezența.'
            : 'Adaugă sau confirmă participanții tranzacției.',
      state: attendanceState,
      value: `${participants.length} persoane`,
      target: 'participants',
    },
    {
      id: 'offer',
      title: 'Ofertă',
      description: negotiation.state === 'complete'
        ? 'Există o ofertă acceptată; tranzacția poate avansa spre contracte.'
        : negotiation.state === 'active'
          ? 'Există o ofertă sau contraofertă care așteaptă decizia părții potrivite.'
          : negotiation.state === 'attention'
            ? 'Negocierea anterioară nu este activă; poate fi nevoie de o ofertă nouă.'
            : 'Oferta apare după interes concret și vizionare.',
      state: negotiation.state,
      value: negotiation.value,
      target: 'offers',
    },
    {
      id: 'documents',
      title: 'Documente și semnături',
      description: documents.state === 'blocked'
        ? 'Există documente respinse sau expirate care blochează avansarea.'
        : documents.state === 'attention'
          ? 'Documentele lipsă sau semnăturile trebuie rezolvate înainte de închidere.'
          : documents.state === 'complete'
            ? 'Checklistul documentar este complet.'
            : documents.state === 'active'
              ? 'Documentele sunt în lucru și trebuie urmărite până la aprobarea finală.'
              : 'Checklistul se activează când apar cerințe documentare.',
      state: documents.state,
      value: documents.value,
      target: 'documents',
    },
    {
      id: 'nextStep',
      title: 'Următorul pas',
      description: !stageGate.ok
        ? stageGate.reason || 'Etapa selectată nu poate fi salvată încă.'
        : hasNextStep
          ? `Responsabilul urmărește: ${room.next_step}.`
          : nextStepState === 'complete'
            ? 'Tranzacția este închisă; jurnalul rămâne disponibil pentru consultare.'
            : 'Stabilește următorul pas, responsabilul și termenul ca Deal Room-ul să rămână acționabil.',
      state: nextStepState,
      value: hasNextStep ? 'setat' : nextStepState === 'complete' ? 'închis' : 'de setat',
      target: 'next-step',
    },
  ]

  const completedCount = stages.filter((stage) => stage.state === 'complete').length
  const primaryStage = pickPrimary(stages)

  return {
    headline: `Prioritatea tranzacției: ${primaryStage.title.toLowerCase()}`,
    description: primaryStage.description,
    progressPercent: Math.round((completedCount / stages.length) * 100),
    completedCount,
    totalCount: stages.length,
    primaryStage,
    stages,
  }
}
