'use client'

import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import {
  ACCOUNT_ROLE_DEFINITIONS,
  type AccountRole,
} from '@/lib/account-roles'

interface RoleAccessDeniedProps {
  currentRole: AccountRole
  allowedRoles: readonly AccountRole[]
}

export function RoleAccessDenied({ currentRole, allowedRoles }: RoleAccessDeniedProps) {
  const navigateTo = useAppStore((state) => state.navigateTo)

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-lg rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Acces limitat pentru acest cont</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esti autentificat ca {ACCOUNT_ROLE_DEFINITIONS[currentRole].label}. Aceasta zona este disponibila pentru:
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {allowedRoles.map((role) => (
            <Badge key={role} variant="secondary">
              {ACCOUNT_ROLE_DEFINITIONS[role].label}
            </Badge>
          ))}
        </div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => navigateTo('dashboard')}>Dashboard-ul meu</Button>
          <Button variant="outline" onClick={() => navigateTo('profil')}>Vezi profilul</Button>
        </div>
      </div>
    </div>
  )
}
