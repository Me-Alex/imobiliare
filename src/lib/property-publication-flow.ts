import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import type { PageKey } from '@/store/slices/navigation'

export type PropertyPublisherRole = Extract<AccountRole, 'OWNER' | 'AGENT' | 'ADMIN'>

export interface PropertyPublicationFlowStep {
  id: string
  title: string
  description: string
  ownerLabel: string
}

export interface PropertyPublicationFlowStat {
  label: string
  value: string
  description: string
}

export interface PropertyPublicationFlow {
  role: PropertyPublisherRole
  roleLabel: string
  title: string
  description: string
  assurance: string
  primaryActionLabel: string
  primaryActionPage: PageKey
  secondaryActionLabel: string
  secondaryActionPage: PageKey
  stats: PropertyPublicationFlowStat[]
  steps: PropertyPublicationFlowStep[]
}

interface PropertyPublicationFlowInput {
  role: PropertyPublisherRole
  propertyCount: number
  sessionPublishedCount: number
}

function propertyCountLabel(count: number) {
  if (count === 1) return '1 proprietate'
  return `${count} proprietăți`
}

function sessionCountLabel(count: number) {
  if (count === 0) return '0 noi'
  if (count === 1) return '1 nouă'
  return `${count} noi`
}

const ROLE_COPY: Record<PropertyPublisherRole, Omit<PropertyPublicationFlow, 'role' | 'roleLabel' | 'stats'>> = {
  OWNER: {
    title: 'Publici ca proprietar',
    description: 'Completezi anunțul o singură dată, apoi platforma îl leagă de cereri, vizionări, feedback, documente și dashboard-ul tău de performanță.',
    assurance: 'După publicare rămâi proprietarul dosarului: vezi interesul, ajustezi calitatea anunțului și încarci actele necesare când apare o tranzacție reală.',
    primaryActionLabel: 'Vezi proprietățile mele',
    primaryActionPage: 'proprietatile-mele',
    secondaryActionLabel: 'Dashboard proprietar',
    secondaryActionPage: 'owner-dashboard',
    steps: [
      {
        id: 'owner-listing',
        title: 'Anunț complet',
        description: 'Adaugi detalii, pin, galerie și tur virtual pentru un anunț ușor de înțeles.',
        ownerLabel: 'Proprietar',
      },
      {
        id: 'owner-quality',
        title: 'Verificare calitate',
        description: 'HQS poate corecta prezentarea și poate aproba tururile virtuale înainte de promovare.',
        ownerLabel: 'HQS',
      },
      {
        id: 'owner-requests',
        title: 'Cereri și vizionări',
        description: 'Solicitările intră în fluxul de programare, cu confirmări și feedback agregat.',
        ownerLabel: 'Agent',
      },
      {
        id: 'owner-documents',
        title: 'Dosar tranzacție',
        description: 'Când există interes serios, documentele proprietății intră în Deal Room.',
        ownerLabel: 'Proprietar + HQS',
      },
    ],
  },
  AGENT: {
    title: 'Publici ca agent',
    description: 'Anunțul intră direct în portofoliul tău, astfel încât lead-urile, vizionările și documentele să rămână conectate cu responsabilul corect.',
    assurance: 'Publicarea devine începutul pipeline-ului: calificare lead, vizionare, ofertă, contract și jurnal complet al acțiunilor.',
    primaryActionLabel: 'Deschide CRM',
    primaryActionPage: 'crm',
    secondaryActionLabel: 'Agenda vizionărilor',
    secondaryActionPage: 'vizionarile-mele',
    steps: [
      {
        id: 'agent-mandate',
        title: 'Context proprietar',
        description: 'Clarifici mandatul, datele de contact și ce documente vor fi necesare ulterior.',
        ownerLabel: 'Agent',
      },
      {
        id: 'agent-listing',
        title: 'Anunț optimizat',
        description: 'Publici cu preț, hartă, galerie, tur virtual și descriere pregătită pentru conversie.',
        ownerLabel: 'Agent',
      },
      {
        id: 'agent-leads',
        title: 'Lead-uri și follow-up',
        description: 'Cererea ajunge în CRM, cu sursă, prioritate și următorul pas pentru client.',
        ownerLabel: 'Agent',
      },
      {
        id: 'agent-deal',
        title: 'Deal Room',
        description: 'Vizionarea, oferta, contractele și semnăturile se urmăresc într-un singur spațiu.',
        ownerLabel: 'Agent + client',
      },
    ],
  },
  ADMIN: {
    title: 'Publici ca administrator',
    description: 'Poți introduce sau corecta proprietăți în numele echipei și verifici dacă anunțurile respectă standardul comercial al platformei.',
    assurance: 'Adminul păstrează controlul operațional: moderare, aprobare tururi, repartizare către agenți și auditul schimbărilor importante.',
    primaryActionLabel: 'Panou admin',
    primaryActionPage: 'admin',
    secondaryActionLabel: 'CRM echipă',
    secondaryActionPage: 'crm',
    steps: [
      {
        id: 'admin-intake',
        title: 'Introducere rapidă',
        description: 'Completezi anunțul de bază și marchezi ce mai trebuie verificat de echipă.',
        ownerLabel: 'Admin',
      },
      {
        id: 'admin-moderation',
        title: 'Moderare conținut',
        description: 'Verifici calitatea fotografiilor, descrierii, pinului și turului virtual.',
        ownerLabel: 'Admin',
      },
      {
        id: 'admin-assignment',
        title: 'Repartizare',
        description: 'Legi proprietatea de agentul potrivit pentru zonă, disponibilitate sau performanță.',
        ownerLabel: 'Admin',
      },
      {
        id: 'admin-audit',
        title: 'Audit și documente',
        description: 'Urmărești traseul publicării, documentele și acțiunile sensibile din platformă.',
        ownerLabel: 'Admin + HQS',
      },
    ],
  },
}

export function getPropertyPublicationFlow({
  role,
  propertyCount,
  sessionPublishedCount,
}: PropertyPublicationFlowInput): PropertyPublicationFlow {
  const definition = ACCOUNT_ROLE_DEFINITIONS[role]
  const copy = ROLE_COPY[role]

  return {
    role,
    roleLabel: definition.label,
    ...copy,
    stats: [
      {
        label: role === 'AGENT' ? 'Portofoliu gestionat' : role === 'ADMIN' ? 'Portofoliu vizibil' : 'Portofoliul tău',
        value: propertyCountLabel(propertyCount),
        description: propertyCount > 0
          ? 'Poți reveni oricând la editare, arhivare sau analiză.'
          : 'Primul anunț va crea baza pentru cereri și vizionări.',
      },
      {
        label: 'Publicate în sesiune',
        value: sessionCountLabel(sessionPublishedCount),
        description: sessionPublishedCount > 0
          ? 'Noile proprietăți au fost adăugate în acest flux.'
          : 'Contorul se actualizează după fiecare publicare reușită.',
      },
      {
        label: 'Următorul spațiu',
        value: role === 'OWNER' ? 'Owner dashboard' : role === 'AGENT' ? 'CRM' : 'Admin',
        description: 'După publicare, activitatea continuă în spațiul specific rolului.',
      },
    ],
  }
}
