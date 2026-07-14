import type { StaffMember, Vizionare, DocTypeLabelMap, CoinReward } from './types'

// ─── Document type labels ──────────────────────────────────────────────────

export const DOC_TYPE_LABELS: DocTypeLabelMap = {
  id_card: 'Carte de Identitate',
  proof_of_income: 'Adeverinta de Venit',
  vizionare_sign: 'Semnatura Vizionare',
  rental_contract: 'Contract de Inchiriere',
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
}

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