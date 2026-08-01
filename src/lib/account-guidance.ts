import type { AccountRole } from '@/lib/account-roles'
import type { PageKey } from '@/store/slices/navigation'

export interface AccountGuidanceSnapshot {
  dataAvailable?: boolean
  favorites: number
  activeViewings: number
  openRequirements: number
  propertyCount: number
  totalViews: number
  leadCount: number
  activeDeals: number
}

export interface AccountGuidance {
  title: string
  description: string
  actionLabel: string
  page: PageKey
  priority: 'normal' | 'high'
}

export interface AccountJourneyStep {
  label: string
  description: string
  page: PageKey
}

export type AccountProcessStepStatus = 'done' | 'active' | 'next'

export interface AccountProcessStep {
  id: string
  label: string
  description: string
  actionLabel: string
  page: PageKey
  status: AccountProcessStepStatus
}

export type ClientProcessStepStatus = AccountProcessStepStatus

export interface ClientProcessStep extends AccountProcessStep {
  id: 'discover' | 'viewing' | 'deal' | 'documents' | 'coins'
}

const JOURNEYS: Record<AccountRole, readonly AccountJourneyStep[]> = {
  CLIENT: [
    { label: 'Descoperă', description: 'Compară și salvează proprietăți', page: 'proprietati' },
    { label: 'Vizitează', description: 'Alege o proprietate și un interval', page: 'programare-vizionare' },
    { label: 'Negociază', description: 'Urmărește oferta și pașii tranzacției', page: 'deal-room' },
    { label: 'Semnează', description: 'Rezolvă documentele din dosar', page: 'documente' },
  ],
  OWNER: [
    { label: 'Publică', description: 'Creează și optimizează anunțul', page: 'adauga-proprietate' },
    { label: 'Măsoară', description: 'Urmărește interesul și feedbackul', page: 'owner-dashboard' },
    { label: 'Confirmă', description: 'Gestionează solicitările de vizionare', page: 'vizionarile-mele' },
    { label: 'Negociază', description: 'Urmărește oferta și următorul pas', page: 'deal-room' },
    { label: 'Semnează', description: 'Completează documentele tranzacției', page: 'documente' },
  ],
  AGENT: [
    { label: 'Organizează', description: 'Actualizează disponibilitatea echipei', page: 'disponibilitate-staff' },
    { label: 'Califică', description: 'Prioritizează lead-urile din CRM', page: 'crm' },
    { label: 'Planifică', description: 'Coordonează vizionările alocate', page: 'vizionarile-mele' },
    { label: 'Negociază', description: 'Condu tranzacția în Deal Room', page: 'deal-room' },
    { label: 'Închide dosarul', description: 'Verifică documentele și semnăturile', page: 'documente' },
  ],
  ADMIN: [
    { label: 'Prioritizează', description: 'Rezolvă blocajele operaționale', page: 'admin' },
    { label: 'Distribuie', description: 'Alocă lead-uri și urmărește conversia', page: 'crm' },
    { label: 'Deblochează', description: 'Verifică dosarele și semnăturile', page: 'documente' },
    { label: 'Auditează', description: 'Urmărește tranzacțiile active', page: 'deal-room' },
  ],
}

export function getAccountJourney(role: AccountRole): readonly AccountJourneyStep[] {
  return JOURNEYS[role]
}

function applyProcessStatuses<T extends AccountProcessStep>(
  steps: readonly Omit<T, 'status'>[],
  activeId: T['id'],
): readonly T[] {
  const activeIndex = steps.findIndex((step) => step.id === activeId)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex

  return steps.map((step, index) => ({
    ...step,
    status: index < safeActiveIndex ? 'done' : index === safeActiveIndex ? 'active' : 'next',
  })) as unknown as readonly T[]
}

export function getClientProcessSteps(snapshot: AccountGuidanceSnapshot): readonly ClientProcessStep[] {
  const activeId: ClientProcessStep['id'] = snapshot.openRequirements > 0
    ? 'documents'
    : snapshot.activeDeals > 0
      ? 'deal'
      : snapshot.activeViewings > 0 || snapshot.favorites > 0
        ? 'viewing'
        : 'discover'

  const viewingHasBooking = snapshot.activeViewings > 0
  const steps: Array<Omit<ClientProcessStep, 'status'>> = [
    {
      id: 'discover',
      label: 'Caută',
      description: snapshot.favorites > 0
        ? `${snapshot.favorites} ${snapshot.favorites === 1 ? 'favorită salvată' : 'favorite salvate'} pentru comparație.`
        : 'Alege proprietăți și salvează opțiunile bune.',
      actionLabel: 'Vezi proprietăți',
      page: 'proprietati',
    },
    {
      id: 'viewing',
      label: 'Programează',
      description: viewingHasBooking
        ? `${snapshot.activeViewings} ${snapshot.activeViewings === 1 ? 'vizionare activă' : 'vizionări active'} de urmărit.`
        : snapshot.favorites > 0
          ? 'Transformă o favorită într-o vizionare.'
          : 'Alege proprietatea și intervalul potrivit.',
      actionLabel: viewingHasBooking ? 'Vezi vizionările' : 'Programează',
      page: viewingHasBooking ? 'vizionarile-mele' : 'programare-vizionare',
    },
    {
      id: 'deal',
      label: 'Deal Room',
      description: snapshot.activeDeals > 0
        ? 'Urmărește oferta, contraoferta și persoana responsabilă.'
        : 'Se activează când vizionarea avansează spre ofertă.',
      actionLabel: 'Deschide Deal Room',
      page: 'deal-room',
    },
    {
      id: 'documents',
      label: 'Documente',
      description: snapshot.openRequirements > 0
        ? `${snapshot.openRequirements} ${snapshot.openRequirements === 1 ? 'cerință deschisă' : 'cerințe deschise'} de completat sau semnat.`
        : 'Datele și semnăturile apar aici când sunt necesare.',
      actionLabel: 'Deschide dosarul',
      page: 'documente',
    },
    {
      id: 'coins',
      label: 'Coins',
      description: 'Verifică recompensele și beneficiile disponibile în cont.',
      actionLabel: 'Vezi Coins',
      page: 'monede',
    },
  ]

  return applyProcessStatuses<ClientProcessStep>(steps, activeId)
}

function getOwnerProcessSteps(snapshot: AccountGuidanceSnapshot): readonly AccountProcessStep[] {
  const activeId = snapshot.dataAvailable === false
    ? 'performance'
    : snapshot.openRequirements > 0
      ? 'documents'
      : snapshot.activeDeals > 0
        ? 'deal'
        : snapshot.activeViewings > 0
          ? 'viewings'
          : snapshot.propertyCount > 0
            ? 'performance'
            : 'publish'

  const steps: readonly Omit<AccountProcessStep, 'status'>[] = [
    {
      id: 'publish',
      label: 'Publică',
      description: snapshot.propertyCount > 0
        ? `${snapshot.propertyCount} ${snapshot.propertyCount === 1 ? 'proprietate publicată' : 'proprietăți publicate'} sau în lucru.`
        : 'Adaugă prima proprietate cu detalii, hartă, fotografii și tur.',
      actionLabel: snapshot.propertyCount > 0 ? 'Gestionează proprietăți' : 'Publică proprietatea',
      page: snapshot.propertyCount > 0 ? 'proprietatile-mele' : 'adauga-proprietate',
    },
    {
      id: 'performance',
      label: 'Măsoară',
      description: snapshot.totalViews > 0
        ? `${snapshot.totalViews} vizualizări agregate; verifică feedbackul și recomandările.`
        : 'Urmărește interesul, calitatea anunțului și ajustările sugerate.',
      actionLabel: 'Vezi dashboard proprietar',
      page: 'owner-dashboard',
    },
    {
      id: 'viewings',
      label: 'Confirmă',
      description: snapshot.activeViewings > 0
        ? `${snapshot.activeViewings} ${snapshot.activeViewings === 1 ? 'solicitare activă' : 'solicitări active'} de urmărit.`
        : 'Solicitările de vizionare apar aici după publicare.',
      actionLabel: 'Vezi solicitările',
      page: 'vizionarile-mele',
    },
    {
      id: 'deal',
      label: 'Negociază',
      description: snapshot.activeDeals > 0
        ? 'Urmărește oferta, contraoferta și următorul responsabil.'
        : 'Deal Room-ul devine activ când o vizionare avansează spre ofertă.',
      actionLabel: 'Deschide Deal Room',
      page: 'deal-room',
    },
    {
      id: 'documents',
      label: 'Semnează',
      description: snapshot.openRequirements > 0
        ? `${snapshot.openRequirements} ${snapshot.openRequirements === 1 ? 'cerință deschisă' : 'cerințe deschise'} în dosarul tranzacției.`
        : 'Documentele și semnăturile apar când tranzacția le cere.',
      actionLabel: 'Deschide documentele',
      page: 'documente',
    },
  ]

  return applyProcessStatuses<AccountProcessStep>(steps, activeId)
}

function getAgentProcessSteps(snapshot: AccountGuidanceSnapshot): readonly AccountProcessStep[] {
  const activeId = snapshot.dataAvailable === false
    ? 'crm'
    : snapshot.openRequirements > 0
      ? 'documents'
      : snapshot.activeViewings > 0
        ? 'viewings'
        : snapshot.leadCount > 0
          ? 'crm'
          : snapshot.activeDeals > 0
            ? 'deal'
            : 'availability'

  const steps: readonly Omit<AccountProcessStep, 'status'>[] = [
    {
      id: 'availability',
      label: 'Disponibilitate',
      description: 'Setează intervalele reale ca programările să nu necesite mesaje extra.',
      actionLabel: 'Setează intervale',
      page: 'disponibilitate-staff',
    },
    {
      id: 'crm',
      label: 'Califică lead-uri',
      description: snapshot.leadCount > 0
        ? `${snapshot.leadCount} ${snapshot.leadCount === 1 ? 'lead activ' : 'lead-uri active'} așteaptă follow-up.`
        : 'Lead-urile noi și sursa lor se urmăresc în CRM.',
      actionLabel: 'Deschide CRM',
      page: 'crm',
    },
    {
      id: 'viewings',
      label: 'Planifică vizionări',
      description: snapshot.activeViewings > 0
        ? `${snapshot.activeViewings} ${snapshot.activeViewings === 1 ? 'vizionare alocată' : 'vizionări alocate'} de confirmat sau finalizat.`
        : 'Confirmă participanții, prezența și feedbackul după vizionare.',
      actionLabel: 'Vezi agenda',
      page: 'vizionarile-mele',
    },
    {
      id: 'deal',
      label: 'Condu Deal Room',
      description: snapshot.activeDeals > 0
        ? 'Setează oferta, contraoferta și următorul pas responsabil.'
        : 'Deal Room-ul unește vizionarea, documentele și oferta.',
      actionLabel: 'Deschide tranzacții',
      page: 'deal-room',
    },
    {
      id: 'documents',
      label: 'Închide dosarul',
      description: snapshot.openRequirements > 0
        ? `${snapshot.openRequirements} ${snapshot.openRequirements === 1 ? 'cerință de document' : 'cerințe de documente'} necesită acțiune.`
        : 'Generează, verifică și urmărește semnăturile când sunt necesare.',
      actionLabel: 'Rezolvă documente',
      page: 'documente',
    },
  ]

  return applyProcessStatuses<AccountProcessStep>(steps, activeId)
}

function getAdminProcessSteps(snapshot: AccountGuidanceSnapshot): readonly AccountProcessStep[] {
  const activeId = snapshot.dataAvailable === false
    ? 'admin'
    : snapshot.openRequirements > 0
      ? 'documents'
      : snapshot.leadCount > 0
        ? 'crm'
        : snapshot.activeDeals > 0
          ? 'deals'
          : 'admin'

  const steps: readonly Omit<AccountProcessStep, 'status'>[] = [
    {
      id: 'admin',
      label: 'Prioritizează',
      description: 'Vezi blocajele platformei, utilizatorii și proprietățile care cer decizie.',
      actionLabel: 'Deschide administrarea',
      page: 'admin',
    },
    {
      id: 'crm',
      label: 'Repartizează',
      description: snapshot.leadCount > 0
        ? `${snapshot.leadCount} ${snapshot.leadCount === 1 ? 'lead activ' : 'lead-uri active'} de verificat și distribuit.`
        : 'Alocă lead-uri după zonă, disponibilitate și performanță.',
      actionLabel: 'Deschide CRM',
      page: 'crm',
    },
    {
      id: 'documents',
      label: 'Deblochează',
      description: snapshot.openRequirements > 0
        ? `${snapshot.openRequirements} ${snapshot.openRequirements === 1 ? 'cerință' : 'cerințe'} pot bloca tranzacții.`
        : 'Urmărește aprobările, versiunile și semnăturile documentelor.',
      actionLabel: 'Verifică documente',
      page: 'documente',
    },
    {
      id: 'deals',
      label: 'Auditează',
      description: snapshot.activeDeals > 0
        ? 'Controlează termenele, responsabilii și istoricul Deal Room-urilor.'
        : 'Tranzacțiile active vor apărea aici pentru audit operațional.',
      actionLabel: 'Deschide Deal Room',
      page: 'deal-room',
    },
  ]

  return applyProcessStatuses<AccountProcessStep>(steps, activeId)
}

export function getAccountProcessSteps(
  role: AccountRole,
  snapshot: AccountGuidanceSnapshot,
): readonly AccountProcessStep[] {
  if (role === 'CLIENT') return getClientProcessSteps(snapshot)
  if (role === 'OWNER') return getOwnerProcessSteps(snapshot)
  if (role === 'AGENT') return getAgentProcessSteps(snapshot)
  return getAdminProcessSteps(snapshot)
}

export function getAccountGuidance(
  role: AccountRole,
  snapshot: AccountGuidanceSnapshot,
): AccountGuidance {
  if (snapshot.dataAvailable === false) {
    const fallback: Record<AccountRole, Pick<AccountGuidance, 'title' | 'actionLabel' | 'page'>> = {
      CLIENT: { title: 'Continuă explorarea proprietăților', actionLabel: 'Descoperă proprietăți', page: 'proprietati' },
      OWNER: { title: 'Continuă administrarea portofoliului', actionLabel: 'Vezi performanța', page: 'owner-dashboard' },
      AGENT: { title: 'Continuă activitatea comercială', actionLabel: 'Deschide CRM-ul', page: 'crm' },
      ADMIN: { title: 'Continuă administrarea platformei', actionLabel: 'Deschide administrarea', page: 'admin' },
    }
    return {
      ...fallback[role],
      description: 'Datele live se vor reîncărca în pagina destinației; navigarea rămâne disponibilă.',
      priority: 'normal',
    }
  }

  if (snapshot.openRequirements > 0) {
    return {
      title: `${snapshot.openRequirements} ${snapshot.openRequirements === 1 ? 'document necesită' : 'documente necesită'} atenție`,
      description: 'Rezolvă cerințele deschise pentru ca tranzacțiile să nu rămână blocate.',
      actionLabel: 'Deschide dosarul digital',
      page: 'documente',
      priority: 'high',
    }
  }

  if (role === 'CLIENT') {
    if (snapshot.activeDeals > 0) {
      return {
        title: 'Continuă tranzacția activă',
        description: 'Vezi oferta, responsabilul curent și următorul pas într-un singur loc.',
        actionLabel: 'Deschide tranzacția',
        page: 'deal-room',
        priority: 'normal',
      }
    }
    if (snapshot.activeViewings > 0) {
      return {
        title: 'Pregătește următoarea vizionare',
        description: 'Confirmă programarea și verifică detaliile înainte de întâlnire.',
        actionLabel: 'Vezi vizionările',
        page: 'vizionarile-mele',
        priority: 'normal',
      }
    }
    if (snapshot.favorites > 0) {
      return {
        title: 'Transformă o favorită într-o vizionare',
        description: 'Alege proprietatea potrivită și rezervă un interval disponibil.',
        actionLabel: 'Programează o vizionare',
        page: 'programare-vizionare',
        priority: 'normal',
      }
    }
    return {
      title: 'Începe cu o selecție potrivită pentru tine',
      description: 'Explorează proprietățile și salvează ofertele pe care vrei să le compari.',
      actionLabel: 'Descoperă proprietăți',
      page: 'proprietati',
      priority: 'normal',
    }
  }

  if (role === 'OWNER') {
    if (snapshot.propertyCount === 0) {
      return {
        title: 'Publică prima proprietate',
        description: 'Un formular ghidat te ajută să pregătești un anunț complet și convingător.',
        actionLabel: 'Publică proprietatea',
        page: 'adauga-proprietate',
        priority: 'normal',
      }
    }
    if (snapshot.activeViewings > 0) {
      return {
        title: 'Răspunde solicitărilor de vizionare',
        description: 'Confirmă programările și urmărește feedbackul primit de la clienți.',
        actionLabel: 'Vezi solicitările',
        page: 'vizionarile-mele',
        priority: 'normal',
      }
    }
    return {
      title: snapshot.totalViews > 0 ? 'Optimizează performanța anunțului' : 'Pregătește anunțul pentru primele vizualizări',
      description: 'Verifică interesul, calitatea anunțului și recomandările de ajustare.',
      actionLabel: 'Vezi performanța',
      page: 'owner-dashboard',
      priority: 'normal',
    }
  }

  if (role === 'AGENT') {
    if (snapshot.activeViewings > 0) {
      return {
        title: 'Pregătește vizionările alocate',
        description: 'Confirmă participanții, prezența și documentele necesare întâlnirilor.',
        actionLabel: 'Deschide agenda',
        page: 'vizionarile-mele',
        priority: 'normal',
      }
    }
    if (snapshot.leadCount > 0) {
      return {
        title: `${snapshot.leadCount} ${snapshot.leadCount === 1 ? 'lead așteaptă' : 'lead-uri așteaptă'} follow-up`,
        description: 'Prioritizează contactele noi și mută oportunitățile în etapa următoare.',
        actionLabel: 'Deschide CRM-ul',
        page: 'crm',
        priority: 'normal',
      }
    }
    if (snapshot.activeDeals > 0) {
      return {
        title: 'Actualizează tranzacțiile active',
        description: 'Setează următorul pas și responsabilul pentru fiecare Deal Room.',
        actionLabel: 'Deschide tranzacțiile',
        page: 'deal-room',
        priority: 'normal',
      }
    }
    return {
      title: 'Configurează disponibilitatea echipei',
      description: 'Intervalele actualizate reduc schimburile de mesaje și programările ratate.',
      actionLabel: 'Setează disponibilitatea',
      page: 'disponibilitate-staff',
      priority: 'normal',
    }
  }

  if (snapshot.leadCount > 0) {
    return {
      title: `${snapshot.leadCount} ${snapshot.leadCount === 1 ? 'lead necesită' : 'lead-uri necesită'} repartizare`,
      description: 'Verifică prioritatea și distribuie oportunitățile către agentul potrivit.',
      actionLabel: 'Gestionează repartizarea',
      page: 'crm',
      priority: 'normal',
    }
  }
  if (snapshot.activeDeals > 0) {
    return {
      title: 'Auditează tranzacțiile active',
      description: 'Verifică termenele, responsabilii și pașii care pot bloca închiderea.',
      actionLabel: 'Deschide tranzacțiile',
      page: 'deal-room',
      priority: 'normal',
    }
  }
  return {
    title: 'Verifică starea operațională a platformei',
    description: 'Panoul administrativ concentrează utilizatorii, conținutul și alertele importante.',
    actionLabel: 'Deschide administrarea',
    page: 'admin',
    priority: 'normal',
  }
}
