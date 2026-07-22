'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, User, Check, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import type { UserProperty } from '@/lib/types'
import { loadManagedPropertyCache } from '@/lib/managed-properties'

interface PropertyPickerStepProps {
  selectedId: string | null
  onSelect: (prop: UserProperty) => void
}

export function PropertyPickerStep({ selectedId, onSelect }: PropertyPickerStepProps) {
  const { user } = useAuth()
  const properties = useMemo(() => loadManagedPropertyCache(user?.id), [user?.id])

  const allProperties = useMemo(() => {
    // Also include some demo properties if user has none
    if (properties.length > 0) return properties
    return [
      {
        id: 'demo-1', title: 'Apartament 2 camere Dorobanti',
        type: 'Apartament', transaction: 'VANZARE', price: '95000',
        currency: 'EUR', areaSqm: '58', rooms: '2', address: 'Str. Dorobanti nr. 45',
        zone: 'Dorobanti', coverUrl: '/images/prop-demo-1.jpg',
      },
      {
        id: 'demo-2', title: 'Garsoniera Centru',
        type: 'Garsoniera', transaction: 'INCHIRIERE', price: '450',
        currency: 'EUR', areaSqm: '35', rooms: '1', address: 'Str. Victoriei nr. 12',
        zone: 'Victoriei', coverUrl: '/images/prop-demo-2.jpg',
      },
      {
        id: 'demo-3', title: 'Casa 3 camere Pipera',
        type: 'Casa', transaction: 'VANZARE', price: '185000',
        currency: 'EUR', areaSqm: '120', rooms: '3', address: 'Str. Pipera nr. 78',
        zone: 'Pipera', coverUrl: '/images/prop-demo-3.jpg',
      },
    ]
  }, [properties])

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          <User className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Autentifica-te</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Trebuie sa fii autentificat pentru a programa o vizionare.
        </p>
        <Button onClick={() => useAppStore.getState().navigateTo('login')} className="gap-2">
          Autentifica-te
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Selecteaza o proprietate pentru a programa o vizionare
      </p>
      <div className="grid gap-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        {allProperties.map((prop) => {
          const isSelected = selectedId === prop.id
          return (
            <motion.button
              key={prop.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(prop)}
              className={`
                w-full text-left rounded-xl border-2 p-4 transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }
              `}
            >
              <div className="flex gap-4">
                {prop.coverUrl ? (
                  <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    <img
                      src={prop.coverUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        ;(e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight truncate">{prop.title}</h4>
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {prop.type && <Badge variant="secondary" className="text-xs">{prop.type}</Badge>}
                    {prop.transaction && (
                      <Badge variant="outline" className="text-xs">
                        {prop.transaction === 'VANZARE' ? 'Vanzare' : 'Inchiriere'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {prop.price && <span className="font-medium text-foreground">{prop.price} {prop.currency}</span>}
                    {prop.areaSqm && <span>{prop.areaSqm} m²</span>}
                    {prop.rooms && <span>{prop.rooms} cam.</span>}
                  </div>
                  {prop.address && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{prop.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
