import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import type { PageKey } from '@/store/slices/navigation'

export type PropertyPublisherRole = Extract<AccountRole, 'OWNER' | 'AGENT' | 'ADMIN'>

export interface PropertyPublicationFlowStep {
  id: string
  title: string
  description: string
  ownerLabel: string
}

export type PropertyPublicationPreflightTargetType = 'section' | 'page'

export interface PropertyPublicationPreflightItem {
  id: string
  title: string
  description: string
  actionLabel: string
  targetType: PropertyPublicationPreflightTargetType
  target: string | PageKey
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
  preflight: PropertyPublicationPreflightItem[]
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
    preflight: [
      {
        id: 'owner-story',
        title: 'Povestea anunțului',
        description: 'Începe cu titlul, descrierea și tipul tranzacției ca anunțul să aibă direcție clară.',
        actionLabel: 'Scrie descrierea',
        targetType: 'section',
        target: 'property-step-basic',
      },
      {
        id: 'owner-commercial',
        title: 'Preț și suprafață',
        description: 'Completează prețul, suprafața și detaliile folosite în comparații și filtrare.',
        actionLabel: 'Adaugă detalii',
        targetType: 'section',
        target: 'property-step-details',
      },
      {
        id: 'owner-location',
        title: 'Adresă + pin',
        description: 'Confirmă zona și pinul pe hartă ca să reduci întrebările repetitive despre localizare.',
        actionLabel: 'Setează pinul',
        targetType: 'section',
        target: 'property-step-location',
      },
      {
        id: 'owner-media',
        title: 'Galerie și tur',
        description: 'Adaugă fotografii și, dacă ai, un tur virtual pentru clienți mai bine filtrați.',
        actionLabel: 'Adaugă media',
        targetType: 'section',
        target: 'property-step-images',
      },
    ],
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
    preflight: [
      {
        id: 'agent-mandate-check',
        title: 'Context mandat',
        description: 'Clarifică rapid cine este proprietarul, zona, prețul cerut și ce documente vor lipsi.',
        actionLabel: 'Pornește anunțul',
        targetType: 'section',
        target: 'property-step-basic',
      },
      {
        id: 'agent-commercial-check',
        title: 'Date comerciale',
        description: 'Prețul, suprafața și camerele trebuie să susțină filtrarea și evaluarea lead-urilor.',
        actionLabel: 'Completează cifrele',
        targetType: 'section',
        target: 'property-step-details',
      },
      {
        id: 'agent-media-check',
        title: 'Pin + media',
        description: 'Pinul, fotografiile și turul virtual scad vizionările nepotrivite.',
        actionLabel: 'Pregătește vizualul',
        targetType: 'section',
        target: 'property-step-location',
      },
      {
        id: 'agent-crm-handoff',
        title: 'Handoff CRM',
        description: 'După publicare, lead-urile și follow-up-urile continuă în pipeline-ul agentului.',
        actionLabel: 'Vezi CRM',
        targetType: 'page',
        target: 'crm',
      },
    ],
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
    preflight: [
      {
        id: 'admin-intake-check',
        title: 'Introducere rapidă',
        description: 'Completează minimul publicabil, apoi marchează ce trebuie verificat de echipă.',
        actionLabel: 'Începe formularul',
        targetType: 'section',
        target: 'property-step-basic',
      },
      {
        id: 'admin-location-check',
        title: 'Control localizare',
        description: 'Adresa și pinul trebuie să fie consecvente înainte de moderare sau repartizare.',
        actionLabel: 'Verifică pinul',
        targetType: 'section',
        target: 'property-step-location',
      },
      {
        id: 'admin-media-check',
        title: 'Moderare vizuală',
        description: 'Fotografiile și turul virtual intră în standardul de calitate al platformei.',
        actionLabel: 'Verifică media',
        targetType: 'section',
        target: 'property-step-images',
      },
      {
        id: 'admin-audit-check',
        title: 'Audit operațional',
        description: 'După publicare, admin-ul urmărește statusul, agentul responsabil și blocajele.',
        actionLabel: 'Panou admin',
        targetType: 'page',
        target: 'admin',
      },
    ],
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
