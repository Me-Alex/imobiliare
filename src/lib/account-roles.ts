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
    description: 'Cauta locuinta potrivita, salveaza oferte si programeaza vizionari.',
    features: ['Favorite si cautari salvate', 'Vizionari si documente personale', 'Alerte de pret si calculator ipotecar'],
  },
  OWNER: {
    label: 'Proprietar',
    title: 'Profil Proprietar',
    description: 'Publica si administreaza proprietatile pe care le detii.',
    features: ['Publicare si editare anunturi proprii', 'Solicitari si vizionari pentru proprietati', 'Evaluare si rapoarte de performanta'],
  },
  AGENT: {
    label: 'Agent',
    title: 'Profil Agent',
    description: 'Gestioneaza portofoliul alocat, clientii si agenda de vizionari.',
    features: ['Proprietati si lead-uri alocate', 'Agenda si disponibilitate', 'Documente si urmarirea vizionarilor'],
  },
  ADMIN: {
    label: 'Administrator',
    title: 'Profil Administrator',
    description: 'Controleaza utilizatorii, continutul si operatiunile platformei.',
    features: ['Panou administrativ complet', 'Moderare proprietati si utilizatori', 'Rapoarte, configurari si audit'],
  },
}

const RESTRICTED_PAGE_ROLES: Partial<Record<string, readonly AccountRole[]>> = {
  admin: ['ADMIN'],
  'adauga-proprietate': ['OWNER', 'AGENT', 'ADMIN'],
  'disponibilitate-staff': ['AGENT', 'ADMIN'],
  'programare-vizionare': ['CLIENT', 'OWNER'],
  'vizionarile-mele': ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'],
  documente: ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'],
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
