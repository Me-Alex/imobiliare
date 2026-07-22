'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Trash2, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useZones } from '@/hooks/use-properties'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'

const propertyTypes = [
  { label: 'Apartament', value: 'APARTMENT' },
  { label: 'Casa', value: 'HOUSE' },
  { label: 'Vila', value: 'VILLA' },
  { label: 'Teren', value: 'LAND' },
  { label: 'Comercial', value: 'COMMERCIAL' },
]

const roomOptions = [
  { label: '1+ camere', value: 1 },
  { label: '2+ camere', value: 2 },
  { label: '3+ camere', value: 3 },
  { label: '4+ camere', value: 4 },
]

interface PriceAlert {
  id: string
  email: string
  zone: string | null
  propertyType: string | null
  minPrice: number | null
  maxPrice: number | null
  minRooms: number | null
  active: boolean
  createdAt: string
}

interface PriceAlertsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PriceAlertsPanel({ open, onOpenChange }: PriceAlertsPanelProps) {
  const { user, session, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const { data: zones } = useZones()
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [zone, setZone] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRooms, setMinRooms] = useState('')

  const fetchAlerts = useCallback(async () => {
    const accessToken = session?.access_token
    if (!accessToken) {
      setAlerts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/price-alerts', {
        headers: { Authorization: 'Bearer ' + accessToken },
      })
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      } else if (res.status === 401 || res.status === 403) {
        setAlerts([])
      }
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => void fetchAlerts())
      return () => cancelAnimationFrame(frame)
    }
  }, [open, fetchAlerts])

  const resetForm = () => {
    setZone('')
    setPropertyType('')
    setMinPrice('')
    setMaxPrice('')
    setMinRooms('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const accessToken = session?.access_token
    if (!accessToken) {
      toast.error('Autentifica-te pentru a administra alertele de pret.')
      navigateTo('login')
      return
    }

    const minP = minPrice ? parseFloat(minPrice) : null
    const maxP = maxPrice ? parseFloat(maxPrice) : null
    if (minP != null && maxP != null && maxP <= minP) {
      toast.error('Pretul maxim trebuie sa fie mai mare decat pretul minim.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        body: JSON.stringify({
          zone: zone && zone !== 'all' ? zone : undefined,
          propertyType: propertyType && propertyType !== 'all' ? propertyType : undefined,
          minPrice: minP,
          maxPrice: maxP,
          minRooms: minRooms && minRooms !== 'any' ? parseInt(minRooms) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Eroare la crearea alertei.')
        return
      }

      toast.success('Alerta de pret a fost creata cu succes!')
      resetForm()
      fetchAlerts()
    } catch {
      toast.error('A aparut o eroare. Te rugam incearca din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    const accessToken = session?.access_token
    if (!accessToken) {
      toast.error('Autentifica-te pentru a administra alertele de pret.')
      navigateTo('login')
      return
    }

    try {
      const res = await fetch('/api/price-alerts/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + accessToken },
      })
      if (res.ok) {
        toast.success('Alerta a fost dezactivata.')
        setAlerts((prev) => prev.filter((a) => a.id !== id))
      } else {
        toast.error('Eroare la dezactivarea alertei.')
      }
    } catch {
      toast.error('A aparut o eroare. Te rugam incearca din nou.')
    }
  }

  const activeAlerts = alerts.filter((a) => a.active)
  const formatPrice = (val: number) => `${val.toLocaleString('ro-RO')} €`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-primary" />
            Alerte de Pret
          </SheetTitle>
          <SheetDescription>
            {activeAlerts.length === 0
              ? 'Nu ai nicio alerta activa.'
              : `${activeAlerts.length} ${activeAlerts.length === 1 ? 'alerta' : 'alerte'} active`}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-2" />

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Create Alert Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Creeaza o alerta noua
              </h3>

              <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {authLoading
                  ? 'Verificam contul...'
                  : user?.email
                    ? 'Alerta va fi asociata contului ' + user.email + '.'
                    : 'Autentifica-te pentru a crea si administra alertele tale.'}
              </div>

              {/* Zone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Zona (optional)</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Toate zonele" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Toate zonele</SelectItem>
                    {zones?.map((z) => (
                      <SelectItem key={z.id} value={z.name}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tip proprietate (optional)</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Orice tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Orice tip</SelectItem>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price range */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Pret (EUR, optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9"
                    min="0"
                  />
                </div>
              </div>

              {/* Min Rooms */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Numar camere minim (optional)</Label>
                <Select value={minRooms} onValueChange={setMinRooms}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Orice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Orice</SelectItem>
                    {roomOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting || authLoading}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {submitting ? 'Se creeaza...' : 'Creeaza alerta'}
              </Button>
            </form>

            <Separator />

            {/* Existing Alerts List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Alerte existente</h3>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nu ai nicio alerta activa. Creeaza una mai sus pentru a fi notificat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onDeactivate={() => handleDeactivate(alert.id)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function AlertItem({
  alert,
  onDeactivate,
  formatPrice,
}: {
  alert: PriceAlert
  onDeactivate: () => void
  formatPrice: (v: number) => string
}) {
  const propertyTypeLabel =
    propertyTypes.find((t) => t.value === alert.propertyType)?.label || alert.propertyType

  const badges: { label: string }[] = []
  if (alert.zone) badges.push({ label: alert.zone })
  if (propertyTypeLabel) badges.push({ label: propertyTypeLabel })
  if (alert.minPrice != null) badges.push({ label: `de la ${formatPrice(alert.minPrice)}` })
  if (alert.maxPrice != null) badges.push({ label: `pana la ${formatPrice(alert.maxPrice)}` })
  if (alert.minRooms != null) badges.push({ label: `${alert.minRooms}+ camere` })

  if (badges.length === 0) {
    badges.push({ label: 'Toate proprietatile' })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">Alerta contului tau</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(alert.createdAt).toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Activ</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Badge key={b.label} variant="secondary" className="text-xs">
            {b.label}
          </Badge>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDeactivate}
      >
        <Trash2 className="h-3 w-3" />
        Dezactiveaza
      </Button>
    </div>
  )
}
