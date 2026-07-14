'use client'

import { useCallback } from 'react'
import { HeroSection } from '@/components/marketing/hero-section'
import { StatsSection } from '@/components/marketing/stats-section'
import { RecentlyViewed } from '@/components/panels/recently-viewed'
import { PropertyFilters } from '@/components/property/property-filters'
import { PropertyGrid } from '@/components/property/property-grid'
import { PartnersSection } from '@/components/marketing/partners-section'
import { CtaSection } from '@/components/marketing/cta-section'
import { useAppStore } from '@/store/use-app-store'

interface AcasaPageProps {
  onSaveSearch?: () => void
}

export function AcasaPage({ onSaveSearch }: AcasaPageProps) {
  const { setSelectedPropertySlug, navigateTo } = useAppStore()

  const handleSelectProperty = useCallback((slug: string) => {
    setSelectedPropertySlug(slug)
  }, [setSelectedPropertySlug])

  return (
    <>
      <HeroSection />
      <StatsSection />
      <hr className="section-divider" />
      <RecentlyViewed />
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-header mb-8 text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Proprietati Disponibile</h2>
            <p className="text-muted-foreground mt-2 sm:max-w-none sm:ml-0">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                Exploreaza cele mai bune oferte din Bucuresti.
              </span>
            </p>
          </div>
          <PropertyFilters onSaveSearch={onSaveSearch} />
          <div className="mt-6">
            <PropertyGrid onSelectProperty={handleSelectProperty} />
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => navigateTo('proprietati')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors hover-lift"
            >
              Vezi Toate Proprietatile
            </button>
          </div>
        </div>
      </div>
      <hr className="section-divider" />
      <PartnersSection />
      <CtaSection />
    </>
  )
}