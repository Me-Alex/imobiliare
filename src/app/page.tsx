'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import dynamic from 'next/dynamic'
import { PageState } from '@/components/ui/page-state'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AnnouncementBanner } from '@/components/layout/announcement-banner'
import { SiteHeader } from '@/components/layout/site-header'
import { AccountWorkspaceNav } from '@/components/layout/account-workspace-nav'
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
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { isPageKey } from '@/store/slices/navigation'
import { Toaster } from 'sonner'
import { AcasaPage } from '@/views/acasa-page'
import { NotificationsPanel } from '@/components/panels/notifications-panel'
import { useCoinsHydration } from '@/hooks/use-coin-actions'
import { useAuthReturnRedirect } from '@/hooks/use-auth-return-redirect'
import { InactiveAccountGate } from '@/components/account/inactive-account-gate'
import { isAccountWorkspacePage } from '@/lib/navigation-config'
import { PATH_PAGE_MAP } from '@/lib/route-config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const viewLoading = () => <PageState compact tone="loading" title="Se încarcă pagina" description="Pregătim conținutul pentru tine." />

const ProprietatiPage = dynamic(() => import('@/views/proprietati-page').then((module) => module.ProprietatiPage), { loading: viewLoading })
const AnalizaPage = dynamic(() => import('@/views/analiza-page').then((module) => module.AnalizaPage), { loading: viewLoading })
const ZonePage = dynamic(() => import('@/views/zone-page').then((module) => module.ZonePage), { loading: viewLoading })
const DeCeNoiPage = dynamic(() => import('@/views/de-ce-noi-page').then((module) => module.DeCeNoiPage), { loading: viewLoading })
const CalculatorPage = dynamic(() => import('@/views/calculator-page').then((module) => module.CalculatorPage), { loading: viewLoading })
const LoginPage = dynamic(() => import('@/views/login-page').then((module) => module.LoginPage), { loading: viewLoading })
const AdminPage = dynamic(() => import('@/views/admin-page').then((module) => module.AdminPage), { loading: viewLoading })
const AdaugaProprietatePage = dynamic(() => import('@/views/adauga-proprietate-page').then((module) => module.AdaugaProprietatePage), { loading: viewLoading })
const DisponibilitateStaffPage = dynamic(() => import('@/views/disponibilitate-staff-page').then((module) => module.DisponibilitateStaffPage), { loading: viewLoading })
const DocumentePage = dynamic(() => import('@/views/documente-page').then((module) => module.DocumentePage), { loading: viewLoading })
const ProgramareVizionarePage = dynamic(() => import('@/views/programare-vizionare-page').then((module) => module.ProgramareVizionarePage), { loading: viewLoading })
const VizionarileMelePage = dynamic(() => import('@/views/vizionarile-mele-page').then((module) => module.VizionarileMelePage), { loading: viewLoading })
const DashboardPage = dynamic(() => import('@/views/dashboard-page').then((module) => module.DashboardPage), { loading: viewLoading })
const ProfilPage = dynamic(() => import('@/views/profil-page').then((module) => module.ProfilPage), { loading: viewLoading })
const EvaluarePage = dynamic(() => import('@/views/evaluare-page').then((module) => module.EvaluarePage), { loading: viewLoading })
const ServiciiPage = dynamic(() => import('@/views/servicii-page').then((module) => module.ServiciiPage), { loading: viewLoading })
const MonedePage = dynamic(() => import('@/views/monede-page').then((module) => module.MonedePage), { loading: viewLoading })
const PropertyPage = dynamic(() => import('@/views/property-page').then((module) => module.PropertyPage), { loading: viewLoading })
const DealRoomPage = dynamic(() => import('@/views/deal-room-page').then((module) => module.DealRoomPage), { loading: viewLoading })
const CrmPage = dynamic(() => import('@/views/crm-page').then((module) => module.CrmPage), { loading: viewLoading })
const OwnerDashboardPage = dynamic(() => import('@/views/owner-dashboard-page').then((module) => module.OwnerDashboardPage), { loading: viewLoading })
const ProprietatileMelePage = dynamic(() => import('@/views/proprietatile-mele-page').then((module) => module.ProprietatileMelePage), { loading: viewLoading })

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
  servicii: ServiciiPage,
  evaluare: EvaluarePage,
  monede: MonedePage,
  proprietate: () => <PropertyPage />,
  'deal-room': DealRoomPage,
  crm: CrmPage,
  'owner-dashboard': OwnerDashboardPage,
  'proprietatile-mele': ProprietatileMelePage,
}

// Focused flows keep the shared header, but do not use the public marketing chrome.
const focusedPages = new Set(['login', 'admin', 'adauga-proprietate', 'dashboard', 'profil', 'programare-vizionare', 'disponibilitate-staff', 'vizionarile-mele', 'documente', 'monede', 'deal-room', 'crm', 'owner-dashboard', 'proprietatile-mele'])

function AppContent({ initialPage = 'acasa' }: { initialPage?: PageKey }) {
  useCoinsHydration()
  useAuthReturnRedirect()
  const { user, profile } = useAuth()
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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false)
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false)

  // Restore direct links and keep the SPA state in sync with browser Back/Forward.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const propertySlug = params.get('property')
    if (propertySlug) {
      window.location.replace(`/proprietati/${encodeURIComponent(propertySlug)}`)
      return
    }

    const routeContext = sessionStorage.getItem('pm-route-viewing-context')
      || sessionStorage.getItem('pm-auth-return-context')
    if (routeContext) {
      try {
        const context = JSON.parse(routeContext) as { propertyId?: string; propertyTitle?: string; vizionarePropertyId?: string; vizionarePropertyTitle?: string }
        const propertyId = context.propertyId || context.vizionarePropertyId
        const propertyTitle = context.propertyTitle || context.vizionarePropertyTitle
        if (propertyId && propertyTitle) {
          useAppStore.getState().setVizionareProperty(propertyId, propertyTitle)
        }
      } catch {
        // Ignore stale route context and continue with the requested page.
      }
      sessionStorage.removeItem('pm-route-viewing-context')
      sessionStorage.removeItem('pm-auth-return-context')
    }

    const syncPageFromUrl = () => {
      const requestedPage = new URLSearchParams(window.location.search).get('page')
      const pathPage = PATH_PAGE_MAP[window.location.pathname]
      const nextPage: PageKey = isPageKey(requestedPage) && pageComponents[requestedPage]
        ? requestedPage
        : pathPage && pageComponents[pathPage]
          ? pathPage
          : initialPage
      useAppStore.setState({ currentPage: nextPage })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    syncPageFromUrl()
    window.addEventListener('popstate', syncPageFromUrl)
    return () => window.removeEventListener('popstate', syncPageFromUrl)
  }, [initialPage])

  const handleContact = useCallback((propertyTitle: string) => {
    setContactPropertyTitle(propertyTitle)
    setContactOpen(true)
  }, [])

  const PageComponent = pageComponents[currentPage]
  const isFocusedPage = focusedPages.has(currentPage)
  const pageContent = user && profile && !canAccessAccountPage(profile.role, currentPage)
    ? <RoleAccessDenied currentRole={profile.role} allowedRoles={getAllowedRolesForPage(currentPage)} />
    : PageComponent
      ? <PageComponent onSaveSearch={() => setSaveSearchDialogOpen(true)} />
      : null

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Treci la conținutul principal
      </a>
      {!isFocusedPage && <AnnouncementBanner />}
      <SiteHeader onOpenFavorites={() => setFavoritesOpen(true)} onOpenPriceAlerts={() => setPriceAlertsOpen(true)} onOpenNotifications={() => setNotificationsOpen(true)} onOpenSavedSearches={() => setSavedSearchesOpen(true)} />
      {isAccountWorkspacePage(currentPage) && <AccountWorkspaceNav />}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <InactiveAccountGate enabled={isAccountWorkspacePage(currentPage)}>
              {pageContent}
            </InactiveAccountGate>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isFocusedPage && <SiteFooter />}
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

export function PlatformApp({ initialPage = 'acasa' }: { initialPage?: PageKey }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <AppContent initialPage={initialPage} />
        </AuthProvider>
      </ThemeProvider>
          </MotionConfig>
    </QueryClientProvider>
  )
}

export default function Home() {
  return <PlatformApp />
}
