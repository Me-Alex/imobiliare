export type AgentCrmWorkbenchStageId = 'response' | 'qualification' | 'viewing' | 'offerContract'
export type AgentCrmWorkbenchStageState = 'urgent' | 'active' | 'healthy'
export type AgentCrmWorkbenchFocus = 'followups' | 'pipeline' | 'viewings' | 'offers'

export interface AgentCrmWorkbenchStage {
  id: AgentCrmWorkbenchStageId
  title: string
  description: string
  state: AgentCrmWorkbenchStageState
  count: number
  actionLabel: string
  focus: AgentCrmWorkbenchFocus
  signals: string[]
}

export interface AgentCrmWorkbench {
  headline: string
  description: string
  healthPercent: number
  activeCount: number
  primaryStage: AgentCrmWorkbenchStage
  stages: AgentCrmWorkbenchStage[]
}

export interface AgentCrmLeadLike {
  status: string
  score?: number | string | null
  response_due_at?: string | null
  created_at?: string | null
  first_response_at?: string | null
}

export interface AgentCrmFollowUpLike {
  due_at: string
  status: string
}

export interface AgentCrmAppointmentLike {
  status?: string | null
  start_at?: string | null
  requested_at?: string | null
}

export interface AgentCrmWorkbenchInput {
  leads: readonly AgentCrmLeadLike[]
  followUps: readonly AgentCrmFollowUpLike[]
  appointments: readonly AgentCrmAppointmentLike[]
  now?: number
}

const TERMINAL_LEAD_STATUSES = new Set(['WON', 'CLOSED', 'LOST'])
const ACTIVE_APPOINTMENT_STATUSES = new Set(['PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN'])
const PENDING_APPOINTMENT_STATUSES = new Set(['PENDING', 'REQUESTED'])

function stage(status: string) {
  if (status === 'CONTACTED') return 'QUALIFIED'
  if (status === 'VIEWING_SCHEDULED') return 'VIEWING'
  if (status === 'CLOSED') return 'CONTRACT'
  return status
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`
}

function parseTime(value?: string | null) {
  if (!value) return Number.NaN
  return Date.parse(value)
}

function isPast(value: number, now: number) {
  return Number.isFinite(value) && value < now
}

function endOfDay(now: number) {
  const date = new Date(now)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

function stateFor(count: number, urgent: boolean): AgentCrmWorkbenchStageState {
  if (urgent) return 'urgent'
  return count > 0 ? 'active' : 'healthy'
}

export function getAgentCrmWorkbench({
  leads,
  followUps,
  appointments,
  now = Date.now(),
}: AgentCrmWorkbenchInput): AgentCrmWorkbench {
  const activeLeads = leads.filter((lead) => !TERMINAL_LEAD_STATUSES.has(lead.status))
  const openFollowUps = followUps.filter((followUp) => followUp.status === 'OPEN')
  const todayBoundary = endOfDay(now)

  const overdueFollowUps = openFollowUps.filter((followUp) => isPast(parseTime(followUp.due_at), now))
  const todayFollowUps = openFollowUps.filter((followUp) => parseTime(followUp.due_at) <= todayBoundary)
  const overdueLeads = activeLeads.filter((lead) => {
    if (stage(lead.status) !== 'NEW') return false
    return isPast(parseTime(lead.response_due_at || lead.created_at), now)
  })
  const freshLeads = activeLeads.filter((lead) => stage(lead.status) === 'NEW')
  const qualifiedLeads = activeLeads.filter((lead) => stage(lead.status) === 'QUALIFIED')
  const highIntentLeads = activeLeads.filter((lead) => Number(lead.score || 0) >= 70)
  const viewingLeads = activeLeads.filter((lead) => stage(lead.status) === 'VIEWING')
  const activeAppointments = appointments.filter((appointment) => ACTIVE_APPOINTMENT_STATUSES.has(String(appointment.status || '')))
  const pendingAppointments = activeAppointments.filter((appointment) => PENDING_APPOINTMENT_STATUSES.has(String(appointment.status || '')))
  const offerContractLeads = activeLeads.filter((lead) => ['OFFER', 'CONTRACT'].includes(stage(lead.status)))

  const responseCount = overdueFollowUps.length + overdueLeads.length || todayFollowUps.length
  const qualificationCount = freshLeads.length + qualifiedLeads.length
  const viewingCount = viewingLeads.length + activeAppointments.length
  const offerContractCount = offerContractLeads.length

  const stages: AgentCrmWorkbenchStage[] = [
    {
      id: 'response',
      title: 'Răspuns rapid',
      description: responseCount > 0
        ? 'Începe cu lead-urile și follow-up-urile care pot răci cel mai repede oportunitatea.'
        : 'Nu există contactări întârziate sau programate pentru azi.',
      state: stateFor(responseCount, overdueFollowUps.length > 0 || overdueLeads.length > 0),
      count: responseCount,
      actionLabel: responseCount > 0 ? 'Vezi contactările' : 'Agenda este la zi',
      focus: 'followups',
      signals: [
        overdueFollowUps.length > 0
          ? plural(overdueFollowUps.length, 'follow-up întârziat', 'follow-up-uri întârziate')
          : 'Fără follow-up-uri întârziate',
        overdueLeads.length > 0
          ? plural(overdueLeads.length, 'lead fără răspuns', 'lead-uri fără răspuns')
          : 'Răspunsurile noi sunt în termen',
        todayFollowUps.length > 0
          ? plural(todayFollowUps.length, 'contactare scadentă azi', 'contactări scadente azi')
          : 'Fără contactări scadente azi',
      ],
    },
    {
      id: 'qualification',
      title: 'Calificare',
      description: qualificationCount > 0
        ? 'Transformă lead-urile noi în cerințe clare: buget, zonă, motivație și proprietatea potrivită.'
        : 'Nu există lead-uri noi sau calificate care așteaptă lucru în pipeline.',
      state: stateFor(qualificationCount, highIntentLeads.length > 0 && freshLeads.length > 0),
      count: qualificationCount,
      actionLabel: 'Deschide pipeline',
      focus: 'pipeline',
      signals: [
        freshLeads.length > 0 ? plural(freshLeads.length, 'lead nou', 'lead-uri noi') : 'Fără lead-uri noi',
        qualifiedLeads.length > 0 ? plural(qualifiedLeads.length, 'lead calificat', 'lead-uri calificate') : 'Calificări la zi',
        highIntentLeads.length > 0 ? plural(highIntentLeads.length, 'lead cu intenție mare', 'lead-uri cu intenție mare') : 'Scoruri fără vârf critic',
      ],
    },
    {
      id: 'viewing',
      title: 'Vizionare',
      description: viewingCount > 0
        ? 'Confirmă prezența, pregătește fișa de vizionare și notează feedbackul imediat după întâlnire.'
        : 'Nu există vizionări active care cer atenție în acest moment.',
      state: stateFor(viewingCount, pendingAppointments.length > 0),
      count: viewingCount,
      actionLabel: pendingAppointments.length > 0 ? 'Confirmă vizionări' : 'Vezi vizionările',
      focus: 'viewings',
      signals: [
        pendingAppointments.length > 0
          ? plural(pendingAppointments.length, 'vizionare de confirmat', 'vizionări de confirmat')
          : 'Vizionări confirmate sau fără blocaj',
        viewingLeads.length > 0
          ? plural(viewingLeads.length, 'lead în etapa vizionare', 'lead-uri în etapa vizionare')
          : 'Pipeline fără lead-uri în vizionare',
      ],
    },
    {
      id: 'offerContract',
      title: 'Ofertă și contract',
      description: offerContractCount > 0
        ? 'Mută oportunitatea în Deal Room: ofertă, contraofertă, documente și semnături.'
        : 'Nu există oferte sau contracte active în CRM-ul filtrat.',
      state: stateFor(offerContractCount, false),
      count: offerContractCount,
      actionLabel: offerContractCount > 0 ? 'Vezi ofertele' : 'Așteaptă ofertă',
      focus: 'offers',
      signals: [
        offerContractLeads.filter((lead) => stage(lead.status) === 'OFFER').length > 0
          ? plural(offerContractLeads.filter((lead) => stage(lead.status) === 'OFFER').length, 'lead în ofertă', 'lead-uri în ofertă')
          : 'Fără oferte active',
        offerContractLeads.filter((lead) => stage(lead.status) === 'CONTRACT').length > 0
          ? plural(offerContractLeads.filter((lead) => stage(lead.status) === 'CONTRACT').length, 'lead în contract', 'lead-uri în contract')
          : 'Fără contracte active',
      ],
    },
  ]

  const activeCount = stages.reduce((total, item) => total + item.count, 0)
  const healthyStages = stages.filter((item) => item.state === 'healthy').length
  const primaryStage = stages.find((item) => item.state === 'urgent')
    ?? stages.find((item) => item.state === 'active')
    ?? stages[0]

  return {
    headline: activeCount > 0
      ? `Următorul pas: ${primaryStage.title.toLowerCase()}`
      : 'CRM-ul filtrat este la zi',
    description: activeCount > 0
      ? primaryStage.description
      : 'Nu există întârzieri vizibile; menține pipeline-ul actualizat pe măsură ce apar lead-uri noi.',
    healthPercent: Math.round((healthyStages / stages.length) * 100),
    activeCount,
    primaryStage,
    stages,
  }
}
