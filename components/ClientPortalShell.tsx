"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { PortalProvider } from "@/components/portal/PortalContext"
import PortalShell, { routeToTab } from "@/components/portal/PortalShell"
import { LoadingState } from "@/components/admin/ui"
import { ProfileTab, FavoritesTab, RecommendationsTab, DocumentsTab, OffersTab, ActivityTab, AppointmentsTab, SecurityTab } from "@/components/portal"
import { supabase } from "@/lib/supabase"
import type { Property } from "@/lib/supabase"

/**
 * ClientPortalShell — top-level portal entry point.
 *
 * - Unauthenticated → shows PortalAuthGateway
 * - Authenticated  → wraps tab router in <PortalProvider> + <PortalShell>
 */

export default function ClientPortalShell({
  properties,
  initialSection,
}: {
  properties: Property[]
  initialSection?: string
}) {
  const [token, setToken] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || "")
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "")
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!token) {
    return <PortalAuthGateway redirectTo={pathname || "/portal"} onAuthenticated={setToken} />
  }

  return (
    <PortalProvider>
      <PortalShell>
        <PortalTabRouter />
      </PortalShell>
    </PortalProvider>
  )
}

/** Renders the active tab content based on URL segment. */
function PortalTabRouter() {
  const pathname = usePathname()
  const segment = pathname?.split("/").filter(Boolean)[1] || ""
  const tab = routeToTab[String(segment).toLowerCase()] || "profil"

  return (
    <>
      {tab === "profil" && <ProfileTab />}
      {tab === "favorite" && <FavoritesTab />}
      {tab === "recomandari" && <RecommendationsTab />}
      {tab === "documente" && <DocumentsTab />}
      {tab === "oferte" && <OffersTab />}
      {tab === "programari" && <AppointmentsTab />}
      {tab === "activitate" && <ActivityTab />}
      {tab === "securitate" && <SecurityTab />}
    </>
  )
}
