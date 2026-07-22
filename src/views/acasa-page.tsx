'use client'

import { useMemo } from 'react'
import { ArrowRight, Building2 } from 'lucide-react'

import { PageContainer, PageSection, SectionHeader } from '@/components/layout'
import { HeroSection } from '@/components/marketing/hero-section'
import { StatsSection } from '@/components/marketing/stats-section'
import { RecentlyViewed } from '@/components/panels/recently-viewed'
import { PropertyCard } from '@/components/property/property-card'
import { PartnersSection } from '@/components/marketing/partners-section'
import { CtaSection } from '@/components/marketing/cta-section'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'
import { useProperties } from '@/hooks/use-properties'
import { useAppStore } from '@/store/use-app-store'

interface AcasaPageProps {
  onSaveSearch?: () => void
}

export function AcasaPage(_props: AcasaPageProps) {
  const navigateTo = useAppStore((state) => state.navigateTo)
  const { data: properties = [], isLoading, isError, refetch } = useProperties({ sort: 'newest' })

  const previewProperties = useMemo(() => {
    const featured = properties.filter((property) => Boolean(property.featured))
    const latest = properties.filter((property) => !property.featured)

    return [...featured, ...latest].slice(0, 6)
  }, [properties])

  return (
    <>
      <HeroSection />
      <StatsSection />
      <hr className="section-divider" />
      <RecentlyViewed />
      <PageContainer as="section" className="py-14 sm:py-16">
        <PageSection>
          <SectionHeader
            eyebrow="Selecția HQS"
            title="Proprietăți alese pentru tine"
            description="Descoperă ofertele populare și cele mai noi proprietăți publicate în București."
            actions={(
              <Button variant="outline" onClick={() => navigateTo('proprietati')}>
                Vezi toate proprietățile
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          />

          {isLoading ? (
            <PageState
              compact
              tone="loading"
              title="Încărcăm proprietățile"
              description="Pregătim selecția de oferte pentru tine."
            />
          ) : isError ? (
            <PageState
              compact
              tone="error"
              title="Proprietățile nu au putut fi încărcate"
              description="Încearcă din nou sau deschide catalogul complet."
              action={(
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => void refetch()}>
                    Reîncearcă
                  </Button>
                  <Button onClick={() => navigateTo('proprietati')}>
                    Deschide catalogul
                  </Button>
                </div>
              )}
            />
          ) : previewProperties.length === 0 ? (
            <PageState
              compact
              icon={Building2}
              title="Nu sunt proprietăți publicate momentan"
              description="Catalogul este în curs de actualizare. Revino în curând pentru oferte noi."
              action={(
                <Button variant="outline" onClick={() => navigateTo('proprietati')}>
                  Verifică catalogul
                </Button>
              )}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {previewProperties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    eagerImage={index < 3}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button size="lg" onClick={() => navigateTo('proprietati')}>
                  Explorează toate proprietățile
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </PageSection>
      </PageContainer>
      <hr className="section-divider" />
      <PartnersSection />
      <CtaSection />
    </>
  )
}
