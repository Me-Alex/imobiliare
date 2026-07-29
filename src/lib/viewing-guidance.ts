import type { Vizionare } from '@/lib/types'

export type ViewingAudience = 'client' | 'staff' | 'observer'

export type ViewingPrimaryAction =
  | 'none'
  | 'confirm'
  | 'check_in'
  | 'complete'
  | 'feedback'
  | 'documents'
  | 'deal_room'
  | 'reschedule'

export interface ViewingGuidance {
  title: string
  description: string
  action: ViewingPrimaryAction
  actionLabel?: string
  tone: 'neutral' | 'info' | 'success' | 'warning'
}

const cancelledStatuses: Vizionare['status'][] = [
  'cancelled',
  'cancelled_by_client',
  'cancelled_by_agent',
]

/**
 * Keeps the appointment card focused on one role-appropriate next step.
 * Permissions remain enforced by Supabase; this function only shapes the UI.
 */
export function getViewingGuidance(
  viewing: Pick<Vizionare, 'status' | 'rating' | 'wouldProceed'>,
  audience: ViewingAudience,
): ViewingGuidance {
  const hasFeedback = typeof viewing.rating === 'number' && viewing.rating > 0

  if (viewing.status === 'pending') {
    if (audience === 'staff') {
      return {
        title: 'Confirmă programarea',
        description: 'Verifică disponibilitatea și confirmă intervalul pentru client.',
        action: 'confirm',
        actionLabel: 'Confirmă programarea',
        tone: 'warning',
      }
    }
    return {
      title: 'Așteaptă confirmarea agenției',
      description: 'Solicitarea a fost trimisă. Vei vedea aici imediat ce agentul o confirmă.',
      action: 'none',
      tone: 'warning',
    }
  }

  if (viewing.status === 'confirmed') {
    if (audience === 'staff') {
      return {
        title: 'Confirmă prezența la întâlnire',
        description: 'La sosirea clientului, marchează prezența înainte de a începe vizionarea.',
        action: 'check_in',
        actionLabel: 'Clientul este prezent',
        tone: 'info',
      }
    }
    return {
      title: 'Vizionarea este confirmată',
      description: 'Prezintă-te la ora programată. Agentul va confirma prezența la întâlnire.',
      action: 'none',
      tone: 'success',
    }
  }

  if (viewing.status === 'checked_in') {
    if (audience === 'staff') {
      return {
        title: 'Finalizează vizionarea',
        description: 'După încheierea întâlnirii, finalizează vizionarea pentru a putea genera fișa.',
        action: 'complete',
        actionLabel: 'Finalizează vizionarea',
        tone: 'info',
      }
    }
    return {
      title: 'Vizionarea este în desfășurare',
      description: 'Prezența a fost confirmată. Fișa de vizionare va fi disponibilă după finalizare.',
      action: 'none',
      tone: 'info',
    }
  }

  if (viewing.status === 'completed') {
    if (audience === 'staff') {
      return {
        title: 'Pregătește fișa de vizionare',
        description: 'Vizionarea este finalizată. Verifică datele și generează documentul pentru semnare.',
        action: 'documents',
        actionLabel: 'Deschide fișa de vizionare',
        tone: 'success',
      }
    }

    if (audience === 'client' && !hasFeedback) {
      return {
        title: 'Spune-ne cum a fost',
        description: 'Feedbackul tău îl ajută pe agent să pregătească următorul pas potrivit.',
        action: 'feedback',
        actionLabel: 'Adaugă feedback',
        tone: 'success',
      }
    }

    if (audience === 'client' && viewing.wouldProceed === true) {
      return {
        title: 'Continuă tranzacția',
        description: 'Ai confirmat că proprietatea te interesează. Urmărește oferta și documentele într-un singur loc.',
        action: 'deal_room',
        actionLabel: 'Deschide Deal Room',
        tone: 'success',
      }
    }

    return {
      title: 'Consultă dosarul vizionării',
      description: 'Vezi fișa, documentele și istoricul păstrat pentru această vizionare.',
      action: 'documents',
      actionLabel: 'Deschide dosarul',
      tone: 'neutral',
    }
  }

  if (viewing.status === 'no_show') {
    return audience === 'client'
      ? {
          title: 'Programează o altă vizionare',
          description: 'Neprezentarea a fost consemnată fără penalizare automată. Poți alege un interval nou.',
          action: 'reschedule',
          actionLabel: 'Alege alt interval',
          tone: 'warning',
        }
      : {
          title: 'Neprezentare consemnată',
          description: 'Vizionarea este închisă, iar fișa de vizionare nu se generează.',
          action: 'none',
          tone: 'warning',
        }
  }

  if (cancelledStatuses.includes(viewing.status)) {
    return audience === 'client'
      ? {
          title: 'Programarea a fost anulată',
          description: 'Poți păstra proprietatea și alege oricând un interval nou.',
          action: 'reschedule',
          actionLabel: 'Programează din nou',
          tone: 'neutral',
        }
      : {
          title: 'Programare închisă',
          description: 'Motivul anulării rămâne păstrat în istoricul vizionării.',
          action: 'none',
          tone: 'neutral',
        }
  }

  return {
    title: 'Vizionare înregistrată',
    description: 'Detaliile și istoricul sunt disponibile în această pagină.',
    action: 'none',
    tone: 'neutral',
  }
}
