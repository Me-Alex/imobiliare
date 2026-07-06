'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { SiteHeader } from '@/components/site-header'
import { FavoritesPanel } from '@/components/favorites-panel'
import { PriceAlertsPanel } from '@/components/price-alerts-panel'
import { SiteFooter } from '@/components/site-footer'
import { PropertyDetailDialog } from '@/components/property-detail-dialog'
import { PropertyCompare } from '@/components/property-compare'
import { ContactFormDialog } from '@/components/contact-form-dialog'
import { CookieConsent } from '@/components/cookie-consent'
import { GalleryLightbox } from '@/components/gallery-lightbox'
import { BackToTop } from '@/components/back-to-top'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { AuthProvider } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { Toaster } from 'sonner'
import { AcasaPage } from '@/views/acasa-page'
import { ProprietatiPage } from '@/views/proprietati-page'
import { AnalizaPage } from '@/views/analiza-page'
import { ZonePage } from '@/views/zone-page'
import { DeCeNoiPage } from '@/views/de-ce-noi-page'
import { CalculatorPage } from '@/views/calculator-page'
import { LoginPage } from '@/views/login-page'
import { AdminPage } from '@/views/admin-page'
import { AdaugaProprietatePage } from '@/views/adauga-proprietate-page'
import { DisponibilitateStaffPage } from '@/views/disponibilitate-staff-page'
import { DocumentePage } from '@/views/documente-page'
import { ProgramareVizionarePage } from '@/views/programare-vizionare-page'
import { VizionarileMelePage } from '@/views/vizionarile-mele-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const pageComponents: Record<string, React.ComponentType> = {
  acasa: AcasaPage,
  proprietati: ProprietatiPage,
  analiza: AnalizaPage,
  zone: ZonePage,
  'de-ce-noi': DeCeNoiPage,
  calculator: CalculatorPage,
  login: LoginPage,
  admin: AdminPage,
  'adauga-proprietate': AdaugaProprietatePage,
  'disponibilitate-staff': DisponibilitateStaffPage,
  'documente': DocumentePage,
  'programare-vizionare': ProgramareVizionarePage,
  'vizionarile-mele': VizionarileMelePage,
}

// Pages that should NOT show header/footer/overlays
const fullBleedPages = new Set(['login', 'admin', 'adauga-proprietate', 'programare-vizionare', 'disponibilitate-staff', 'vizionarile-mele', 'documente'])

function AppContent() {
  const {
    currentPage,
    lightboxImages,
    lightboxIndex,
    clearLightbox,
    chatOpen,
    setChatOpen,
  } = useAppStore()
  const [contactOpen, setContactOpen] = useState(false)
  const [contactPropertyTitle, setContactPropertyTitle] = useState('')
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [priceAlertsOpen, setPriceAlertsOpen] = useState(false)

  const handleContact = useCallback((propertyTitle: string) => {
    setContactPropertyTitle(propertyTitle)
    setContactOpen(true)
  }, [])

  const PageComponent = pageComponents[currentPage]
  const isFullBleed = fullBleedPages.has(currentPage)

  if (isFullBleed) {
    // Login and Admin pages have their own header/footer
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {PageComponent && <PageComponent />}
            </motion.div>
          </AnimatePresence>
        </main>
        <Toaster richColors position="bottom-right" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Treci la continutul principal
      </a>
      <AnnouncementBanner />
      <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} />
      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {PageComponent && <PageComponent />}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <PropertyDetailDialog onContact={handleContact} />
      <PropertyCompare />
      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyTitle={contactPropertyTitle}
      />
      <FavoritesPanel open={favoritesOpen} onOpenChange={setFavoritesOpen} />
      <PriceAlertsPanel open={priceAlertsOpen} onOpenChange={setPriceAlertsOpen} />
      <CookieConsent />
      <GalleryLightbox
        key={lightboxImages.join(',')}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxImages.length > 0}
        onClose={clearLightbox}
      />
      <Toaster richColors position="bottom-right" />
      <AIChatWidget open={chatOpen} onOpenChange={setChatOpen} />
      <BackToTop />
    </div>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}