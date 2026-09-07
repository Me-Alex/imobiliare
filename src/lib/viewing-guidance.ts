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
      description: audience === 'client' ? 'Prezintă-te la ora programată. Agentul va confirma prezența la întâlnire.' : 'Clientul și agentul au o întâlnire confirmată. Vei vedea aici rezultatul vizitei.',
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
    if (viewing.wouldProceed === true) return {
      title: 'Continuă cu oferta', description: 'Decizia este înregistrată. Oferta, răspunsurile și contractul se urmăresc în dosarul tranzacției.',
      action: 'deal_room', actionLabel: 'Deschide tranzacția', tone: 'success',
    }
    if (!hasFeedback || viewing.wouldProceed == null) return {
      title: audience === 'client' ? 'Alege dacă vrei să continui' : 'Se așteaptă decizia clientului',
      description: 'După vizită, clientul decide dacă dorește să discute o ofertă pentru această proprietate.',
      action: audience === 'client' ? 'feedback' : 'documents',
      actionLabel: audience === 'client' ? 'Înregistrează decizia' : 'Consultă fișa vizitei', tone: 'info',
    }
    return {
      title: 'Clientul nu dorește să continue', description: 'Vizita rămâne în arhivă. Clientul își poate actualiza decizia.',
      action: audience === 'client' ? 'feedback' : 'documents',
      actionLabel: audience === 'client' ? 'Actualizează decizia' : 'Consultă fișa vizitei', tone: 'neutral',
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

export function getViewingProcessGroup(viewing: Pick<Vizionare, 'status' | 'rating' | 'wouldProceed'>): 'active' | 'followup' | 'history' {
  if (['pending', 'confirmed', 'checked_in'].includes(viewing.status)) return 'active'
  if (viewing.status === 'completed' && !(viewing.wouldProceed === false && (viewing.rating || 0) > 0)) return 'followup'
  return 'history'
}
