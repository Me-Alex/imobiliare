"use client"

import { useEffect, useState } from "react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import PortalAppointmentsConsole from "@/components/PortalAppointmentsConsole"
import ScaledClientPortal from "@/components/ScaledClientPortal"
import { supabase, type Property } from "@/lib/supabase"

export default function ClientPortalShell({ properties }: { properties: Property[] }) {
  const [token, setToken] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token || ""))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setToken(session?.access_token || ""))
    return () => listener.subscription.unsubscribe()
  }, [])

  // Keep the portal a single gated experience. When unauthenticated, we show only auth.
  if (!token) return <PortalAuthGateway redirectTo="/portal" onAuthenticated={setToken} />

  return (
    <>
      <ScaledClientPortal />
      <PortalAppointmentsConsole properties={properties} />
    </>
  )
}

