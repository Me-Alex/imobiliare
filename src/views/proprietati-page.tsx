'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Home, Building2, ChevronRight } from 'lucide-react'
import { PropertyFilters } from '@/components/property-filters'
import { PropertyGrid } from '@/components/property-grid'
import { RecentlyViewed } from '@/components/recently-viewed'
import { useAppStore } from '@/store/use-app-store'

export function ProprietatiPage() {
  const { setSelectedPropertySlug } = useAppStore()

  const handleSelectProperty = useCallback((slug: string) => {
    setSelectedPropertySlug(slug)
  }, [setSelectedPropertySlug])

  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="floating-blob w-[400px] h-[400px] -top-32 -right-32" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Proprietati</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Proprietati</h1>
                <p className="text-muted-foreground mt-1">Gaseste proprietatea perfecta in Bucuresti</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {['Apartamente', 'Case', 'Vile', 'Terenuri', 'Spatii Comerciale'].map((tag) => (
                <button
                  key={tag}
                  className="text-sm px-4 py-2 rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 hover-lift"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Properties Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PropertyFilters />
          <div className="mt-6">
            <PropertyGrid onSelectProperty={handleSelectProperty} />
          </div>
        </div>
      </section>
    </>
  )
}