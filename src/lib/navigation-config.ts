import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarPlus,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Plus,
  Shield,
  User,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import type { AccountRole } from '@/lib/account-roles'
import type { PageKey } from '@/store/slices/navigation'

export interface NavigationItem {
  label: string
  page: PageKey
}
export interface AccountNavigationItem extends NavigationItem {
  description: string
  icon: LucideIcon
}

export const PUBLIC_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Acasă', page: 'acasa' },
  { label: 'Proprietăți', page: 'proprietati' },
  { label: 'Analiză', page: 'analiza' },
  { label: 'Zone', page: 'zone' },
  { label: 'Servicii', page: 'servicii' },
  { label: 'Despre noi', page: 'de-ce-noi' },
]

const ACCOUNT_ITEMS: Record<string, AccountNavigationItem> = {
  dashboard: { label: 'Prezentare', page: 'dashboard', icon: LayoutDashboard, description: 'Rezumatul și prioritățile contului' },
  admin: { label: 'Administrare', page: 'admin', icon: Shield, description: 'Controlul operațiunilor platformei' },
  crm: { label: 'CRM', page: 'crm', icon: BriefcaseBusiness, description: 'Lead-uri, follow-up-uri și conversie' },
  'owner-dashboard': { label: 'Performanță', page: 'owner-dashboard', icon: BarChart3, description: 'Interes, feedback și recomandări' },
  'adauga-proprietate': { label: 'Proprietățile mele', page: 'adauga-proprietate', icon: Plus, description: 'Publicare și administrare anunțuri' },
  'programare-vizionare': { label: 'Programează', page: 'programare-vizionare', icon: CalendarPlus, description: 'Alege proprietatea și intervalul' },
  'vizionarile-mele': { label: 'Vizionări', page: 'vizionarile-mele', icon: CalendarCheck, description: 'Programări, prezență și feedback' },
  'disponibilitate-staff': { label: 'Disponibilitate', page: 'disponibilitate-staff', icon: Users, description: 'Agenda echipei și intervalele libere' },
  'deal-room': { label: 'Tranzacții', page: 'deal-room', icon: WalletCards, description: 'Deal Room, oferte și pașii următori' },
  documente: { label: 'Dosar digital', page: 'documente', icon: FileText, description: 'Documente, versiuni și semnături' },
  monede: { label: 'Monede', page: 'monede', icon: CircleDollarSign, description: 'Sold, activitate și recompense' },
  profil: { label: 'Profil', page: 'profil', icon: User, description: 'Datele și preferințele contului' },
}

const ACCOUNT_MENU_ORDER: Record<AccountRole, readonly string[]> = {
  CLIENT: ['dashboard', 'programare-vizionare', 'vizionarile-mele', 'deal-room', 'documente', 'monede', 'profil'],
  OWNER: ['dashboard', 'adauga-proprietate', 'owner-dashboard', 'vizionarile-mele', 'deal-room', 'documente', 'monede', 'profil'],
  AGENT: ['dashboard', 'crm', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede', 'profil'],
  ADMIN: ['admin', 'dashboard', 'crm', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede', 'profil'],
}

const WORKSPACE_NAV_ORDER: Record<AccountRole, readonly string[]> = {
  CLIENT: ['dashboard', 'vizionarile-mele', 'deal-room', 'documente', 'monede'],
  OWNER: ['dashboard', 'adauga-proprietate', 'owner-dashboard', 'vizionarile-mele', 'deal-room', 'documente'],
  AGENT: ['dashboard', 'crm', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff'],
  ADMIN: ['admin', 'crm', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff'],
}

const ACCOUNT_WORKSPACE_PAGES = new Set<PageKey>([
  'admin',
  'adauga-proprietate',
  'dashboard',
  'programare-vizionare',
  'disponibilitate-staff',
  'vizionarile-mele',
  'documente',
  'profil',
  'monede',
  'deal-room',
  'crm',
  'owner-dashboard',
])

function resolveItems(order: readonly string[]): AccountNavigationItem[] {
  return order.map((key) => ACCOUNT_ITEMS[key]).filter(Boolean)
}

export function getAccountMenuItems(role: AccountRole): AccountNavigationItem[] {
  return resolveItems(ACCOUNT_MENU_ORDER[role])
}

export function getWorkspaceNavigation(role: AccountRole): AccountNavigationItem[] {
  return resolveItems(WORKSPACE_NAV_ORDER[role])
}

export function isAccountWorkspacePage(page: PageKey): boolean {
  return ACCOUNT_WORKSPACE_PAGES.has(page)
}
