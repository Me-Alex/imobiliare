'use client'

import { Archive, Building2, CalendarDays, MapPin, Pencil, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getPublishedPropertyQuality } from '@/lib/property-publication-readiness'
import type { UserProperty } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MyPropertiesListProps {
  properties: UserProperty[]
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  label?: string
  onEdit: (property: UserProperty) => void
  onDelete: (id: string) => void
}

export function MyPropertiesList({
  properties,
  visible,
  onVisibleChange,
  label = 'Proprietățile tale',
  onEdit,
  onDelete,
}: MyPropertiesListProps) {
  return (
    <Sheet open={visible} onOpenChange={onVisibleChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b py-5 pl-5 pr-14 text-left sm:pl-6 sm:pr-14">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle>{label}</SheetTitle>
              <SheetDescription className="mt-1">
                Editează sau arhivează anunțurile pe care le gestionezi.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/15 p-4 sm:p-5">
          {properties.length === 0 ? (
            <div
              role="status"
              className="flex min-h-full flex-col items-center justify-center px-4 py-12 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-background text-primary shadow-sm">
                <Archive className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">Nu mai există proprietăți active</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Proprietatea arhivată nu mai este publică. După ce adaugi un anunț nou, îl vei putea gestiona aici.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => onVisibleChange(false)}
              >
                Înapoi la publicare
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const quality = getPublishedPropertyQuality(property)
                const nextRecommendation = quality.recommendations[0]
                const cover = String(property.cover_url || property.coverUrl || '')

                return (
            <article
              key={property.id as string}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-primary/5 sm:h-28 sm:w-36">
                  {cover ? (
                    <img
                      src={cover}
                      alt={`Coperta proprietății ${property.title as string}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary/45" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{property.type as string}</Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {property.transaction === 'INCHIRIERE' ? 'Închiriere' : 'Vânzare'}
                    </Badge>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">
                    {property.title as string}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {property.zone as string}{property.sector ? `, ${property.sector}` : ''}
                    </span>
                  </p>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {Number(property.price).toLocaleString('ro-RO')} {property.currency as string}
                    {property.transaction === 'INCHIRIERE' ? (
                      <span className="text-[10px] font-medium text-muted-foreground"> / lună</span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="border-t bg-background px-3 py-3 sm:px-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Calitate {quality.score}% · {quality.label}
                  </span>
                  <span className={cn('text-[11px] font-semibold', quality.score >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                    {quality.nextAction ? 'De optimizat' : 'Complet'}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', quality.score >= 80 ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${quality.score}%` }}
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                  {nextRecommendation
                    ? `${nextRecommendation.title}: ${nextRecommendation.description}`
                    : 'Anuntul este complet si pregatit pentru promovare.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2.5 sm:px-4">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Publicat la {new Date(property.created_at as string).toLocaleDateString('ro-RO')}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => {
                      onVisibleChange(false)
                      onEdit(property)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editează
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 text-muted-foreground hover:text-amber-700"
                    onClick={() => onDelete(property.id as string)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Arhivează
                  </Button>
                </div>
              </div>
            </article>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
