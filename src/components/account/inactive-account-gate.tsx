'use client'

import { useState, type ReactNode } from 'react'
import { Home, Loader2, LogOut, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'
import { PageContainer, PageShell } from '@/components/layout'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'

interface InactiveAccountGateProps {
  children: ReactNode
  enabled?: boolean
}

export function InactiveAccountGate({ children, enabled = true }: InactiveAccountGateProps) {
  const { user, profile, loading, profileError, refreshProfile, signOut } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [signingOut, setSigningOut] = useState(false)

  if (!enabled) return children
  if (loading) return <PageState tone="loading" title="Verificăm contul" description="Încărcăm profilul și permisiunile tale." />
  if (!user) return children

  const handleSignOut = async () => {
    setSigningOut(true)
    const result = await signOut()
    if (result.error) toast.error(result.error)
    else navigateTo('acasa')
    setSigningOut(false)
  }

  if (profileError || !profile) {
    return <PageContainer width="narrow" className="py-10">
      <PageState tone="error" title="Nu putem verifica profilul" description={profileError || 'Încearcă din nou.'}
        action={<>
          <Button onClick={() => void refreshProfile()}>Încearcă din nou</Button>
          <Button variant="outline" disabled={signingOut} onClick={() => void handleSignOut()}>Ieși din cont</Button>
        </>} />
    </PageContainer>
  }
  if (profile.isActive) return children

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
