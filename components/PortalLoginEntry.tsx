"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ShieldCheck } from "lucide-react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"

export default function PortalLoginEntry() {
  const [accessToken, setAccessToken] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token || "")
      setEmail(data.session?.user.email || "")
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token || "")
      setEmail(session?.user.email || "")
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!accessToken) {
    return <PortalAuthGateway onAuthenticated={setAccessToken} redirectTo="/portal" />
  }

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-lg border border-bg-surface bg-bg-card p-6 shadow-card">
        <ShieldCheck className="h-8 w-8 text-accent" aria-hidden />
        <h1 className="mt-4 text-3xl font-black text-text-primary">Esti autentificat.</h1>
        <p className="mt-3 text-sm leading-7 text-text-muted">
          Sesiunea Supabase este activa{email ? ` pentru ${email}` : ""}. Continua catre portal pentru profil, favorite, documente, oferte si programari.
        </p>
        <Link href="/portal" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">
          Deschide portalul
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
