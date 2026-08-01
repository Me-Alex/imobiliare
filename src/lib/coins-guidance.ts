import type { AccountRole } from '@/lib/account-roles'
import { COIN_EARN_RULES } from '@/lib/constants'
import type { CoinReward } from '@/lib/types'
import type { PageKey } from '@/store/use-app-store'

export type CoinGuidanceTone = 'amber' | 'emerald' | 'sky' | 'violet' | 'rose'

export interface CoinGuidanceHighlight {
  id: string
  label: string
  value: string
  description: string
  tone: CoinGuidanceTone
}

export interface CoinGuidanceStep {
  id: string
  title: string
  description: string
  coinsLabel: string
  page: PageKey
  actionLabel: string
}

export interface CoinGuidanceAction {
  id: string
  title: string
  description: string
  page: PageKey
  actionLabel: string
  tone: CoinGuidanceTone
}

export interface RoleCoinGuidance {
  role: AccountRole
  eyebrow: string
  title: string
  description: string
  highlights: readonly CoinGuidanceHighlight[]
  earningPath: readonly CoinGuidanceStep[]
  nextActions: readonly CoinGuidanceAction[]
  trustNotes: readonly string[]
}

export interface CoinGuidanceInput {
  balance: number
  claimedToday: boolean
  rewards: readonly CoinReward[]
  transactionsCount: number
  pendingRedemptions: number
  hasError: boolean
}

const coinLabel = (amount: number) => `+${amount} monede`

const ROLE_HIGHLIGHTS: Record<AccountRole, readonly CoinGuidanceHighlight[]> = {
  CLIENT: [
    {
      id: 'client-use',
      label: 'Folosești pentru',
      value: 'vizionări + rapoarte',
      description: 'Prioritizezi discuțiile cu agenții, rapoartele de evaluare și reducerile la tranzacție.',
      tone: 'sky',
    },
    {
      id: 'client-earn',
      label: 'Câștigi din',
      value: 'căutare verificată',
      description: 'Favorite, proprietăți vizualizate, programări și vizionări finalizate.',
      tone: 'emerald',
    },
    {
      id: 'client-control',
      label: 'Control',
      value: 'sold personal',
      description: 'Soldul este legat de cont și se actualizează numai prin acțiuni eligibile.',
      tone: 'amber',
    },
  ],
  OWNER: [
    {
      id: 'owner-use',
      label: 'Folosești pentru',
      value: 'promovare anunț',
      description: 'Evidențiere, promovare și servicii care cresc calitatea publicării.',
      tone: 'violet',
    },
    {
      id: 'owner-earn',
      label: 'Câștigi din',
      value: 'portofoliu complet',
      description: 'Publicare, revenire zilnică și activitate verificată pe proprietățile tale.',
      tone: 'emerald',
    },
    {
      id: 'owner-control',
      label: 'Control',
      value: 'cereri transparente',
      description: 'Vezi ce ai solicitat, ce este în verificare și ce a fost activat.',
      tone: 'amber',
    },
  ],
  AGENT: [
    {
      id: 'agent-use',
      label: 'Folosești pentru',
      value: 'prioritizare lead-uri',
      description: 'Monedele te ajută să vezi ce clienți au activitate reală și interes verificat.',
      tone: 'sky',
    },
    {
      id: 'agent-earn',
      label: 'Câștigi din',
      value: 'activitate CRM',
      description: 'Publicări în portofoliu, revenire zilnică și acțiuni care mută tranzacția înainte.',
      tone: 'emerald',
    },
    {
      id: 'agent-control',
      label: 'Control',
      value: 'audit pe cereri',
      description: 'Cererile de recompense rămân verificabile în admin înainte de activare.',
      tone: 'amber',
    },
  ],
  ADMIN: [
    {
      id: 'admin-use',
      label: 'Folosești pentru',
      value: 'guvernanță',
      description: 'Adminul vede programul ca sistem de loialitate, verificare și risc operațional.',
      tone: 'rose',
    },
    {
      id: 'admin-earn',
      label: 'Câștigi din',
      value: 'operațiuni reale',
      description: 'Activitatea verificată poate fi auditată înainte ca recompensele să fie onorate.',
      tone: 'emerald',
    },
    {
      id: 'admin-control',
      label: 'Control',
      value: 'aprobare centrală',
      description: 'Recompensele cerute sunt aprobate sau respinse din zona de administrare.',
      tone: 'amber',
    },
  ],
}

const ROLE_EARNING_PATHS: Record<AccountRole, readonly CoinGuidanceStep[]> = {
  CLIENT: [
    {
      id: 'daily',
      title: 'Revendică recompensa zilnică',
      description: 'Intrarea zilnică îți pornește portofelul și streak-ul.',
      coinsLabel: coinLabel(COIN_EARN_RULES.daily_login.coins),
      page: 'monede',
      actionLabel: 'Vezi recompensa',
    },
    {
      id: 'favorite',
      title: 'Salvează proprietăți relevante',
      description: 'Favoritele arată interes real și te ajută să revii rapid la oferte.',
      coinsLabel: coinLabel(COIN_EARN_RULES.favorite.coins),
      page: 'proprietati',
      actionLabel: 'Caută proprietăți',
    },
    {
      id: 'viewing',
      title: 'Programează și finalizează vizionarea',
      description: 'Monedele importante vin când vizionarea devine o acțiune confirmată.',
      coinsLabel: `${coinLabel(COIN_EARN_RULES.book_viewing.coins)} / ${coinLabel(COIN_EARN_RULES.complete_viewing.coins)}`,
      page: 'programare-vizionare',
      actionLabel: 'Programează',
    },
  ],
  OWNER: [
    {
      id: 'daily',
      title: 'Revendică recompensa zilnică',
      description: 'Menține contul activ cât timp proprietatea este în piață.',
      coinsLabel: coinLabel(COIN_EARN_RULES.daily_login.coins),
      page: 'monede',
      actionLabel: 'Vezi recompensa',
    },
    {
      id: 'publish',
      title: 'Publică proprietatea complet',
      description: 'Adaugă date, fotografii, hartă și tur virtual ca anunțul să fie ușor de aprobat.',
      coinsLabel: coinLabel(COIN_EARN_RULES.add_property.coins),
      page: 'adauga-proprietate',
      actionLabel: 'Publică',
    },
    {
      id: 'performance',
      title: 'Optimizează anunțul după feedback',
      description: 'Folosește performanța și recomandările ca să alegi o recompensă utilă.',
      coinsLabel: 'promovare',
      page: 'owner-dashboard',
      actionLabel: 'Vezi performanța',
    },
  ],
  AGENT: [
    {
      id: 'daily',
      title: 'Revendică recompensa zilnică',
      description: 'Ține workspace-ul actualizat înainte de follow-up-uri.',
      coinsLabel: coinLabel(COIN_EARN_RULES.daily_login.coins),
      page: 'monede',
      actionLabel: 'Vezi recompensa',
    },
    {
      id: 'portfolio',
      title: 'Adaugă proprietăți în portofoliu',
      description: 'Publicarea corectă face lead-urile și vizionările mai ușor de urmărit.',
      coinsLabel: coinLabel(COIN_EARN_RULES.add_property.coins),
      page: 'adauga-proprietate',
      actionLabel: 'Adaugă proprietate',
    },
    {
      id: 'crm',
      title: 'Mută lead-urile prin pipeline',
      description: 'CRM-ul rămâne locul principal pentru următorul pas comercial.',
      coinsLabel: 'CRM',
      page: 'crm',
      actionLabel: 'Deschide CRM',
    },
  ],
  ADMIN: [
    {
      id: 'daily',
      title: 'Revendică recompensa zilnică',
      description: 'Verifică soldul personal fără să amesteci operațiunile de admin.',
      coinsLabel: coinLabel(COIN_EARN_RULES.daily_login.coins),
      page: 'monede',
      actionLabel: 'Vezi recompensa',
    },
    {
      id: 'redemptions',
      title: 'Verifică cererile de recompense',
      description: 'Aprobarea sau respingerea se face centralizat, cu notă de soluționare.',
      coinsLabel: 'audit',
      page: 'admin',
      actionLabel: 'Deschide admin',
    },
    {
      id: 'documents',
      title: 'Ține documentele și tranzacțiile curate',
      description: 'Monedele au sens doar dacă acțiunile care le generează rămân verificabile.',
      coinsLabel: 'control',
      page: 'documente',
      actionLabel: 'Vezi dosare',
    },
  ],
}

const ROLE_DESCRIPTIONS: Record<AccountRole, Pick<RoleCoinGuidance, 'eyebrow' | 'title' | 'description' | 'trustNotes'>> = {
  CLIENT: {
    eyebrow: 'Portofel client',
    title: 'Transformă căutarea într-un avantaj concret',
    description: 'Pagina îți arată ce ai câștigat, ce recompense poți cere și care este următorul pas logic în procesul de cumpărare sau închiriere.',
    trustNotes: [
      'Monedele sunt personale și se acordă o singură dată pentru acțiuni eligibile.',
      'Recompensele care afectează o tranzacție sunt verificate de echipa HQS înainte de activare.',
    ],
  },
  OWNER: {
    eyebrow: 'Portofel proprietar',
    title: 'Folosește monedele ca să crești calitatea anunțului',
    description: 'Pentru proprietari, monedele sunt legate de publicare, promovare și acțiuni care fac proprietatea mai ușor de vândut sau închiriat.',
    trustNotes: [
      'Promovările și evidențierile trebuie să fie compatibile cu statusul proprietății.',
      'Cererile de recompense se păstrează în istoric ca să fie ușor de urmărit.',
    ],
  },
  AGENT: {
    eyebrow: 'Portofel agent',
    title: 'Leagă activitatea comercială de acțiuni verificabile',
    description: 'Agentul vede monedele ca semnal de implicare și poate trimite rapid utilizatorii spre pașii care chiar mută tranzacția înainte.',
    trustNotes: [
      'Monedele clientului nu se modifică manual din interfața agentului.',
      'Pentru excepții, agentul escaladează cererea către administrare.',
    ],
  },
  ADMIN: {
    eyebrow: 'Control administrativ',
    title: 'Păstrează programul de loialitate auditat și coerent',
    description: 'Adminul folosește pagina pentru verificări rapide, iar rezolvarea cererilor se face din panoul administrativ.',
    trustNotes: [
      'Aprobarea recompenselor trebuie să rămână separată de simpla solicitare.',
      'Istoricul tranzacțiilor și statusurile cererilor sunt baza auditului intern.',
    ],
  },
}

function sortedRewards(rewards: readonly CoinReward[]) {
  return [...rewards].sort((a, b) => a.cost - b.cost)
}

function getCheapestAffordableReward(balance: number, rewards: readonly CoinReward[]) {
  return sortedRewards(rewards).find((reward) => reward.cost <= balance)
}

function getNextReward(balance: number, rewards: readonly CoinReward[]) {
  return sortedRewards(rewards).find((reward) => reward.cost > balance)
}

function buildDynamicActions(role: AccountRole, input: CoinGuidanceInput): CoinGuidanceAction[] {
  const actions: CoinGuidanceAction[] = []

  if (input.hasError) {
    actions.push({
      id: 'sync-wallet',
      title: 'Sincronizează portofelul',
      description: 'Încearcă din nou înainte să soliciți o recompensă, ca soldul să fie corect.',
      page: 'monede',
      actionLabel: 'Reîncearcă',
      tone: 'rose',
    })
  }

  if (!input.claimedToday) {
    actions.push({
      id: 'claim-daily',
      title: 'Începe cu recompensa zilnică',
      description: `Ai ${coinLabel(COIN_EARN_RULES.daily_login.coins)} disponibile astăzi și bonus la fiecare 3 zile consecutive.`,
      page: 'monede',
      actionLabel: 'Revendică',
      tone: 'amber',
    })
  }

  if (input.pendingRedemptions > 0) {
    actions.push({
      id: 'pending-redemptions',
      title: `${input.pendingRedemptions} cerere${input.pendingRedemptions === 1 ? '' : 'i'} în verificare`,
      description: 'Urmărește statusul cererilor înainte să rezervi alte monede.',
      page: role === 'ADMIN' ? 'admin' : 'monede',
      actionLabel: role === 'ADMIN' ? 'Vezi admin' : 'Vezi cererile',
      tone: 'violet',
    })
  }

  const affordableReward = getCheapestAffordableReward(input.balance, input.rewards)
  if (affordableReward) {
    actions.push({
      id: 'redeem-now',
      title: `Poți solicita: ${affordableReward.title}`,
      description: `${affordableReward.cost} monede vor fi rezervate până când echipa verifică eligibilitatea.`,
      page: 'monede',
      actionLabel: 'Vezi recompense',
      tone: 'emerald',
    })
  } else {
    const nextReward = getNextReward(input.balance, input.rewards)
    if (nextReward) {
      actions.push({
        id: 'next-reward',
        title: `Următoarea țintă: ${nextReward.title}`,
        description: `Mai ai nevoie de ${nextReward.cost - input.balance} monede pentru această recompensă.`,
        page: 'monede',
        actionLabel: 'Vezi progresul',
        tone: 'sky',
      })
    }
  }

  if (role === 'CLIENT') {
    actions.push({
      id: 'client-discover',
      title: input.transactionsCount > 0 ? 'Continuă cu o vizionare' : 'Pornește din lista de proprietăți',
      description: input.transactionsCount > 0
        ? 'Ai deja activitate în portofel; următorul salt valoros este o vizionare programată.'
        : 'Caută, salvează favorite și pregătește prima programare.',
      page: input.transactionsCount > 0 ? 'programare-vizionare' : 'proprietati',
      actionLabel: input.transactionsCount > 0 ? 'Programează' : 'Descoperă',
      tone: 'sky',
    })
  }

  if (role === 'OWNER') {
    actions.push({
      id: 'owner-publish',
      title: input.transactionsCount > 0 ? 'Optimizează proprietățile active' : 'Publică prima proprietate completă',
      description: input.transactionsCount > 0
        ? 'Verifică performanța și alege promovarea potrivită pentru anunțurile care au tracțiune.'
        : 'Completează anunțul cu hartă, fotografii și tur virtual ca să poți folosi recompensele eficient.',
      page: input.transactionsCount > 0 ? 'owner-dashboard' : 'adauga-proprietate',
      actionLabel: input.transactionsCount > 0 ? 'Vezi performanța' : 'Publică',
      tone: 'violet',
    })
  }

  if (role === 'AGENT') {
    actions.push({
      id: 'agent-crm',
      title: 'Leagă monedele de follow-up-uri',
      description: 'Deschide CRM-ul și prioritizează clienții cu interes real, vizionări sau documente în lucru.',
      page: 'crm',
      actionLabel: 'Deschide CRM',
      tone: 'sky',
    })
  }

  if (role === 'ADMIN') {
    actions.push({
      id: 'admin-control',
      title: 'Verifică cererile HQS Coins',
      description: 'Onorează, respinge sau notează cererile direct din cockpit-ul administrativ.',
      page: 'admin',
      actionLabel: 'Deschide admin',
      tone: 'rose',
    })
  }

  return actions.slice(0, 3)
}

export function getCoinGuidance(role: AccountRole, input: CoinGuidanceInput): RoleCoinGuidance {
  return {
    role,
    ...ROLE_DESCRIPTIONS[role],
    highlights: ROLE_HIGHLIGHTS[role],
    earningPath: ROLE_EARNING_PATHS[role],
    nextActions: buildDynamicActions(role, input),
  }
}
