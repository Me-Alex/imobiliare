'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Shield, User, AlertTriangle, ExternalLink, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAuth, type GoogleAuthError } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { PageBreadcrumb } from '@/components/layout/page-hero'
import { toast } from 'sonner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleError, setGoogleError] = useState<GoogleAuthError | null>(null)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  // Handle post-login redirect
  useEffect(() => {
    if (!user) return
    const returnPage = sessionStorage.getItem('pm-auth-return-page')
    if (returnPage) {
      sessionStorage.removeItem('pm-auth-return-page')
      sessionStorage.removeItem('pm-auth-return-property')
      navigateTo(returnPage as 'acasa' | 'proprietati' | 'analiza' | 'zone' | 'de-ce-noi' | 'calculator' | 'login' | 'admin' | 'adauga-proprietate' | 'dashboard' | 'programare-vizionare' | 'disponibilitate-staff' | 'vizionarile-mele' | 'documente' | 'evaluare' | 'profil')
      return
    }
    navigateTo('dashboard')
  }, [user, navigateTo])

  if (user) {
    navigateTo('adauga-proprietate')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setGoogleError(null)
    setIsLoading(true)

    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, fullName)

      if (result.error) {
        setError(result.error)
      } else if (isLogin) {
        toast.success('Autentificare reusita!', {
          description: 'Bine ai venit pe HQS Imobiliare.',
        })
        navigateTo('adauga-proprietate')
      } else {
        toast.success('Cont creat cu succes!', {
          description: 'Verifica email-ul pentru confirmare.',
        })
      }
    } catch {
      setError('A aparut o eroare. Te rugam incearca din nou.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    setGoogleError(null)
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setGoogleError(result.error)
        if (result.error.isProviderNotEnabled) {
          setShowSetupGuide(true)
        }
      }
    } catch {
      setGoogleError({
        code: 'exception',
        isProviderNotEnabled: false,
        message: 'Nu s-a putut conecta cu Google. Incearca din nou.',
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  const supabaseDashboardUrl = 'https://supabase.com/dashboard/project/spmapzhlcwzfrxuvxgd/auth/providers'
  const googleConsoleUrl = 'https://console.cloud.google.com/apis/credentials'

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-blob w-[500px] h-[500px] -top-48 -left-48" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 8%) 0%, transparent 70%)' }} />
        <div className="floating-blob w-[400px] h-[400px] -bottom-32 -right-32" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 6%) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 dots-pattern opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[{ label: 'Acasa', page: 'acasa' }, { label: isLogin ? 'Autentificare' : 'Inregistrare' }]}
        />

        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLogin ? 'Bine ai revenit!' : 'Creeaza Cont Nou'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin
                ? 'Autentifica-te pentru a gestiona proprietatile tale'
                : 'Inregistreaza-te pentru a publica proprietati pe HQS Imobiliare'}
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="relative flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-all hover:bg-accent hover:border-accent-foreground/20 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Se conecteaza...' : 'Continua cu Google'}
          </button>

          {/* Google Auth Error - Provider not enabled */}
          <AnimatePresence>
            {googleError && googleError.isProviderNotEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                {!showSetupGuide ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Google Login nu este inca activat
                        </p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
                          Autentificarea cu Google necesita configurare in Supabase Dashboard.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSetupGuide(true)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          <Info className="h-3.5 w-3.5" />
                          Vezi cum sa configurezi
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoogleError(null)}
                        className="text-amber-500 hover:text-amber-600 transition-colors shrink-0"
                        aria-label="Inchide"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          Configurare Google OAuth
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowSetupGuide(false); setGoogleError(null) }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Inchide ghidul"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Step 1 */}
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Mergi la Google Cloud Console
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Creeaza un proiect (sau foloseste unul existent) si activeaza &quot;Google Identity&quot; API.
                          </p>
                          <a
                            href={googleConsoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Console Cloud Google
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Creeaza OAuth 2.0 Client ID
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Credentials → Create Credentials → OAuth client ID → Web application.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Adauga Redirect URI
                          </p>
                          <div className="mt-1.5 rounded-md bg-background/80 border border-border px-3 py-2 font-mono text-[10px] break-all text-muted-foreground">
                            https://spmapzhlcwzfrxuvxgd.supabase.co/auth/v1/callback
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          4
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Activeaza Google in Supabase
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Mergi la Authentication → Providers → Google → Activeaza si adauga Client ID si Client Secret obtinute.
                          </p>
                          <a
                            href={supabaseDashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            Supabase Auth Providers
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs">
                          5
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Salveaza si testeaza
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Dupa activare, intoarce-te aici si incearca din nou butonul &quot;Continua cu Google&quot;.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20">
                      <button
                        type="button"
                        onClick={() => { setShowSetupGuide(false); setGoogleError(null) }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Am inteles, ascunde ghidul
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generic Google error (not provider-related) */}
          <AnimatePresence>
            {googleError && !googleError.isProviderNotEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{googleError.message}</span>
                  <button
                    type="button"
                    onClick={() => setGoogleError(null)}
                    className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
                    aria-label="Inchide"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              sau cu email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Nume Complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ion Popescu"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (error) setError('') }}
                    className="pl-10 h-11"
                    required={!isLogin}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplu.ro"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                  className="pl-10 h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Parola
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minim 6 caractere"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                  className="pl-10 pr-10 h-11"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ascunde parola' : 'Arata parola'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Autentifica-te' : 'Creeaza Cont'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? 'Nu ai un cont?' : 'Ai deja un cont?'}
            {' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setGoogleError(null); setShowSetupGuide(false) }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? 'Inregistreaza-te' : 'Autentifica-te'}
            </button>
          </p>

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>HQS Imobiliare</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}