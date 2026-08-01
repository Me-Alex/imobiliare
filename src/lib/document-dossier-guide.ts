import type { AccountRole } from '@/lib/account-roles'
import type {
  DocumentActionPlan,
  DocumentActionPlanItem,
  DocumentActionPlanOwner,
} from '@/lib/document-action-plan'
import type { DocumentQuickActionTarget } from '@/lib/document-quick-actions'

export type DocumentDossierGuideCardId = 'role-action' | 'handoff' | 'archive'
export type DocumentDossierGuideTone = 'primary' | 'waiting' | 'complete' | 'blocked' | 'muted'

export interface DocumentDossierGuideCard {
  id: DocumentDossierGuideCardId
  title: string
  description: string
  badgeLabel: string
  itemIds: readonly DocumentActionPlanItem['id'][]
  target: DocumentQuickActionTarget
  buttonLabel: string
  tone: DocumentDossierGuideTone
  disabled?: boolean
}

export interface DocumentDossierGuide {
  headline: string
  description: string
  cards: readonly DocumentDossierGuideCard[]
  detailToggleLabel: string
  detailToggleDescription: string
}

interface DocumentDossierGuideInput {
  role: AccountRole
  plan: DocumentActionPlan
  documentsCount: number
  requestsCount: number
}

const ACTOR_OWNERS: Record<AccountRole, readonly DocumentActionPlanOwner[]> = {
  CLIENT: ['CLIENT'],
  OWNER: ['OWNER'],
  AGENT: ['AGENT', 'AGENCY'],
  ADMIN: ['ADMIN', 'AGENCY'],
}

const ACTIVE_STATES = new Set<DocumentActionPlanItem['state']>(['current', 'blocked'])
const WAITING_STATES = new Set<DocumentActionPlanItem['state']>(['current', 'waiting', 'blocked'])

function plural(value: number, singular: string, pluralValue: string) {
  return `${value} ${value === 1 ? singular : pluralValue}`
}

function actorLabel(role: AccountRole) {
  if (role === 'CLIENT') return 'client'
  if (role === 'OWNER') return 'proprietar'
  if (role === 'AGENT') return 'agent'
  return 'admin'
}

function ownsItem(role: AccountRole, item: DocumentActionPlanItem) {
  return ACTOR_OWNERS[role].includes(item.owner)
}

function itemTitles(items: readonly DocumentActionPlanItem[]) {
  return items.map((item) => item.title.toLowerCase()).join(', ')
}

function relevantWaitingItems(role: AccountRole, plan: DocumentActionPlan) {
  return plan.items.filter((item) =>
    item.owner !== 'SYSTEM'
    && !ownsItem(role, item)
    && WAITING_STATES.has(item.state),
  )
}

function actorItems(role: AccountRole, plan: DocumentActionPlan) {
  return plan.items.filter((item) => ownsItem(role, item) && ACTIVE_STATES.has(item.state))
}

function archiveItem(plan: DocumentActionPlan) {
  return plan.items.find((item) => item.id === 'archive') ?? null
}

export function getDocumentDossierGuide({
  role,
  plan,
  documentsCount,
  requestsCount,
}: DocumentDossierGuideInput): DocumentDossierGuide {
  const archive = archiveItem(plan)

  if (plan.readOnly) {
    return {
      headline: 'Dosarul este în modul consultare',
      description: 'Nu mai există pași noi. Păstrăm documentele, versiunile și jurnalul pentru participanții autorizați.',
      detailToggleLabel: 'Vezi detaliile dosarului închis',
      detailToggleDescription: 'Istoricul rămâne disponibil, dar acțiunile de generare, încărcare și semnare sunt oprite.',
      cards: [
        {
          id: 'role-action',
          title: 'Nu ai acțiuni noi',
          description: 'Programarea este închisă, deci nu trebuie să completezi sau să semnezi nimic în acest dosar.',
          badgeLabel: 'Închis',
          itemIds: plan.items.map((item) => item.id),
          target: 'archive',
          buttonLabel: 'Vezi arhiva',
          tone: 'muted',
        },
        {
          id: 'handoff',
          title: 'Fluxul este oprit',
          description: 'Dacă este nevoie de un pas nou, se pornește o programare sau o tranzacție nouă.',
          badgeLabel: 'Fără handoff',
          itemIds: [],
          target: 'deal-room',
          buttonLabel: 'Vezi contextul',
          tone: 'complete',
        },
        {
          id: 'archive',
          title: documentsCount > 0 ? 'Documente păstrate' : 'Arhivă goală',
          description: archive?.description ?? 'Arhiva afișează documentele disponibile pentru consultare.',
          badgeLabel: plural(documentsCount, 'document', 'documente'),
          itemIds: archive ? [archive.id] : [],
          target: 'archive',
          buttonLabel: 'Deschide arhiva',
          tone: documentsCount > 0 ? 'complete' : 'muted',
        },
      ],
    }
  }

  const ownItems = actorItems(role, plan)
  const waitingItems = relevantWaitingItems(role, plan)
  const primaryItem = plan.primaryItemId
    ? plan.items.find((item) => item.id === plan.primaryItemId) ?? null
    : null
  const roleName = actorLabel(role)
  const hasOwnWork = ownItems.length > 0
  const hasWaitingWork = waitingItems.length > 0

  const actionCard: DocumentDossierGuideCard = hasOwnWork
    ? {
        id: 'role-action',
        title: `Ce faci tu acum, ca ${roleName}`,
        description: `Rezolvă ${itemTitles(ownItems)}. Restul pașilor rămân vizibili mai jos pentru context.`,
        badgeLabel: plural(ownItems.length, 'pas al tău', 'pași ai tăi'),
        itemIds: ownItems.map((item) => item.id),
        target: 'primary',
        buttonLabel: 'Rezolvă pasul curent',
        tone: ownItems.some((item) => item.state === 'blocked') ? 'blocked' : 'primary',
      }
    : hasWaitingWork
      ? {
          id: 'role-action',
          title: 'Nu trebuie să modifici nimic acum',
          description: `Dosarul așteaptă ${itemTitles(waitingItems)}. Poți verifica statusul fără să cauți prin toate secțiunile.`,
          badgeLabel: 'Aștepți',
          itemIds: primaryItem ? [primaryItem.id] : waitingItems.map((item) => item.id),
          target: 'advanced',
          buttonLabel: 'Vezi statusul',
          tone: 'waiting',
        }
      : {
          id: 'role-action',
          title: 'Rolul tău este la zi',
          description: 'Nu există completări, încărcări sau semnături restante pentru contul tău.',
          badgeLabel: 'La zi',
          itemIds: primaryItem ? [primaryItem.id] : [],
          target: 'archive',
          buttonLabel: 'Vezi arhiva',
          tone: 'complete',
        }

  return {
    headline: 'Dosarul, pe scurt',
    description: 'Am separat procesul în trei zone: ce faci tu, ce așteaptă de la ceilalți și ce rămâne în arhivă.',
    detailToggleLabel: 'Vezi harta detaliată și checklist-ul',
    detailToggleDescription: 'Detaliile sunt păstrate pentru audit, dar pagina începe cu pașii esențiali.',
    cards: [
      actionCard,
      {
        id: 'handoff',
        title: role === 'CLIENT' || role === 'OWNER' ? 'Ce verifică agenția' : 'Ce așteaptă de la participanți',
        description: hasWaitingWork
          ? `În lucru: ${itemTitles(waitingItems)}.`
          : requestsCount > 0
            ? `${plural(requestsCount, 'solicitare urmărită', 'solicitări urmărite')} în dosar, fără blocaj vizibil pentru rolul tău.`
            : 'Nu există handoff-uri active în acest moment.',
        badgeLabel: hasWaitingWork ? plural(waitingItems.length, 'handoff', 'handoff-uri') : 'Fără blocaj',
        itemIds: waitingItems.map((item) => item.id),
        target: hasWaitingWork ? 'advanced' : 'deal-room',
        buttonLabel: hasWaitingWork ? 'Vezi detalii' : 'Vezi contextul',
        tone: hasWaitingWork ? 'waiting' : 'complete',
      },
      {
        id: 'archive',
        title: documentsCount > 0 ? 'Documente, versiuni și jurnal' : 'Arhiva se creează automat',
        description: archive?.description ?? 'Aici apar documentele generate, încărcate, semnate sau păstrate pentru consultare.',
        badgeLabel: plural(documentsCount, 'document', 'documente'),
        itemIds: archive ? [archive.id] : [],
        target: 'archive',
        buttonLabel: 'Deschide arhiva',
        tone: documentsCount > 0 ? 'complete' : 'muted',
      },
    ],
  }
}
