'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Building2, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Shield, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, user } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  // Redirect if already logged in
  if (user) {
    navigateTo('admin')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result.error) {
        setError(result.error)
      } else if (isLogin) {
        toast.success('Autentificare reusita!', {
          description: 'Bine ai venit in panoul de administrare.',
        })
        navigateTo('admin')
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
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Home className="h-4 w-4" />
          <span>Acasa</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{isLogin ? 'Autentificare' : 'Inregistrare'}</span>
        </nav>

        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLogin ? 'Autentificare' : 'Creeaza Cont'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin
                ? 'Acceseaza panoul de administrare PropMarket'
                : 'Inregistreaza-te pentru a gestiona proprietatile'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@propmarket.ro"
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
                  placeholder="••••••••"
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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

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

          <Separator className="my-6" />

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'Nu ai un cont?' : 'Ai deja un cont?'}
            {' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? 'Inregistreaza-te' : 'Autentifica-te'}
            </button>
          </p>

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>PropMarket Admin</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}