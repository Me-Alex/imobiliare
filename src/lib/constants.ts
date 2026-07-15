import type { StaffMember, Vizionare, DocTypeLabelMap, CoinReward } from './types'

// ─── Document type labels ──────────────────────────────────────────────────

export const DOC_TYPE_LABELS: DocTypeLabelMap = {
  id_card: 'Carte de Identitate',
  proof_of_income: 'Adeverinta de Venit',
  vizionare_sign: 'Fisa de Vizionare',
  brokerage_contract: 'Contract de Intermediere',
  owner_mandate: 'Mandat Proprietar',
  reservation_offer: 'Oferta / Rezervare',
  rental_contract: 'Contract de Inchiriere',
  handover_protocol: 'Predare-Primire',
  addendum: 'Act Aditional',
  termination_notice: 'Incetare Contract',
  other: 'Alt Document',
}

// ─── Property form constants ───────────────────────────────────────────────

export const PROPERTY_TYPES = [
  'Apartament', 'Garsoniera', 'Casa', 'Vila', 'Teren', 'Spatiu Comercial',
  'Birou', 'Depozit', 'Pensiune', 'Apartament Nou', 'Studio',
] as const

export const TRANSACTIONS = [
  { value: 'VANZARE', label: 'Vanzare' },
  { value: 'INCHIRIERE', label: 'Inchiriere' },
] as const

export const CURRENCIES = ['EUR', 'RON', 'USD'] as const

export const SECTOARE = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6',
] as const

export const ZONES = [
  'Dorobanti', 'Victoriei', 'Floreasca', 'Aviatorilor', 'Primaverii',
  'Herastrau', 'Baneasa', 'Pipera', 'Barbu Vacarescu', 'Romană',
  'Universitate', 'Unirii', 'Centru Civic', 'Parlament',
  'Vitan', 'Titan', 'Pantelimon', 'Colentina', 'Obor',
  'Militari', 'Drumul Taberei', 'Ghencea', 'Rahova', 'Crangasi',
  'Grozavesti', 'Politehnica', 'Iancului', 'Mihai Bravu',
] as const

// ─── Date / Time constants ─────────────────────────────────────────────────

export const MONTH_NAMES_SHORT = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export const MONTH_NAMES_FULL = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
] as const

export const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'] as const

export const DAY_NAMES_FULL = [
  'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata', 'Duminica',
] as const

// ─── Vizionare status config ───────────────────────────────────────────────

export const VIZIONARE_STATUS_CONFIG: Record<
  Vizionare['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  pending: {
    label: 'In asteptare',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  },
  confirmed: {
    label: 'Confirmata',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
  },
  checked_in: {
    label: 'Client prezent',
    variant: 'default',
    className: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700',
  },
  completed: {
    label: 'Finalizata',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  },
  cancelled: {
    label: 'Anulata',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  },
  cancelled_by_client: {
    label: 'Anulată de client',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  },
  cancelled_by_agent: {
    label: 'Anulată de agenție',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  },
  no_show: {
    label: 'Neprezentat',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
  },
}

export const VIEWING_BOOKING_TERMS_VERSION = 'RO-VIEWING-BOOKING-1.0'

export const VIEWING_BOOKING_TERMS = {
  actual_viewing_required: true,
  no_automatic_penalty: true,
  cancellation_rule: 'Clientul anunță anularea cât mai curând; reprogramarea se face printr-o programare nouă.',
  no_show_rule: 'Neprezentarea este consemnată de agent numai după sfârșitul intervalului și 15 minute de grație.',
  viewing_report_rule: 'Fișa de vizionare se generează numai după confirmarea prezenței și finalizarea vizionării efective.',
  grace_minutes: 15,
} as const

// ─── localStorage keys ────────────────────────────────────────────────────

export const LS_KEYS = {
  USER_PROPERTIES: 'hqs_user_properties',
  VIZIONARI: 'hqs_vizionari',
  DOCUMENTS: 'hqs_documents',
  STAFF_AVAILABILITY: 'hqs_staff_availability',
  NOTIFICATIONS: 'hqs_notifications',
  SELECTED_VIZIONARE: 'hqs_selected_vizionare_id',
  FAVORITES: 'pm-favorites',
  RECENTLY_VIEWED: 'pm-recently-viewed',
  PRICE_ALERTS: 'pm-price-alerts',
  COOKIES_ACCEPTED: 'pm-cookies-accepted',
  ANNOUNCEMENT_DISMISSED: 'pm-announcement-dismissed',
  SAVED_SEARCHES: 'pm-saved-searches',
  USER_PROFILE: 'pm-user-profile',
  VALUATION_HISTORY: 'pm-valuation-history',
  COINS_BALANCE: 'pm-coins-balance',
  COINS_TRANSACTIONS: 'pm-coins-transactions',
  COINS_STREAK: 'pm-coins-streak',
  COINS_REDEEMED: 'pm-coins-redeemed',
  COINS_ACHIEVEMENTS: 'pm-coins-achievements',
  COINS_CHALLENGES: 'pm-coins-challenges',
} as const

// ─── Default staff members (hardcoded for MVP) ─────────────────────────────

export const DEFAULT_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Maria Ionescu', email: 'maria@hqs.ro', phone: '+40 721 123 456', role: 'Agent Imobiliar', avatarInitials: 'MI', isActive: true },
  { id: 'staff-2', name: 'Alexandru Popa', email: 'alex@hqs.ro', phone: '+40 722 234 567', role: 'Agent Imobiliar', avatarInitials: 'AP', isActive: true },
  { id: 'staff-3', name: 'Elena Dumitrescu', email: 'elena@hqs.ro', phone: '+40 723 345 678', role: 'Consilier Imobiliar', avatarInitials: 'ED', isActive: true },
  { id: 'staff-4', name: 'Cristian Marinescu', email: 'cristian@hqs.ro', phone: '+40 724 456 789', role: 'Director Vanzari', avatarInitials: 'CM', isActive: true },
]

// ─── Coin rewards shop ──────────────────────────────────────────────────

export const COIN_REWARDS: CoinReward[] = [
  {
    id: 'reward-featured-7',
    title: 'Anunt Promovat',
    description: 'Proprietatea ta apare in sectiunea "Recomandate" timp de 7 zile.',
    cost: 500,
    icon: 'Star',
    category: 'listing',
    duration: '7 zile',
  },
  {
    id: 'reward-highlight-30',
    title: 'Evidentiere Proprietate',
    description: 'Proprietatea ta primeste un badge "Evidentiat" si apare mai sus in rezultate.',
    cost: 150,
    icon: 'Sparkles',
    category: 'listing',
    duration: '30 zile',
  },
  {
    id: 'reward-priority',
    title: 'Suport Prioritar',
    description: 'Mesajele tale catre agenti sunt tratate cu prioritate timp de 30 zile.',
    cost: 200,
    icon: 'Headphones',
    category: 'service',
    duration: '30 zile',
  },
  {
    id: 'reward-valuation',
    title: 'Raport Evaluare Premium',
    description: 'Obtine un raport detaliat de evaluare cu analiza de piata si comparatii.',
    cost: 100,
    icon: 'FileBarChart2',
    category: 'service',
  },
  {
    id: 'reward-voucher-5',
    title: 'Voucher 5% Reducere',
    description: 'Reduceri de 5% la comisionul agentiei pentru urmatoarea tranzactie.',
    cost: 300,
    icon: 'Ticket',
    category: 'discount',
    value: '5% reducere',
  },
  {
    id: 'reward-voucher-10',
    title: 'Voucher 10% Reducere',
    description: 'Reduceri de 10% la comisionul agentiei pentru urmatoarea tranzactie.',
    cost: 500,
    icon: 'TicketPercent',
    category: 'discount',
    value: '10% reducere',
  },
]

// ─── Coin earn actions ──────────────────────────────────────────────────

export const COIN_EARN_RULES = {
  daily_login: { coins: 5, label: 'Login zilnic', description: '+5 monede pentru accesarea zilnica' },
  daily_streak_bonus: { coins: 10, label: 'Bonus streak', description: '+10 monede bonus pentru conexiune consecutiva' },
  view_property: { coins: 1, label: 'Vizualizare proprietate', description: '+1 moneda pentru fiecare proprietate vizualizata' },
  favorite: { coins: 3, label: 'Adaugare la favorite', description: '+3 monede pentru fiecare favorit nou' },
  contact_form: { coins: 10, label: 'Formular de contact', description: '+10 monede pentru trimiterea unui mesaj' },
  book_viewing: { coins: 15, label: 'Programare vizionare', description: '+15 monede pentru o vizionare programata' },
  complete_viewing: { coins: 25, label: 'Vizionare finalizata', description: '+25 monede pentru o vizionare completata' },
  newsletter: { coins: 20, label: 'Abonare newsletter', description: '+20 monede pentru abonarea la newsletter' },
  add_property: { coins: 10, label: 'Adaugare proprietate', description: '+10 monede pentru fiecare proprietate adaugata' },
  save_search: { coins: 5, label: 'Salvare cautare', description: '+5 monede pentru o cautare salvata' },
  price_alert: { coins: 5, label: 'Alerta de pret', description: '+5 monede pentru setarea unei alerte' },
} as const

// ─── Coin Achievements ──────────────────────────────────────────────────

import type { CoinAchievement } from './types'

export const COIN_ACHIEVEMENTS: CoinAchievement[] = [
  {
    id: 'ach-first-steps',
    title: 'Primii Pasi',
    description: 'Castiga 50 de monede in total',
    icon: 'Footprints',
    tier: 'bronze',
    target: 50,
    metric: 'total_earned',
    reward: 25,
  },
  {
    id: 'ach-collector',
    title: 'Colectionar',
    description: 'Castiga 200 de monede in total',
    icon: 'Gem',
    tier: 'silver',
    target: 200,
    metric: 'total_earned',
    reward: 50,
  },
  {
    id: 'ach-mogul',
    title: 'Magnat Imobiliar',
    description: 'Castiga 500 de monede in total',
    icon: 'Crown',
    tier: 'gold',
    target: 500,
    metric: 'total_earned',
    reward: 100,
  },
  {
    id: 'ach-legend',
    title: 'Legenda HQS',
    description: 'Castiga 1000 de monede in total',
    icon: 'Trophy',
    tier: 'platinum',
    target: 1000,
    metric: 'total_earned',
    reward: 250,
  },
  {
    id: 'ach-week-warrior',
    title: 'Razboinicul Saptamanii',
    description: 'Mentine un streak de 7 zile',
    icon: 'Flame',
    tier: 'bronze',
    target: 7,
    metric: 'streak_days',
    reward: 30,
  },
  {
    id: 'ach-month-master',
    title: 'Maestru al Constientei',
    description: 'Mentine un streak de 30 de zile',
    icon: 'Award',
    tier: 'gold',
    target: 30,
    metric: 'streak_days',
    reward: 100,
  },
  {
    id: 'ach-curious',
    title: 'Curios',
    description: 'Vizualizeaza 20 de proprietati',
    icon: 'Eye',
    tier: 'bronze',
    target: 20,
    metric: 'properties_viewed',
    reward: 20,
  },
  {
    id: 'ach-explorer',
    title: 'Explorator',
    description: 'Vizualizeaza 50 de proprietati',
    icon: 'Compass',
    tier: 'silver',
    target: 50,
    metric: 'properties_viewed',
    reward: 50,
  },
  {
    id: 'ach-fan',
    title: 'Fan',
    description: 'Adauga 5 proprietati la favorite',
    icon: 'Heart',
    tier: 'bronze',
    target: 5,
    metric: 'favorites',
    reward: 15,
  },
  {
    id: 'ach-superfan',
    title: 'Super Fan',
    description: 'Adauga 15 proprietati la favorite',
    icon: 'Star',
    tier: 'silver',
    target: 15,
    metric: 'favorites',
    reward: 40,
  },
  {
    id: 'ach-visitor',
    title: 'Vizitator Frecvent',
    description: 'Programeaza 3 vizionari',
    icon: 'CalendarCheck',
    tier: 'bronze',
    target: 3,
    metric: 'viewings_booked',
    reward: 20,
  },
  {
    id: 'ach-organized',
    title: 'Organizat',
    description: 'Salveaza 5 cautari',
    icon: 'Search',
    tier: 'bronze',
    target: 5,
    metric: 'searches_saved',
    reward: 15,
  },
]

// ─── Tier styles ────────────────────────────────────────────────────────

export const ACHIEVEMENT_TIER_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string; glow: string; label: string }> = {
  bronze: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    text: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    glow: 'shadow-amber-400/20',
    label: 'Bronz',
  },
  silver: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-700/40',
    text: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800/40',
    glow: 'shadow-slate-400/20',
    label: 'Argint',
  },
  gold: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800/40',
    text: 'text-yellow-700 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    glow: 'shadow-yellow-400/20',
    label: 'Aur',
  },
  platinum: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    glow: 'shadow-emerald-400/20',
    label: 'Platinum',
  },
}

// ─── Mock Leaderboard ───────────────────────────────────────────────────

import type { LeaderboardEntry } from './types'

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Andrei M.', initials: 'AM', balance: 1245, streak: 18 },
  { rank: 2, name: 'Maria I.', initials: 'MI', balance: 980, streak: 12 },
  { rank: 3, name: 'Cristian D.', initials: 'CD', balance: 856, streak: 9 },
  { rank: 4, name: 'Elena P.', initials: 'EP', balance: 720, streak: 7 },
  { rank: 5, name: 'Alexandru B.', initials: 'AB', balance: 645, streak: 5 },
  { rank: 6, name: 'Ioana R.', initials: 'IR', balance: 510, streak: 4 },
  { rank: 7, name: 'Vlad T.', initials: 'VT', balance: 435, streak: 3 },
  { rank: 8, name: 'Diana S.', initials: 'DS', balance: 320, streak: 2 },
  { rank: 9, name: 'Mihai L.', initials: 'ML', balance: 280, streak: 1 },
  { rank: 10, name: 'Ana C.', initials: 'AC', balance: 195, streak: 1 },
]
