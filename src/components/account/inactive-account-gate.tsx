'use client'

import { useState, type ReactNode } from 'react'
import { Home, Loader2, LogOut, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'
import { PageContainer, PageShell } from '@/components/layout'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'

interface InactiveAccountGateProps {
  children: ReactNode
  enabled?: boolean
}

export function InactiveAccountGate({ children, enabled = true }: InactiveAccountGateProps) {
  const { user, profile, loading, signOut } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [signingOut, setSigningOut] = useState(false)

  if (!enabled || loading || !user || !profile || profile.isActive) return children

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigateTo('acasa')
    setSigningOut(false)
  }

  return (
    <PageShell>
      <PageContainer width="narrow" className="py-10">
        <PageState
          tone="error"
          icon={ShieldX}
          title="Cont dezactivat temporar"
          description="Accesul la spațiul privat a fost suspendat de administrator. Datele contului nu au fost șterse; contactează agenția pentru verificare sau reactivare."
          action={(
            <>
              <Button variant="outline" onClick={() => navigateTo('proprietati')}>
                <Home className="mr-2 h-4 w-4" />
                Vezi proprietățile
              </Button>
              <Button onClick={() => void handleSignOut()} disabled={signingOut}>
                {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                Ieși din cont
              </Button>
            </>
          )}
        />
      </PageContainer>
    </PageShell>
  )
}
