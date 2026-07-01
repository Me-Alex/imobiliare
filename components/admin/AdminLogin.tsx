"use client"

import { useEffect, useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"

const loginAliases: Record<string, string> = {
  admin: "1@2.com",
}

function resolveLoginIdentifier(value: string) {
  const identifier = value.trim().toLowerCase()
  return loginAliases[identifier] || identifier
}

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "reset">("login")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) window.location.href = "/admin/dashboard"
    })
  }, [])

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (busy || !email.trim() || (mode === "login" && password.length < 1)) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const loginEmail = resolveLoginIdentifier(email)
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo: `${window.location.origin}/admin/login` })
        if (error) throw error
        setMessage("Emailul de resetare a fost trimis.")
        return
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (error) throw error
      const token = data.session?.access_token
      if (!token) throw new Error("Sesiunea Supabase nu a fost creata.")
      const response = await fetch("/api/admin/session", { headers: { Authorization: `Bearer ${token}` } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "Contul nu are rol admin.")
      window.location.href = "/admin/dashboard"
    } catch (err: any) {
      setError(err.message || "Autentificare esuata.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-accent">HQS Admin</p>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Autentificare securizata pentru operatiuni imobiliare.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-text-muted">Adminul foloseste Supabase Auth si roluri RBAC. Primul acces se acorda prin `ADMIN_BOOTSTRAP_EMAILS`, apoi rolurile se gestioneaza din dashboard.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[["RBAC", "permisiuni pe rol"], ["Audit", "actiuni trasabile"], ["Providers", "email, SMS, calendar, semnare, facturi"]].map(([label, body]) => <div key={label} className="rounded-lg border border-bg-surface bg-bg-card p-4"><p className="font-black text-accent">{label}</p><p className="mt-1 text-sm text-text-muted">{body}</p></div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-bg-surface bg-bg-card p-6 shadow-card">
          <form onSubmit={submit}>
            <div className="mb-6 flex gap-2">
              <button type="button" onClick={() => setMode("login")} className={`rounded-lg px-4 py-2 text-sm font-black ${mode === "login" ? "bg-accent text-bg-primary" : "bg-bg-secondary text-text-muted"}`}>Login</button>
              <button type="button" onClick={() => setMode("reset")} className={`rounded-lg px-4 py-2 text-sm font-black ${mode === "reset" ? "bg-accent text-bg-primary" : "bg-bg-secondary text-text-muted"}`}>Reset</button>
            </div>
            <label className="block"><span className="mb-2 block text-xs font-black uppercase text-text-muted">Email sau username admin</span><input className="form-input" name="email" type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin" /></label>
            {mode === "login" && <label className="mt-4 block"><span className="mb-2 block text-xs font-black uppercase text-text-muted">Parola</span><input className="form-input" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="parola admin" /></label>}
            <button type="submit" disabled={busy || !email.trim() || (mode === "login" && password.length < 1)} className="mt-6 h-12 w-full rounded-lg bg-accent px-4 text-sm font-black text-bg-primary disabled:opacity-50">{busy ? "Se proceseaza..." : mode === "login" ? "Intra in admin" : "Trimite resetare"}</button>
            <div aria-live="assertive">
              {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-500">{error}</p>}
              {message && <p role="alert" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500">{message}</p>}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
