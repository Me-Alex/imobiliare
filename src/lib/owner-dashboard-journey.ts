export type OwnerDashboardJourneyStageId = 'listing' | 'market' | 'viewings' | 'transaction'
export type OwnerDashboardJourneyStageState = 'attention' | 'active' | 'waiting' | 'good'
export type OwnerDashboardJourneyTarget = 'listing-quality' | 'pricing' | 'appointments' | 'documents' | 'monitoring'

export interface OwnerDashboardJourneyStage {
  id: OwnerDashboardJourneyStageId
  title: string
  description: string
  state: OwnerDashboardJourneyStageState
  value: string
  target: OwnerDashboardJourneyTarget
}

export interface OwnerDashboardJourney {
  headline: string
  description: string
  progressPercent: number
  completedCount: number
  totalCount: number
  primaryStage: OwnerDashboardJourneyStage
  stages: OwnerDashboardJourneyStage[]
}

export interface OwnerDashboardJourneyInput {
  qualityScore: number
  adjustmentPercent: number
  views: number
  inquiries: number
  viewings: number
  feedbackCount: number
  missingDocuments: number
}

function interestLabel(inquiries: number, viewings: number) {
  const total = inquiries + viewings
  if (total === 0) return 'fără cereri'
  if (total === 1) return '1 interacțiune'
  return `${total} interacțiuni`
}

function primaryStage(stages: readonly OwnerDashboardJourneyStage[]) {
  return stages.find((stage) => stage.state === 'attention')
    ?? stages.find((stage) => stage.state === 'active')
    ?? stages.find((stage) => stage.state === 'waiting')
    ?? stages[stages.length - 1]
}

export function getOwnerDashboardJourney(input: OwnerDashboardJourneyInput): OwnerDashboardJourney {
  const listingReady = input.qualityScore >= 75
  const hasTraffic = input.views > 0
  const hasInterest = input.inquiries > 0 || input.viewings > 0
  const hasFeedback = input.feedbackCount > 0
  const needsPricing = input.adjustmentPercent > 0
  const hasDocumentBlocker = input.missingDocuments > 0

  const stages: OwnerDashboardJourneyStage[] = [
    {
      id: 'listing',
      title: 'Anunț publicabil',
      description: listingReady
        ? 'Anunțul are informațiile principale pentru promovare și comparație.'
        : 'Îmbunătățește descrierea, fotografiile, pinul sau turul înainte de promovare intensă.',
      state: listingReady ? 'good' : 'attention',
      value: `${input.qualityScore}%`,
      target: 'listing-quality',
    },
    {
      id: 'market',
      title: 'Poziționare în piață',
      description: needsPricing
        ? `Prețul pare peste comparabile; dashboard-ul sugerează o ajustare de aproximativ ${input.adjustmentPercent}%.`
        : hasTraffic
          ? 'Anunțul primește trafic; urmărește dacă vizualizările se transformă în cereri.'
          : 'După publicare, primele vizualizări vor valida poziționarea anunțului.',
      state: needsPricing ? 'attention' : hasTraffic ? 'active' : 'waiting',
      value: needsPricing ? `-${input.adjustmentPercent}%` : `${input.views} vizualizări`,
      target: needsPricing ? 'pricing' : 'monitoring',
    },
    {
      id: 'viewings',
      title: 'Vizionări și feedback',
      description: hasFeedback
        ? 'Feedbackul de la vizionări ajută la decizia de preț, prezentare și următorul pas.'
        : hasInterest
          ? 'Transformă cererile în vizionări confirmate și colectează feedback după întâlnire.'
          : 'Cererile și vizionările apar aici când interesul devine concret.',
      state: hasFeedback ? 'good' : hasInterest ? 'active' : 'waiting',
      value: hasFeedback ? `${input.feedbackCount} feedback` : interestLabel(input.inquiries, input.viewings),
      target: 'appointments',
    },
    {
      id: 'transaction',
      title: 'Dosar tranzacție',
      description: hasDocumentBlocker
        ? 'Rezolvă documentele lipsă ca vizionarea sau tranzacția să nu rămână blocată.'
        : hasInterest
          ? 'Documentele și Deal Room-ul sunt pregătite pentru ofertă, contract și semnături.'
          : 'Dosarul se activează când există o vizionare sau o tranzacție reală.',
      state: hasDocumentBlocker ? 'attention' : hasInterest ? 'active' : 'waiting',
      value: hasDocumentBlocker ? `${input.missingDocuments} lipsă` : hasInterest ? 'pregătit' : 'în așteptare',
      target: hasDocumentBlocker ? 'documents' : 'appointments',
    },
  ]

  const completedCount = stages.filter((stage) => stage.state === 'good').length
  const current = primaryStage(stages)

  return {
    headline: `Etapa curentă: ${current.title.toLowerCase()}`,
    description: current.description,
    progressPercent: Math.round((completedCount / stages.length) * 100),
    completedCount,
    totalCount: stages.length,
    primaryStage: current,
    stages,
  }
}
