import type { AccountRole } from '@/lib/account-roles'
import type { PageKey } from '@/store/slices/navigation'

export interface DocumentWorkspaceEmptyState {
  title: string
  description: string
  actionPage: PageKey
  actionLabel: string
  secondaryHint: string
}

const EMPTY_STATES: Record<AccountRole, DocumentWorkspaceEmptyState> = {
  CLIENT: {
    title: 'Nu ai încă un dosar digital',
    description: 'Dosarul se creează automat după ce programezi o vizionare. Acolo vei vedea fișa, documentele și semnăturile.',
    actionPage: 'programare-vizionare',
    actionLabel: 'Programează o vizionare',
    secondaryHint: 'Poți porni din catalog, iar platforma va lega vizionarea de documente și Deal Room.',
  },
  OWNER: {
    title: 'Nu există dosare pentru proprietățile tale',
    description: 'După prima vizionare programată pentru o proprietate publicată, vei vedea aici documentele și solicitările aferente.',
    actionPage: 'proprietatile-mele',
    actionLabel: 'Vezi proprietățile mele',
    secondaryHint: 'Verifică dacă anunțurile sunt publicate și au agent/intervale disponibile.',
  },
  AGENT: {
    title: 'Nu ai dosare de vizionare în lucru',
    description: 'Dosarele apar după ce există vizionări alocate sau finalizate. De aici vei genera fișe, contracte și cereri de date.',
    actionPage: 'vizionarile-mele',
    actionLabel: 'Vezi agenda vizionărilor',
    secondaryHint: 'Dacă nu apar cereri, verifică disponibilitatea și lead-urile din CRM.',
  },
  ADMIN: {
    title: 'Nu există dosare operaționale',
    description: 'Când apar vizionări, administrația poate audita documentele, versiunile, solicitările și semnăturile din această pagină.',
    actionPage: 'admin',
    actionLabel: 'Deschide centrul admin',
    secondaryHint: 'Poți verifica întâi repartizarea lead-urilor, profilul juridic și șabloanele aprobate.',
  },
}

export function getDocumentWorkspaceEmptyState(role: AccountRole): DocumentWorkspaceEmptyState {
  return EMPTY_STATES[role]
}
