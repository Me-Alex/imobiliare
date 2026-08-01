import type { AccountRole } from '@/lib/account-roles'
import type { DocumentActionPlan } from '@/lib/document-action-plan'

export type DocumentQuickActionTarget = 'primary' | 'deal-room' | 'advanced' | 'archive'

export interface DocumentQuickAction {
  id: 'current-step' | 'deal-room' | 'advanced-tools' | 'archive'
  title: string
  description: string
  buttonLabel: string
  target: DocumentQuickActionTarget
  tone: 'primary' | 'neutral' | 'muted'
  disabled?: boolean
}

interface DocumentQuickActionsInput {
  role: AccountRole
  plan: DocumentActionPlan
  hasDealRoomContext: boolean
  documentsCount: number
}

function currentStepAction(plan: DocumentActionPlan): DocumentQuickAction {
  const primaryItem = plan.primaryItemId
    ? plan.items.find((item) => item.id === plan.primaryItemId)
    : null

  if (plan.readOnly) {
    return {
      id: 'current-step',
      title: 'Dosar închis',
      description: 'Nu mai există pași noi. Poți consulta istoricul și documentele păstrate.',
      buttonLabel: 'Vezi arhiva',
      target: 'archive',
      tone: 'muted',
    }
  }

  if (!primaryItem) {
    return {
      id: 'current-step',
      title: 'Totul este la zi',
      description: 'Nu există acțiuni restante pentru rolul tău în acest dosar.',
      buttonLabel: 'Vezi arhiva',
      target: 'archive',
      tone: 'neutral',
    }
  }

  return {
    id: 'current-step',
    title: `Pas curent: ${primaryItem.title}`,
    description: primaryItem.description,
    buttonLabel: 'Rezolvă pasul curent',
    target: 'primary',
    tone: 'primary',
  }
}

export function getDocumentQuickActions({
  role,
  plan,
  hasDealRoomContext,
  documentsCount,
}: DocumentQuickActionsInput): readonly DocumentQuickAction[] {
  const currentAction = currentStepAction(plan)
  const actions: DocumentQuickAction[] = [
    currentAction,
    {
      id: 'deal-room',
      title: 'Context tranzacție',
      description: hasDealRoomContext
        ? 'Revii la ofertă, responsabil, participanți și jurnalul tranzacției.'
        : 'Vezi spațiul tranzacției; dacă nu există încă, platforma îți explică următorul pas.',
      buttonLabel: hasDealRoomContext ? 'Deschide Deal Room' : 'Vezi tranzacția',
      target: 'deal-room',
      tone: 'neutral',
    },
  ]

  if (!plan.readOnly && (role === 'AGENT' || role === 'ADMIN')) {
    actions.push({
      id: 'advanced-tools',
      title: 'Acțiuni operaționale',
      description: 'Solicitări, generare documente, încărcări manuale și corecturi într-un singur panou pentru echipă.',
      buttonLabel: 'Deschide acțiunile',
      target: 'advanced',
      tone: 'neutral',
    })
  }

  if (currentAction.target !== 'archive') {
    actions.push({
      id: 'archive',
      title: 'Arhivă și versiuni',
      description: documentsCount > 0
        ? `${documentsCount} ${documentsCount === 1 ? 'document păstrat' : 'documente păstrate'} cu versiuni, semnături și descărcare.`
        : 'Arhiva va afișa automat primul document generat sau încărcat.',
      buttonLabel: 'Vezi arhiva',
      target: 'archive',
      tone: 'neutral',
    })
  }

  return actions
}
