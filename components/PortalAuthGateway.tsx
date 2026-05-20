"use client"

import { useState } from "react"
import { KeyRound, Loader2, LockKeyhole, ShieldCheck, UserPlus } from "lucide-react"
import { getAuthRedirectUrl } from "@/lib/auth-redirect"
import { supabase } from "@/lib/supabase"

type AuthMode = "login" | "signup" | "reset"

type PortalAuthGatewayProps = {
  onAuthenticated?: (accessToken: string) => void
  redirectTo?: string
}

const modeLabels: Record<AuthMode, string> = {
  login: "Login",
  signup: "Cont nou",
  reset: "Resetare",
}

const modeDescriptions: Record<AuthMode, string> = {
  login: "Intra in cont cu email si parola.",
  signup: "Creeaza cont client si salveaza profilul in Supabase.",
  reset: "Primeste email pentru resetarea parolei.",
}

export default function PortalAuthGateway({ onAuthenticated, redirectTo }: PortalAuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const callbackUrl = getAuthRedirectUrl(redirectTo || "/portal")
  const canSubmit = email.includes("@") && (mode === "reset" || password.length >= 8)

  async function submit() {
    if (!canSubmit || loading) return
    setLoading(true)
    setMessage("")
    setError("")

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session?.access_token) {
          setMessage("Autentificat. Contul se incarca acum.")
          onAuthenticated?.(data.session.access_token)
        }
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: { full_name: fullName || email, phone },
          },
        })
        if (error) throw error
        if (data.session?.access_token) {
          await seedProfile(data.session.access_token)
          setMessage("Cont creat si autentificat.")
          onAuthenticated?.(data.session.access_token)
        } else {
          setMessage("Cont creat. Confirma emailul primit pentru a activa login-ul.")
        }
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl })
        if (error) throw error
        setMessage("Ti-am trimis emailul pentru resetarea parolei.")
      }

    } catch (err: any) {
      setError(err?.message || "Autentificarea nu a reusit.")
    } finally {
      setLoading(false)
    }
  }

  async function seedProfile(accessToken: string) {
    await fetch("/api/client/account", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName || email,
        phone,
        budget: 250000,
        preferred_zones: ["Pipera"],
        rooms: 3,
        purpose: "locuire",
        financing_status: "neconfirmat",
      }),
    }).catch(() => null)
  }

  const Icon = mode === "signup" ? UserPlus : mode === "reset" ? KeyRound : LockKeyhole

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_460px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Cont client</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black text-text-primary md:text-5xl">
            Cont client securizat, conectat la Supabase Auth.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            Clientii isi pot crea cont, intra cu parola, reseta parola si accesa profilul, favoritele, documentele, ofertele si programarile salvate.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <AuthProof icon={ShieldCheck} label="Token verificat" text="API-urile client cer Bearer token valid." />
            <AuthProof icon={LockKeyhole} label="Date izolate" text="RLS limiteaza randurile la utilizatorul curent." />
            <AuthProof icon={KeyRound} label="Recovery" text="Parola poate fi resetata din cont." />
          </div>
        </div>

        <div className="rounded-lg border border-bg-surface bg-bg-card p-5 shadow-card">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-black text-text-primary">{modeLabels[mode]}</h3>
              <p className="mt-1 text-sm leading-6 text-text-muted">{modeDescriptions[mode]}</p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2">
            {(Object.keys(modeLabels) as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item)
                  setError("")
                  setMessage("")
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-black transition ${mode === item ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-muted hover:border-accent hover:text-accent"}`}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <Input label="Nume complet" value={fullName} onChange={setFullName} placeholder="Nume client" />
              <Input label="Telefon" value={phone} onChange={setPhone} placeholder="+40..." />
            </div>
          )}

          <Input label="Email" value={email} onChange={setEmail} placeholder="client@email.ro" type="email" />

          {(mode === "login" || mode === "signup") && (
            <div className="mt-3">
              <Input label="Parola" value={password} onChange={setPassword} placeholder="Minim 8 caractere" type="password" />
              <p className="mt-2 text-xs text-text-muted">Parola trebuie sa aiba cel putin 8 caractere.</p>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === "login" && "Intra in cont"}
            {mode === "signup" && "Creeaza cont"}
            {mode === "reset" && "Trimite resetare"}
          </button>

          {message && <p className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm font-bold text-accent">{message}</p>}
          {error && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-500">{error}</p>}
        </div>
      </div>
    </section>
  )
}

function AuthProof({ icon: Icon, label, text }: { icon: typeof ShieldCheck; label: string; text: string }) {
  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
      <Icon className="h-5 w-5 text-accent" aria-hidden />
      <p className="mt-3 text-sm font-black text-text-primary">{label}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{text}</p>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block text-xs font-bold uppercase text-text-muted">
      {label}
      <input className="form-input mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
