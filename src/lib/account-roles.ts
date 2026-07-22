export const ACCOUNT_ROLES = ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'] as const

export type AccountRole = (typeof ACCOUNT_ROLES)[number]

export interface AccountRoleDefinition {
  label: string
  title: string
  description: string
  features: string[]
}

export const ACCOUNT_ROLE_DEFINITIONS: Record<AccountRole, AccountRoleDefinition> = {
  CLIENT: {
    label: 'Client',
    title: 'Profil Client',
    description: 'Caută locuința potrivită, salvează oferte și programează vizionări.',
    features: ['Favorite și căutări salvate', 'Vizionări și documente personale', 'Alerte de preț și calculator ipotecar'],
  },
  OWNER: {
    label: 'Proprietar',
    title: 'Profil Proprietar',
    description: 'Publică și administrează proprietățile pe care le deții.',
    features: ['Publicare și editare anunțuri proprii', 'Solicitări și vizionări pentru proprietăți', 'Evaluare și rapoarte de performanță'],
  },
  AGENT: {
    label: 'Agent',
    title: 'Profil Agent',
    description: 'Gestionează portofoliul alocat, clienții și agenda de vizionări.',
    features: ['Proprietăți și lead-uri alocate', 'Agenda și disponibilitate', 'Documente și urmărirea vizionărilor'],
  },
  ADMIN: {
    label: 'Administrator',
    title: 'Profil Administrator',
    description: 'Controlează utilizatorii, conținutul și operațiunile platformei.',
    features: ['Panou administrativ complet', 'Moderare proprietăți și utilizatori', 'Rapoarte, configurări și audit'],
  },
}

const RESTRICTED_PAGE_ROLES: Partial<Record<string, readonly AccountRole[]>> = {
  admin: ['ADMIN'],
  'adauga-proprietate': ['OWNER', 'AGENT', 'ADMIN'],
  'disponibilitate-staff': ['AGENT', 'ADMIN'],
  'programare-vizionare': ['CLIENT', 'OWNER'],
  'vizionarile-mele': ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'],
  documente: ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'],
  'deal-room': ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'],
  crm: ['AGENT', 'ADMIN'],
  'owner-dashboard': ['OWNER'],
  dashboard: ACCOUNT_ROLES,
  profil: ACCOUNT_ROLES,
}

export function normalizeAccountRole(value: unknown): AccountRole {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (normalized === 'PROPRIETAR') return 'OWNER'
  return ACCOUNT_ROLES.includes(normalized as AccountRole)
    ? (normalized as AccountRole)
    : 'CLIENT'
}

export function canAccessAccountPage(role: AccountRole, page: string): boolean {
  const allowedRoles = RESTRICTED_PAGE_ROLES[page]
  return !allowedRoles || allowedRoles.includes(role)
}

export function getAllowedRolesForPage(page: string): readonly AccountRole[] {
  return RESTRICTED_PAGE_ROLES[page] ?? ACCOUNT_ROLES
}
