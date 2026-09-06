'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { normalizeAccountRole, type AccountRole } from '@/lib/account-roles'
import { getAuthCallbackUrl, ensureAuthReturnTarget } from '@/lib/auth-return'
import { authErrorMessage, observeAuthSession } from '@/lib/auth-session'

export interface GoogleAuthError {
  code: string
  isProviderNotEnabled: boolean
  message: string
}

export interface AccountProfile {
  id: string
  email: string
  fullName: string
  phone: string
  bio: string
  avatarUrl: string
  companyName: string
  licenseNumber: string
  role: AccountRole
  isActive: boolean
  notificationPreferences: Record<string, boolean>
  displayPreferences: Record<string, string>
}

export interface AccountProfileUpdate {
  fullName?: string
  phone?: string
  bio?: string
  avatarUrl?: string
  companyName?: string
  licenseNumber?: string
  role?: 'CLIENT' | 'OWNER'
  notificationPreferences?: Record<string, boolean>
  displayPreferences?: Record<string, string>
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AccountProfile | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string, role?: 'CLIENT' | 'OWNER') => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signInWithGoogle: () => Promise<{ error: GoogleAuthError | null }>
  signOut: () => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: AccountProfileUpdate) => Promise<{ error: string | null }>
  hasRole: (...roles: AccountRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PROFILE_FETCH_FALLBACK_MS = 8_000

function fallbackProfile(user: User): AccountProfile {
  return {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Utilizator',
    phone: '',
    bio: '',
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    companyName: '',
    licenseNumber: '',
    role: 'CLIENT',
    isActive: true,
    notificationPreferences: {},
    displayPreferences: {},
  }
}

function mapProfile(user: User, row: Record<string, unknown>): AccountProfile {
  const defaults = fallbackProfile(user)
  return {
    ...defaults,
    id: String(row.id || user.id),
    email: String(row.email || defaults.email),
    fullName: String(row.full_name || row.name || defaults.fullName),
    phone: String(row.phone || ''),
    bio: String(row.bio || ''),
    avatarUrl: String(row.avatar_url || defaults.avatarUrl),
    companyName: String(row.company_name || ''),
    licenseNumber: String(row.license_number || ''),
    role: normalizeAccountRole(row.role),
    isActive: row.is_active !== false,
    notificationPreferences: (row.notification_preferences as Record<string, boolean> | null) || {},
    displayPreferences: (row.display_preferences as Record<string, string> | null) || {},
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const profileRequestRef = useRef(0)
  const activeUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    const applySession = (currentSession: Session | null) => {
      if (!mounted) return

      const nextUser = currentSession?.user ?? null
      const identityChanged = activeUserIdRef.current !== nextUser?.id
      if (identityChanged) {
        activeUserIdRef.current = nextUser?.id ?? null
        profileRequestRef.current += 1
        setProfile(null)
        setProfileError(null)
        setProfileLoading(Boolean(nextUser))
      } else if (!nextUser) {
        setProfile(null)
        setProfileLoading(false)
      }

      setSession(currentSession)
      setUser(nextUser)
      setAuthLoading(false)
    }

    const unsubscribe = observeAuthSession(supabase.auth, applySession, () => {
      if (mounted) setAuthLoading(false)
    })

    return () => {
      mounted = false
      profileRequestRef.current += 1
      unsubscribe()
    }
  }, [])

  const fetchProfile = useCallback(async (currentUser: User) => {
    const requestId = ++profileRequestRef.current
    const isCurrentRequest = () =>
      profileRequestRef.current === requestId && activeUserIdRef.current === currentUser.id

    setProfileLoading(true)
    setProfileError(null)
    const reportProfileFailure = () => {
      if (!isCurrentRequest()) return
      setProfile(null)
      setProfileError('Profilul nu a putut fi verificat. Încearcă din nou pentru a accesa contul.')
      setProfileLoading(false)
    }
    const fallbackTimer = window.setTimeout(() => {
      reportProfileFailure()
    }, PROFILE_FETCH_FALLBACK_MS)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,name,full_name,phone,bio,avatar_url,company_name,license_number,role,is_active,notification_preferences,display_preferences')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error || !data) {
        reportProfileFailure()
        return
      }

      if (isCurrentRequest()) {
        setProfile(mapProfile(currentUser, data as Record<string, unknown>))
        setProfileError(null)
      }
    } catch {
      reportProfileFailure()
    } finally {
      window.clearTimeout(fallbackTimer)
      if (isCurrentRequest()) setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const frame = requestAnimationFrame(() => void fetchProfile(user))
    return () => cancelAnimationFrame(frame)
  }, [user, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user)
  }, [user, fetchProfile])

  const updateProfile = useCallback(async (updates: AccountProfileUpdate) => {
    if (!user) return { error: 'Trebuie să fii autentificat.' }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.fullName !== undefined) {
      payload.full_name = updates.fullName.trim()
      payload.name = updates.fullName.trim()
    }
    if (updates.phone !== undefined) payload.phone = updates.phone.trim() || null
    if (updates.bio !== undefined) payload.bio = updates.bio.trim() || null
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl.trim() || null
    if (updates.companyName !== undefined) payload.company_name = updates.companyName.trim() || null
    if (updates.licenseNumber !== undefined) payload.license_number = updates.licenseNumber.trim() || null
    if (updates.role !== undefined) payload.role = updates.role
    if (updates.notificationPreferences !== undefined) payload.notification_preferences = updates.notificationPreferences
    if (updates.displayPreferences !== undefined) payload.display_preferences = updates.displayPreferences

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select('id,email,name,full_name,phone,bio,avatar_url,company_name,license_number,role,is_active,notification_preferences,display_preferences')
        .single()

      if (error) return { error: error.message }
      if (activeUserIdRef.current !== user.id) return { error: 'Sesiunea s-a schimbat. Încearcă din nou.' }
      profileRequestRef.current += 1
      setProfile(mapProfile(user, data as Record<string, unknown>))
      return { error: null }
    } catch {
      return { error: 'Profilul nu a putut fi actualizat.' }
    }
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Autentificarea nu este disponibilă momentan.' }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      return { error: error ? authErrorMessage(error) : null }
    } catch {
      return { error: 'Nu s-a putut conecta la serviciul de autentificare.' }
    }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName?: string,
    role: 'CLIENT' | 'OWNER' = 'CLIENT',
  ) => {
    if (!isSupabaseConfigured) return { error: 'Autentificarea nu este disponibilă momentan.' }
    try {
      ensureAuthReturnTarget('dashboard')
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl('email', window.location.origin),
          data: {
            full_name: fullName || email.split('@')[0],
            account_type: role,
          },
        },
      })
      return { error: error ? authErrorMessage(error) : null, needsEmailConfirmation: !error && !data.session }
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
          message: 'Autentificarea nu este configurată corect pentru această versiune a aplicației.',
        },
      }
    }

    try {
      ensureAuthReturnTarget('dashboard')
      const callbackUrl = getAuthCallbackUrl('google', window.location.origin)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        const message = error.message || ''
        const isProviderNotEnabled = message.includes('provider is not enabled') || message.includes('Unsupported provider')
        return {
          error: {
            code: error.code || 'unknown',
            isProviderNotEnabled,
            message: isProviderNotEnabled
              ? 'Autentificarea Google nu este încă configurată. Urmează pașii de mai jos.'
              : message || 'Eroare la conectarea cu Google.',
          },
        }
      }

      if (!data.url) {
        return {
          error: {
            code: 'missing_redirect_url',
            isProviderNotEnabled: false,
            message: 'Google nu a returnat o adresă de autentificare validă.',
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
          message: 'Nu s-a putut conecta cu Google. Încearcă din nou.',
        },
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      return { error: error ? 'Deconectarea nu a reușit. Verifică conexiunea și încearcă din nou.' : null }
    } catch {
      return { error: 'Deconectarea nu a reușit. Verifică conexiunea și încearcă din nou.' }
    }
  }, [])

  const hasRole = useCallback((...roles: AccountRole[]) => {
    return Boolean(!profileError && profile && profile.isActive && roles.includes(profile.role))
  }, [profile, profileError])

  const loading = authLoading || Boolean(user && (profileLoading || (!profile && !profileError)))

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      profileError,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshProfile,
      updateProfile,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
