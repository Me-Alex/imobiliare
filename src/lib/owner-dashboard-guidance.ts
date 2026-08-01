export type OwnerDashboardActionTarget = 'documents' | 'listing-quality' | 'pricing' | 'appointments' | 'monitoring'

export interface OwnerDashboardGuidanceInput {
  qualityScore: number
  qualityNextAction: string | null
  missingDocuments: number
  adjustmentPercent: number
  views: number
  inquiries: number
  viewings: number
  feedbackCount: number
}

export interface OwnerDashboardGuidance {
  title: string
  description: string
  actionLabel: string
  target: OwnerDashboardActionTarget
  priority: 'high' | 'normal'
}

export interface OwnerDashboardSignal {
  id: 'listing' | 'interest' | 'pricing' | 'documents'
  label: string
  value: string
  description: string
  state: 'good' | 'attention' | 'neutral'
}

export interface OwnerDashboardPriority {
  guidance: OwnerDashboardGuidance
  signals: readonly OwnerDashboardSignal[]
}

export function getOwnerDashboardPriority(input: OwnerDashboardGuidanceInput): OwnerDashboardPriority {
  const hasInterest = input.inquiries > 0 || input.viewings > 0
  const lowQuality = input.qualityScore < 75
  const priceNeedsReview = input.adjustmentPercent > 0

  const guidance: OwnerDashboardGuidance = input.missingDocuments > 0
    ? {
        title: `${input.missingDocuments} ${input.missingDocuments === 1 ? 'document lipsește' : 'documente lipsesc'}`,
        description: 'Rezolvă documentele înainte ca vizionarea sau tranzacția să rămână blocată.',
        actionLabel: 'Deschide dosarul',
        target: 'documents',
        priority: 'high',
      }
    : lowQuality
      ? {
          title: input.qualityNextAction || 'Optimizează anunțul',
          description: 'Îmbunătățește anunțul ca să fie mai ușor de comparat și să genereze lead-uri mai potrivite.',
          actionLabel: 'Vezi recomandările',
          target: 'listing-quality',
          priority: 'high',
        }
      : priceNeedsReview
        ? {
            title: 'Revizuiește poziționarea prețului',
            description: `Prețul pare peste comparabile; ia în calcul o ajustare de aproximativ ${input.adjustmentPercent}%.`,
            actionLabel: 'Vezi analiza prețului',
            target: 'pricing',
            priority: 'normal',
          }
        : hasInterest
          ? {
              title: 'Transformă interesul în următorul pas',
              description: 'Ai cereri sau vizionări. Verifică agenda, feedbackul și activitatea agentului.',
              actionLabel: 'Vezi vizionările',
              target: 'appointments',
              priority: 'normal',
            }
          : {
              title: 'Monitorizează primele semnale',
              description: 'Anunțul este public; urmărește vizualizările, favoritele și primele cereri.',
              actionLabel: 'Vezi activitatea',
              target: 'monitoring',
              priority: 'normal',
            }

  const signals: OwnerDashboardSignal[] = [
    {
      id: 'listing',
      label: 'Anunț',
      value: `${input.qualityScore}%`,
      description: lowQuality ? 'Necesită optimizare' : 'Pregătit pentru promovare',
      state: lowQuality ? 'attention' : 'good',
    },
    {
      id: 'interest',
      label: 'Interes',
      value: String(input.inquiries + input.viewings),
      description: hasInterest ? 'Cereri sau vizionări active' : `${input.views} vizualizări monitorizate`,
      state: hasInterest ? 'good' : 'neutral',
    },
    {
      id: 'pricing',
      label: 'Preț',
      value: priceNeedsReview ? `-${input.adjustmentPercent}%` : 'OK',
      description: priceNeedsReview ? 'Ajustare sugerată' : 'Aliniat cu piața',
      state: priceNeedsReview ? 'attention' : 'good',
    },
    {
      id: 'documents',
      label: 'Documente',
      value: String(input.missingDocuments),
      description: input.missingDocuments > 0 ? 'De rezolvat' : 'Fără blocaje',
      state: input.missingDocuments > 0 ? 'attention' : 'good',
    },
  ]

  return { guidance, signals }
}
