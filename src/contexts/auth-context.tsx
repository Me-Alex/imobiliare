'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export interface GoogleAuthError {
  code: string
  isProviderNotEnabled: boolean
  message: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: GoogleAuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    }).catch(() => {
      // Supabase not configured — treat as logged out
      setLoading(false)
    })

    let subscription: { unsubscribe: () => void } | null = null
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)
      })
      subscription = data.subscription
    } catch {
      // Supabase not configured
    }

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    } catch {
      return { error: 'Nu s-a putut conecta la serviciul de autentificare.' }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] },
        },
      })
      return { error: error?.message ?? null }
    } catch {
      return { error: 'Nu s-a putut conecta la serviciul de autentificare.' }
    }
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<{ error: GoogleAuthError | null }> => {
    if (!isSupabaseConfigured || typeof window === 'undefined') {
      return {
        error: {
          code: 'missing_configuration',
          isProviderNotEnabled: false,
          message: 'Autentificarea nu este configurata corect pentru acest deployment.',
        },
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        const msg = error.message || ''
        const isProviderNotEnabled = msg.includes('provider is not enabled') || msg.includes('Unsupported provider')
        return {
          error: {
            code: error.code || 'unknown',
            isProviderNotEnabled,
            message: isProviderNotEnabled
              ? 'Autentificarea Google nu este inca configurata. Urmeaza pasii de mai jos.'
              : msg || 'Eroare la conectarea cu Google.',
          },
        }
      }

      if (!data.url) {
        return {
          error: {
            code: 'missing_redirect_url',
            isProviderNotEnabled: false,
            message: 'Google nu a returnat o adresa de autentificare valida.',
          },
        }
      }

      window.location.assign(data.url)

      return { error: null }
    } catch {
      return {
        error: {
          code: 'exception',
          isProviderNotEnabled: false,
          message: 'Nu s-a putut conecta cu Google. Incearca din nou.',
        },
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
