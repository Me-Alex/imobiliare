import type {
  DocumentActionPlan,
  DocumentActionPlanItem,
  DocumentActionPlanState,
} from '@/lib/document-action-plan'

export type DocumentDossierProgressStageId = 'preparation' | 'review' | 'signature' | 'archive'

export interface DocumentDossierProgressStage {
  id: DocumentDossierProgressStageId
  label: string
  description: string
  state: DocumentActionPlanState
  itemIds: DocumentActionPlanItem['id'][]
}

export interface DocumentDossierProgress {
  headline: string
  description: string
  progressPercent: number
  completedCount: number
  totalCount: number
  currentStage: DocumentDossierProgressStage
  stages: DocumentDossierProgressStage[]
}

interface DocumentDossierProgressInput {
  plan: DocumentActionPlan
  documentsCount: number
}

const STATE_PRIORITY: DocumentActionPlanState[] = ['blocked', 'current', 'waiting', 'pending', 'complete']

function pickStageState(items: readonly DocumentActionPlanItem[]): DocumentActionPlanState {
  if (items.length === 0) return 'pending'
  if (items.every((item) => item.state === 'complete')) return 'complete'
  return STATE_PRIORITY.find((state) => items.some((item) => item.state === state)) ?? 'pending'
}

function summarizePreparation(items: readonly DocumentActionPlanItem[]) {
  const current = items.find((item) => item.state === 'current')
  const waiting = items.find((item) => item.state === 'waiting')
  const blocked = items.find((item) => item.state === 'blocked')

  if (blocked) return blocked.description
  if (current) return current.description
  if (waiting) return waiting.description
  if (items.every((item) => item.state === 'complete')) return 'Datele și actele suport sunt pregătite pentru verificare.'
  return 'Datele participanților și actele suport apar aici înainte de verificarea agenției.'
}

function findItem(plan: DocumentActionPlan, id: DocumentActionPlanItem['id']) {
  return plan.items.find((item) => item.id === id)
}

export function getDocumentDossierProgress({
  plan,
  documentsCount,
}: DocumentDossierProgressInput): DocumentDossierProgress {
  const preparationItems = plan.items.filter((item) => item.id === 'data' || item.id === 'evidence')
  const reviewItem = findItem(plan, 'review')
  const signatureItem = findItem(plan, 'signature')
  const archiveItem = findItem(plan, 'archive')

  const stages: DocumentDossierProgressStage[] = [
    {
      id: 'preparation',
      label: 'Date și acte',
      description: summarizePreparation(preparationItems),
      state: pickStageState(preparationItems),
      itemIds: preparationItems.map((item) => item.id),
    },
    {
      id: 'review',
      label: 'Verificare',
      description: reviewItem?.description ?? 'Agenția verifică datele și pregătește versiunea oficială.',
      state: reviewItem?.state ?? 'pending',
      itemIds: reviewItem ? [reviewItem.id] : [],
    },
    {
      id: 'signature',
      label: 'Semnare',
      description: signatureItem?.description ?? 'Semnăturile apar după verificarea documentului.',
      state: signatureItem?.state ?? 'pending',
      itemIds: signatureItem ? [signatureItem.id] : [],
    },
    {
      id: 'archive',
      label: 'Arhivă',
      description: documentsCount > 0
        ? `${documentsCount} ${documentsCount === 1 ? 'document păstrat' : 'documente păstrate'} cu versiuni și jurnal.`
        : archiveItem?.description ?? 'Arhiva se creează automat când apare primul document.',
      state: archiveItem?.state ?? 'pending',
      itemIds: archiveItem ? [archiveItem.id] : [],
    },
  ]

  const completedCount = stages.filter((stage) => stage.state === 'complete').length
  const currentStage = stages.find((stage) => ['blocked', 'current', 'waiting'].includes(stage.state))
    ?? stages.find((stage) => stage.state === 'pending')
    ?? stages[stages.length - 1]
  const progressPercent = Math.round((completedCount / stages.length) * 100)

  return {
    headline: plan.readOnly ? 'Dosar închis pentru consultare' : 'Unde este dosarul acum',
    description: plan.readOnly
      ? 'Nu mai există pași noi; poți verifica documentele păstrate și istoricul.'
      : `Etapa curentă: ${currentStage.label.toLowerCase()}. ${currentStage.description}`,
    progressPercent,
    completedCount,
    totalCount: stages.length,
    currentStage,
    stages,
  }
}
