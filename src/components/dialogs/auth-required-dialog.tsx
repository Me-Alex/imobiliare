'use client'

import { useEffect } from 'react'
import { LogIn, ShieldCheck, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { saveAuthReturnTarget, type AuthReturnContext } from '@/lib/auth-return'
import { useAppStore, type PageKey } from '@/store/use-app-store'

interface AuthRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What the user was trying to do */
  actionLabel: string
  /** Action icon component */
  actionIcon?: React.ComponentType<{ className?: string }>
  /** Optional description override */
  description?: string
  /** Page to navigate to after login succeeds (instead of default) */
  returnPage?: PageKey
  /** Extra data to store for after login (e.g. property ID) */
  returnContext?: AuthReturnContext
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  actionLabel,
  actionIcon: ActionIcon = CalendarCheck,
  description,
  returnPage,
  returnContext,
}: AuthRequiredDialogProps) {
  const { user, loading } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  const handleLogin = () => {
    saveAuthReturnTarget(returnPage ?? 'dashboard', returnContext)
    onOpenChange(false)
    navigateTo('login')
  }

  useEffect(() => {
    if (!loading && user && open) onOpenChange(false)
  }, [loading, onOpenChange, open, user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl">Autentificare necesară</DialogTitle>
          <DialogDescription className="text-sm mt-2">
            {description || `Pentru a ${actionLabel.toLowerCase()}, trebuie să fii autentificat în contul tău.`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* What they'll get */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ActionIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{actionLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Creează un cont gratuit sau autentifică-te pentru a accesa această funcționalitate.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Vizionări programate', desc: 'Rezervă online' },
              { label: 'Favorite Salvate', desc: 'Acces de oriunde' },
              { label: 'Alerte de preț', desc: 'Notificări în timp real' },
              { label: 'Istoric complet', desc: 'Toate acțiunile' },
            ].map((benefit) => (
              <div key={benefit.label} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{benefit.label}</p>
                  <p className="text-[10px] text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Login button */}
          <Button className="w-full gap-2 h-11" onClick={handleLogin}>
            <LogIn className="h-4 w-4" />
            Autentifică-te sau creează un cont
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
