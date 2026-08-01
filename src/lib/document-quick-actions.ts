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
  plan,
  hasDealRoomContext,
  documentsCount,
}: DocumentQuickActionsInput): readonly DocumentQuickAction[] {
  return [
    currentStepAction(plan),
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
    {
      id: 'advanced-tools',
      title: 'Acțiuni avansate',
      description: plan.readOnly
        ? 'Solicitările, generarea și încărcările sunt oprite pentru o programare închisă.'
        : 'Solicitări, generare documente, încărcări manuale și corecturi într-un singur panou.',
      buttonLabel: plan.readOnly ? 'Indisponibil' : 'Deschide acțiunile',
      target: 'advanced',
      tone: plan.readOnly ? 'muted' : 'neutral',
      disabled: plan.readOnly || undefined,
    },
    {
      id: 'archive',
      title: 'Arhivă și versiuni',
      description: documentsCount > 0
        ? `${documentsCount} ${documentsCount === 1 ? 'document păstrat' : 'documente păstrate'} cu versiuni, semnături și descărcare.`
        : 'Arhiva va afișa automat primul document generat sau încărcat.',
      buttonLabel: 'Vezi arhiva',
      target: 'archive',
      tone: 'neutral',
    },
  ]
}
