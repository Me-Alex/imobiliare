"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useSearchParams } from "next/navigation"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"

export default function PortalLoginEntry() {
  const searchParams = useSearchParams()
  const [accessToken, setAccessToken] = useState("")
  const [email, setEmail] = useState("")

  const safeNext = (() => {
    const raw = searchParams.get("next") || ""
    if (!raw) return "/portal"
    if (!raw.startsWith("/") || raw.startsWith("//")) return "/portal"
    if (raw.startsWith("/login") || raw.startsWith("/admin")) return "/portal"
    return raw
  })()

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

  useEffect(() => {
    // If the user came here from a gated action (ex: offer submission), return them there.
    if (accessToken && safeNext && safeNext !== "/portal") {
      window.location.href = safeNext
    }
  }, [accessToken, safeNext])

  if (!accessToken) {
    return <PortalAuthGateway onAuthenticated={setAccessToken} redirectTo={safeNext || "/portal"} />
  }

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-lg border border-bg-surface bg-bg-card p-6 shadow-card">
        <ShieldCheck className="h-8 w-8 text-accent" aria-hidden />
        <h1 className="mt-4 text-3xl font-black text-text-primary">Esti autentificat.</h1>
        <p className="mt-3 text-sm leading-7 text-text-muted">
          Sesiunea Supabase este activa{email ? ` pentru ${email}` : ""}. Continua catre cont pentru profil, favorite, documente, oferte si programari.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={safeNext || "/portal"} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary">
            {safeNext && safeNext !== "/portal" ? "Continua" : "Deschide contul"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {safeNext !== "/portal" && (
            <Link href="/portal" className="inline-flex items-center justify-center gap-2 rounded-lg border border-bg-surface px-4 py-3 text-sm font-black text-text-primary">
              Mergi in portal
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
