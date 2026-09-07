import type { AccountRole } from '@/lib/account-roles'
import {
  getActiveDealOffer, getAllowedDealOfferActions, getDealRequirementState,
  getDealStageGate, relationOne, type DealRoom,
} from '@/lib/transaction-workspace'

export type ProcessPhase = 'viewing' | 'decision' | 'negotiation' | 'contract' | 'closed'
export type ProcessTarget = 'viewings' | 'offers' | 'documents' | 'next' | 'activity'
export interface TransactionProcess {
  phase: ProcessPhase
  title: string
  description: string
  actor: string
  actionable: boolean
  target: ProcessTarget
  actionLabel: string
}

export const PROCESS_PHASES = [
  { id: 'viewing', label: 'Vizionare' },
  { id: 'decision', label: 'Decizia clientului' },
  { id: 'negotiation', label: 'Negociere' },
  { id: 'contract', label: 'Contract și acte' },
  { id: 'closed', label: 'Încheiere' },
] as const

/** Business evidence determines the next task; a stored CRM stage alone does not. */
export function getTransactionProcess(room: DealRoom, role: AccountRole, userId: string): TransactionProcess {
  const staff = role === 'AGENT' || role === 'ADMIN'
  const offers = room.property_offers || []
  const requirements = room.deal_document_requirements || []
  const result = (phase: ProcessPhase, title: string, description: string, actor: string,
    actionable: boolean, target: ProcessTarget, actionLabel: string): TransactionProcess =>
    ({ phase, title, description, actor, actionable, target, actionLabel })

  if (['CLOSED_WON', 'CLOSED_LOST'].includes(room.stage) || ['CLOSED_WON', 'CLOSED_LOST', 'CANCELLED', 'CLOSED'].includes(room.status)) {
    return result('closed', (room.stage === 'CLOSED_WON' || room.status === 'CLOSED_WON') ? 'Tranzacție finalizată' : 'Dosar închis',
      'Poți consulta documentele și istoricul. Acest dosar nu mai are acțiuni de negociere.',
      'Nicio acțiune în așteptare', false, 'activity', 'Consultă istoricul')
  }

  if (offers.some(offer => offer.status === 'ACCEPTED')) {
    const signature = requirements.find(requirement => relationOne(requirement.client_documents)?.document_signers?.some(signer => signer.user_id === userId && signer.status === 'PENDING'))
    if (signature) return result('contract', `Semnează ${signature.label}`, 'Oferta este acceptată. Verifică documentul înainte de semnare.', 'Tu', true, 'documents', 'Deschide documentele')
    const own = requirements.find(requirement => {
      const state = getDealRequirementState(requirement)
      const assigned = requirement.assigned_to ? requirement.assigned_to === userId : requirement.responsible_role === role
      return assigned && ['missing', 'blocked'].includes(state.bucket)
    })
    if (own) return result('contract', `Pregătește ${own.label}`, 'Oferta este acceptată. Completează documentele care îți sunt atribuite.', 'Tu', true, 'documents', 'Completează documentele')
    const pending = requirements.filter(requirement => !getDealRequirementState(requirement).isComplete)
    const review = pending.find(requirement => getDealRequirementState(requirement).bucket === 'received')
    if (staff && (review || requirements.length === 0)) return result('contract', review ? `Verifică ${review.label}` : 'Pregătește dosarul pentru contract', 'Verifică actele primite și stabilește documentele necesare încheierii.', 'Agentul', true, 'documents', 'Verifică dosarul')
    if (pending.length) return result('contract', 'Documentele sunt în lucru',
      review ? 'Documentele trimise așteaptă verificarea agentului. Nu trebuie încărcate din nou.' : 'Urmărește în dosar documentele și semnăturile care lipsesc.',
      review ? 'Agentul' : 'Responsabilii documentelor', false, 'documents', 'Vezi starea documentelor')
    const ready = getDealStageGate('CLOSED_WON', offers, requirements).ok
    return result('contract', ready ? 'Pregătit pentru încheiere' : 'Se pregătește contractul',
      ready ? 'Oferta și documentele sunt complete. Agentul confirmă încheierea tranzacției.' : 'Agentul pregătește documentele necesare contractului.',
      'Agentul', staff, staff ? 'next' : 'documents', staff ? 'Stabilește încheierea' : 'Consultă dosarul')
  }

  const offer = getActiveDealOffer(offers)
  const completed = (room.deal_appointments || []).map(link => relationOne(link.appointments))
    .filter(appointment => appointment && ['COMPLETED', 'DONE'].includes(appointment.status))
    .sort((a, b) => +(new Date(b!.completed_at || b!.start_at || b!.requested_at)) - +(new Date(a!.completed_at || a!.start_at || a!.requested_at)))[0]
  if (offer || completed?.would_proceed === true || offers.length > 0) {
    const canRespond = offer ? getAllowedDealOfferActions(offer, role, userId, room).some(action => action !== 'WITHDRAWN') : role === 'CLIENT'
    const actor = offer ? offer.offer_kind === 'COUNTER_OFFER' ? 'Clientul' : 'Proprietarul sau agentul' : 'Clientul'
    return result('negotiation', offer ? canRespond ? 'Răspunde la oferta curentă' : 'Oferta așteaptă un răspuns' : 'Următorul pas este oferta',
      offer ? 'Consultă suma și condițiile. Negocierea continuă după răspunsul celeilalte părți.' : 'Clientul propune suma și condițiile. Proprietarul poate accepta sau răspunde cu o contraofertă.',
      canRespond ? 'Tu' : actor, canRespond, 'offers', canRespond ? offer ? 'Răspunde la ofertă' : 'Pregătește oferta' : 'Consultă negocierea')
  }
  if (completed) {
    const declined = completed.would_proceed === false && (completed.rating || 0) > 0
    return result('decision', declined ? 'Clientul nu dorește să continue' : 'Vizionarea s-a încheiat. Urmează decizia.',
      declined ? 'Vizita rămâne în istoric. O ofertă nu este cerută; clientul își poate actualiza decizia după discuția cu agentul.' : 'Clientul spune dacă proprietatea i se potrivește. Documentele contractului vin după negociere.',
      'Clientul', role === 'CLIENT', 'viewings', role === 'CLIENT' ? 'Spune dacă vrei să continui' : 'Vezi rezultatul vizitei')
  }
  return result('viewing', 'Mai întâi, vizionarea', 'Confirmă programarea, efectuează vizita și înregistrează rezultatul. Negocierea va urma dacă proprietatea se potrivește.',
    'Clientul și agentul', staff, 'viewings', 'Deschide vizionarea')
}
