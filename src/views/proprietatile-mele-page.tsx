'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  ImageOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { EditPropertyDialog } from '@/components/property/edit-property-dialog'
import { PageContainer, PageShell, PageSurface } from '@/components/layout/page-shell'
import { PageHero } from '@/components/layout/page-hero'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { archiveManagedProperty, fetchManagedProperties } from '@/lib/managed-properties'
import { getPublishedPropertyQuality } from '@/lib/property-publication-readiness'
import type { UserProperty } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

function valuePresent(value: unknown): boolean {
  if (typeof value === 'number') return value > 0
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function coverUrl(property: UserProperty): string {
  return String(property.cover_url || property.coverUrl || '')
}

function propertyLocation(property: UserProperty): string {
  return [property.address, property.zone, property.sector].filter(valuePresent).join(', ') || 'Localizare necompletată'
}

function formatPrice(property: UserProperty): string {
  const price = Number(property.price) || 0
  const suffix = property.transaction === 'INCHIRIERE' ? ' / lună' : ''
  return `${price.toLocaleString('ro-RO')} ${String(property.currency || 'EUR')}${suffix}`
}

export function ProprietatileMelePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editProperty, setEditProperty] = useState<UserProperty | null>(null)
  const [archiveProperty, setArchiveProperty] = useState<UserProperty | null>(null)
  const [archiving, setArchiving] = useState(false)

  const load = useCallback(async () => {
    if (!user || profile?.role !== 'OWNER') {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      setProperties(await fetchManagedProperties({ userId: user.id, role: 'OWNER' }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Proprietățile nu au putut fi încărcate.')
    } finally {
      setLoading(false)
    }
  }, [profile?.role, user])

  useEffect(() => { void load() }, [load])

  const visibleProperties = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ro-RO')
    if (!normalized) return properties
    return properties.filter((property) => [property.title, property.address, property.zone, property.sector]
      .some((value) => String(value || '').toLocaleLowerCase('ro-RO').includes(normalized)))
  }, [properties, query])

  const averageQuality = properties.length
    ? Math.round(properties.reduce((total, property) => total + getPublishedPropertyQuality(property).score, 0) / properties.length)
    : 0
  const withoutCover = properties.filter((property) => !coverUrl(property)).length
  const published = properties.filter((property) => String(property.status).toUpperCase() === 'PUBLISHED').length

  const confirmArchive = async () => {
    if (!archiveProperty) return
    setArchiving(true)
    try {
      await archiveManagedProperty(archiveProperty.id)
      toast.success('Proprietate arhivată', {
        description: 'Anunțul nu mai este public, iar istoricul rămâne păstrat.',
      })
      setArchiveProperty(null)
      await load()
    } catch (cause) {
      toast.error('Proprietatea nu a putut fi arhivată', {
        description: cause instanceof Error ? cause.message : 'Încearcă din nou.',
      })
    } finally {
      setArchiving(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Se încarcă proprietățile" /></div>
  }
  if (profile && profile.role !== 'OWNER') {
    return <RoleAccessDenied currentRole={profile.role} allowedRoles={['OWNER']} />
  }

  return (
    <PageShell>
      <PageHero
        variant="border"
        icon={Building2}
        title="Proprietățile mele"
        description="Administrează anunțurile într-un singur loc și vezi imediat ce necesită atenție."
        breadcrumb={[{ label: 'Cont', page: 'dashboard' }, { label: 'Proprietățile mele' }]}
      >
        <Button onClick={() => navigateTo('adauga-proprietate')} className="gap-2">
          <Plus className="h-4 w-4" /> Adaugă proprietate
        </Button>
      </PageHero>

      <PageContainer className="space-y-6 py-6 sm:py-8">
        {error ? (
          <PageSurface className="p-6 text-center sm:p-10">
            <RefreshCw className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Proprietățile nu sunt disponibile</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" onClick={() => void load()}>Reîncearcă</Button>
          </PageSurface>
        ) : properties.length === 0 ? (
          <PageSurface className="overflow-hidden p-6 sm:p-10">
            <div className="mx-auto max-w-xl text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Publică prima proprietate</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Creezi anunțul o singură dată, apoi urmărești aici starea, calitatea și performanța lui.
              </p>
              <Button className="mt-6 gap-2" onClick={() => navigateTo('adauga-proprietate')}>
                <Plus className="h-4 w-4" /> Începe publicarea
              </Button>
            </div>
          </PageSurface>
        ) : (
          <>
            <section aria-label="Rezumat portofoliu" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PortfolioStat icon={Building2} label="Proprietăți active" value={properties.length} />
              <PortfolioStat icon={CheckCircle2} label="Publicate" value={published} />
              <PortfolioStat icon={Sparkles} label="Calitate medie" value={`${averageQuality}%`} />
              <PortfolioStat icon={ImageOff} label="Fără fotografie" value={withoutCover} attention={withoutCover > 0} />
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Caută după titlu sau adresă"
                  aria-label="Caută în proprietățile mele"
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {visibleProperties.length} din {properties.length} {properties.length === 1 ? 'proprietate' : 'proprietăți'}
              </p>
            </div>

            {visibleProperties.length === 0 ? (
              <PageSurface className="p-8 text-center">
                <Search className="mx-auto h-7 w-7 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">Nicio proprietate găsită</h2>
                <p className="mt-1 text-sm text-muted-foreground">Schimbă termenul de căutare.</p>
              </PageSurface>
            ) : (
              <section aria-label="Lista proprietăților" className="grid gap-4 lg:grid-cols-2">
                {visibleProperties.map((property) => {
                  const quality = getPublishedPropertyQuality(property)
                  const nextRecommendation = quality.recommendations[0]
                  const image = coverUrl(property)
                  return (
                    <PageSurface key={property.id} as="article" className="overflow-hidden">
                      <div className="flex min-h-44 flex-col sm:flex-row">
                        <div className="relative min-h-44 bg-muted sm:w-52 sm:shrink-0">
                          {image ? (
                            <img src={image} alt={`Coperta proprietății ${String(property.title)}`} className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <ImageOff className="h-7 w-7" />
                              <span className="text-xs">Fără fotografie</span>
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <StatusBadge status={property.status || 'DRAFT'} />
                            <span className={cn('text-xs font-semibold', quality.score >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                              Calitate {quality.score}% · {quality.label}
                            </span>
                          </div>
                          <h2 className="mt-3 line-clamp-2 text-lg font-semibold">{String(property.title)}</h2>
                          <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {propertyLocation(property)}
                          </p>
                          <p className="mt-3 text-lg font-bold text-primary">{formatPrice(property)}</p>
                          <div className="mt-3 rounded-xl border bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-xs font-medium">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Recomandare anunt
                              </span>
                              <span className="text-xs text-muted-foreground">{quality.score}/100</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                              <div
                                className={cn('h-full rounded-full', quality.score >= 80 ? 'bg-emerald-500' : 'bg-amber-500')}
                                style={{ width: `${quality.score}%` }}
                              />
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {nextRecommendation
                                ? `${nextRecommendation.title}: ${nextRecommendation.description}`
                                : 'Anuntul este complet si pregatit pentru promovare.'}
                            </p>
                          </div>
                          <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditProperty(property)}>
                              <Pencil className="h-3.5 w-3.5" /> Editează
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigateTo('owner-dashboard')}>
                              <BarChart3 className="h-3.5 w-3.5" /> Performanță
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-amber-700" onClick={() => setArchiveProperty(property)}>
                              <Archive className="h-3.5 w-3.5" /> Arhivează
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PageSurface>
                  )
                })}
              </section>
            )}
          </>
        )}
      </PageContainer>

      <EditPropertyDialog
        open={Boolean(editProperty)}
        onOpenChange={(open) => { if (!open) setEditProperty(null) }}
        property={editProperty}
        onSaved={() => { setEditProperty(null); void load() }}
      />

      <Dialog open={Boolean(archiveProperty)} onOpenChange={(open) => { if (!open && !archiving) setArchiveProperty(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arhivezi această proprietate?</DialogTitle>
            <DialogDescription>
              „{String(archiveProperty?.title || '')}” nu va mai apărea public. Istoricul și datele tranzacției rămân păstrate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={archiving}>Păstrează proprietatea</Button></DialogClose>
            <Button variant="destructive" disabled={archiving} onClick={() => void confirmArchive()}>
              {archiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
              Arhivează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function PortfolioStat({
  icon: Icon,
  label,
  value,
  attention = false,
}: {
  icon: typeof Building2
  label: string
  value: string | number
  attention?: boolean
}) {
  return (
    <PageSurface className="flex items-center gap-3 p-4">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', attention ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40' : 'bg-primary/10 text-primary')}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </PageSurface>
  )
}
