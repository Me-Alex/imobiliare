export type ViewingSchedulingStageId = 'property' | 'slot' | 'consent' | 'afterBooking'
export type ViewingSchedulingStageState = 'complete' | 'current' | 'blocked' | 'pending'

export interface ViewingSchedulingStage {
  id: ViewingSchedulingStageId
  title: string
  description: string
  state: ViewingSchedulingStageState
  actionLabel: string
  step: number
}

export interface ViewingSchedulingJourney {
  headline: string
  description: string
  progressPercent: number
  completedCount: number
  totalCount: number
  currentStage: ViewingSchedulingStage
  stages: ViewingSchedulingStage[]
}

export interface ViewingSchedulingJourneyInput {
  hasProperty: boolean
  hasStaff: boolean
  hasDate: boolean
  hasSlot: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
  privacyNoticeReady: boolean
  complianceLoading: boolean
}

function pickCurrent(stages: readonly ViewingSchedulingStage[]) {
  return stages.find((stage) => stage.state === 'blocked')
    ?? stages.find((stage) => stage.state === 'current')
    ?? stages.find((stage) => stage.state === 'pending')
    ?? stages[stages.length - 1]
}

export function getViewingSchedulingJourney(input: ViewingSchedulingJourneyInput): ViewingSchedulingJourney {
  const hasSchedule = input.hasStaff && input.hasDate && input.hasSlot
  const hasConsent = input.termsAccepted && input.privacyAccepted && input.privacyNoticeReady
  const consentBlocked = !input.complianceLoading && !input.privacyNoticeReady

  const stages: ViewingSchedulingStage[] = [
    {
      id: 'property',
      title: 'Alege proprietatea',
      description: input.hasProperty
        ? 'Proprietatea este păstrată pentru programare și dosarul vizionării.'
        : 'Selectează proprietatea pe care vrei să o vizionezi.',
      state: input.hasProperty ? 'complete' : 'current',
      actionLabel: input.hasProperty ? 'Proprietate aleasă' : 'Alege proprietatea',
      step: 1,
    },
    {
      id: 'slot',
      title: 'Alege agentul și ora',
      description: hasSchedule
        ? 'Intervalul este rezervabil; confirmarea finală se face după acceptarea regulilor.'
        : input.hasProperty
          ? 'Alege agentul disponibil, ziua și intervalul potrivit.'
          : 'Acest pas se activează după alegerea proprietății.',
      state: hasSchedule ? 'complete' : input.hasProperty ? 'current' : 'pending',
      actionLabel: hasSchedule ? 'Interval ales' : 'Alege intervalul',
      step: 2,
    },
    {
      id: 'consent',
      title: 'Reguli și GDPR',
      description: consentBlocked
        ? 'Programarea este blocată până când agenția publică informarea de confidențialitate.'
        : hasConsent
          ? 'Regulile programării și informarea de confidențialitate sunt acceptate.'
          : hasSchedule
            ? 'Acceptă regulile programării și informarea GDPR înainte de confirmare.'
            : 'Acest pas devine disponibil după alegerea intervalului.',
      state: consentBlocked ? 'blocked' : hasConsent ? 'complete' : hasSchedule ? 'current' : 'pending',
      actionLabel: consentBlocked ? 'GDPR lipsă' : hasConsent ? 'Acceptat' : 'Verifică acordurile',
      step: 3,
    },
    {
      id: 'afterBooking',
      title: 'După programare',
      description: hasConsent
        ? 'După confirmare, agentul verifică prezența; fișa de vizionare se generează doar după vizionarea efectivă.'
        : 'După rezervare vei vedea programarea, prezența, fișa de vizionare și dosarul în cont.',
      state: hasConsent ? 'current' : 'pending',
      actionLabel: hasConsent ? 'Gata de confirmare' : 'Urmează după confirmare',
      step: 3,
    },
  ]

  const completedCount = stages.filter((stage) => stage.state === 'complete').length
  const currentStage = pickCurrent(stages)

  return {
    headline: currentStage.state === 'blocked'
      ? 'Programarea este blocată temporar'
      : `Etapa curentă: ${currentStage.title.toLowerCase()}`,
    description: currentStage.description,
    progressPercent: Math.round((completedCount / stages.length) * 100),
    completedCount,
    totalCount: stages.length,
    currentStage,
    stages,
  }
}
