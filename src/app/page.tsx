'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AnnouncementBanner } from '@/components/layout/announcement-banner'
import { SiteHeader } from '@/components/layout/site-header'
import { FavoritesPanel } from '@/components/panels/favorites-panel'
import { PriceAlertsPanel } from '@/components/panels/price-alerts-panel'
import { SavedSearchesPanel } from '@/components/panels/saved-searches-panel'
import { SiteFooter } from '@/components/layout/site-footer'
import { PropertyDetailDialog } from '@/components/property/property-detail-dialog'
import { PropertyCompare } from '@/components/property/property-compare'
import { ContactFormDialog } from '@/components/dialogs/contact-form-dialog'
import { SaveSearchDialog } from '@/components/dialogs/save-search-dialog'
import { CookieConsent } from '@/components/layout/cookie-consent'
import { GalleryLightbox } from '@/components/dialogs/gallery-lightbox'
import { BackToTop } from '@/components/layout/back-to-top'
import { AIChatWidget } from '@/components/features/ai-chat-widget'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { canAccessAccountPage, getAllowedRolesForPage } from '@/lib/account-roles'
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
import { DashboardPage } from '@/views/dashboard-page'
import { ProfilPage } from '@/views/profil-page'
import { EvaluarePage } from '@/views/evaluare-page'
import { MonedePage } from '@/views/monede-page'
import { NotificationsPanel } from '@/components/panels/notifications-panel'
import { CoinsPanel } from '@/components/panels/coins-panel'
import { useCoinsHydration } from '@/hooks/use-coin-actions'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const pageComponents: Record<string, React.ComponentType<Record<string, unknown>>> = {
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
  dashboard: DashboardPage,
  profil: ProfilPage,
  evaluare: EvaluarePage,
  monede: MonedePage,
}

// Pages that should NOT show header/footer/overlays
const fullBleedPages = new Set(['login', 'admin', 'adauga-proprietate', 'dashboard', 'profil', 'programare-vizionare', 'disponibilitate-staff', 'vizionarile-mele', 'documente'])

function AppContent() {
  useCoinsHydration()
  const { user, profile } = useAuth()
  const {
    currentPage,
    lightboxImages,
    lightboxIndex,
    clearLightbox,
    chatOpen,
    setChatOpen,
    setSelectedPropertySlug,
    navigateTo,
  } = useAppStore()
  const [contactOpen, setContactOpen] = useState(false)
  const [contactPropertyTitle, setContactPropertyTitle] = useState('')
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [priceAlertsOpen, setPriceAlertsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false)
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false)
  const [coinsOpen, setCoinsOpen] = useState(false)

  // Handle shared property links: ?property=slug
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const propertySlug = params.get('property')
    if (propertySlug) {
      setSelectedPropertySlug(propertySlug)
      // Navigate to properties page so the dialog is visible
      if (fullBleedPages.has(currentPage)) {
        navigateTo('proprietati')
      }
      // Clean the URL so it doesn't re-trigger on refresh
      const cleanUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }, [setSelectedPropertySlug, navigateTo, currentPage])

  const handleContact = useCallback((propertyTitle: string) => {
    setContactPropertyTitle(propertyTitle)
    setContactOpen(true)
  }, [])

  const PageComponent = pageComponents[currentPage]
  const isFullBleed = fullBleedPages.has(currentPage)
  const pageContent = user && profile && !canAccessAccountPage(profile.role, currentPage)
    ? <RoleAccessDenied currentRole={profile.role} allowedRoles={getAllowedRolesForPage(currentPage)} />
    : PageComponent
      ? <PageComponent onSaveSearch={() => setSaveSearchDialogOpen(true)} />
      : null

  if (isFullBleed) {
    // Login and Admin pages have their own header/footer
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} onOpenNotifications={() => setNotificationsOpen(true)} onOpenSavedSearches={() => setSavedSearchesOpen(true)} onOpenCoins={() => setCoinsOpen(true)} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {pageContent}
            </motion.div>
          </AnimatePresence>
        </main>
        <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
        <SavedSearchesPanel open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen} />
        <CoinsPanel open={coinsOpen} onOpenChange={setCoinsOpen} />
        <SaveSearchDialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen} />
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
      <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} onOpenNotifications={() => setNotificationsOpen(true)} onOpenSavedSearches={() => setSavedSearchesOpen(true)} onOpenCoins={() => setCoinsOpen(true)} />
      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {pageContent}
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
      <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <SavedSearchesPanel open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen} />
      <CoinsPanel open={coinsOpen} onOpenChange={setCoinsOpen} />
      <SaveSearchDialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen} />
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
