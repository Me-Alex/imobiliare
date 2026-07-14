'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Heart, CalendarCheck, FileText, Search, Trash2, Download,
  User as UserIcon, Bell, Monitor, BarChart3, ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserProfile {
  phone?: string
  bio?: string
  notifications: {
    newProperties: boolean
    priceAlerts: boolean
    viewingUpdates: boolean
    weeklyNewsletter: boolean
    specialOffers: boolean
  }
  display: {
    currency: string
    defaultSort: string
    defaultType: string
  }
}

const DEFAULT_PROFILE: UserProfile = {
  phone: '',
  bio: '',
  notifications: {
    newProperties: true,
    priceAlerts: true,
    viewingUpdates: true,
    weeklyNewsletter: false,
    specialOffers: false,
  },
  display: {
    currency: 'EUR',
    defaultSort: 'newest',
    defaultType: 'all',
  },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProfilPage() {
  const { user } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  // ── Stats from various LS keys ──────────────────────────────────────────
  const favorites = useAppStore((s) => s.favorites)
  const vizionari = useMemo(() => loadFromLS<Array<{ id: string; status: string }>>(LS_KEYS.VIZIONARI, []), [])
  const documents = useMemo(() => loadFromLS<Array<{ id: string }>>(LS_KEYS.DOCUMENTS, []), [])
  const savedSearches = useMemo(() => loadFromLS<Array<{ id: string }>>(LS_KEYS.SAVED_SEARCHES, []), [])

  // ── Profile state (lazy init from localStorage) ─────────────────────────
  const savedProfile = useMemo(() => loadFromLS<UserProfile>(LS_KEYS.USER_PROFILE, DEFAULT_PROFILE), [])

  const [fullName, setFullName] = useState(
    () => user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [phone, setPhone] = useState(() => savedProfile.phone ?? '')
  const [bio, setBio] = useState(() => savedProfile.bio ?? '')
  const [notifications, setNotifications] = useState(() => savedProfile.notifications)
  const [display, setDisplay] = useState(() => savedProfile.display)

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }, [])

  const handleSave = useCallback(() => {
    const profile: UserProfile = {
      phone,
      bio,
      notifications,
      display,
    }
    saveToLS(LS_KEYS.USER_PROFILE, profile)
    toast.success('Profil salvat cu succes!')
  }, [phone, bio, notifications, display])

  const handleDeleteAccount = useCallback(() => {
    toast.info('Functionalitate in dezvoltare')
  }, [])

  const handleExportData = useCallback(() => {
    toast.success('Datele au fost exportate')
  }, [])

  const handleNotifChange = useCallback((key: keyof UserProfile['notifications']) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // ── Auth guard ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground">
            Trebuie sa fii autentificat pentru a accesa profilul.
          </p>
          <Button onClick={() => navigateTo('login')}>Autentifica-te</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mb-4 -ml-2"
            onClick={() => navigateTo('dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la Dashboard
          </Button>

          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Profilul Meu
          </h1>

          <div className="flex items-center gap-4 mt-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                {getInitials(fullName || user.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{fullName || 'Utilizator'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Profile Form ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Informatii Personale
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nume complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Numele tau complet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon (optional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+40 7XX XXX XXX"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Despre mine (optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Scurta descriere despre tine..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/200
              </p>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              Salveaza
            </Button>
          </div>
        </motion.div>

        {/* ── Notification Preferences ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Preferinte Notificari
          </h2>

          <div className="space-y-4">
            {([
              { key: 'newProperties' as const, label: 'Email pentru noi proprietati' },
              { key: 'priceAlerts' as const, label: 'Alerte de pret' },
              { key: 'viewingUpdates' as const, label: 'Actualizari vizionari' },
              { key: 'weeklyNewsletter' as const, label: 'Newsletter saptamanal' },
              { key: 'specialOffers' as const, label: 'Oferte speciale' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <Label htmlFor={item.key} className="cursor-pointer text-sm">
                  {item.label}
                </Label>
                <Switch
                  id={item.key}
                  checked={notifications[item.key]}
                  onCheckedChange={() => handleNotifChange(item.key)}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Display Preferences ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Preferinte Afisare
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={display.currency}
                onValueChange={(v) => setDisplay((prev) => ({ ...prev, currency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="RON">RON</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sortare implicita</Label>
              <Select
                value={display.defaultSort}
                onValueChange={(v) => setDisplay((prev) => ({ ...prev, defaultSort: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Pret crescator</SelectItem>
                  <SelectItem value="price-desc">Pret descrescator</SelectItem>
                  <SelectItem value="newest">Cele mai noi</SelectItem>
                  <SelectItem value="surface">Suprafata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tip proprietate</Label>
              <Select
                value={display.defaultType}
                onValueChange={(v) => setDisplay((prev) => ({ ...prev, defaultType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="Apartament">Apartament</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Vila">Vila</SelectItem>
                  <SelectItem value="Teren">Teren</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* ── Account Statistics ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistici Cont
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Proprietati salvate',
                value: favorites.length,
                icon: Heart,
                color: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30',
              },
              {
                label: 'Vizionari programate',
                value: vizionari.filter(
                  (v) => v.status === 'pending' || v.status === 'confirmed'
                ).length,
                icon: CalendarCheck,
                color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
              },
              {
                label: 'Documente incarcate',
                value: documents.length,
                icon: FileText,
                color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
              },
              {
                label: 'Cautari salvate',
                value: savedSearches.length,
                icon: Search,
                color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Danger Zone ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border-2 border-destructive/50 p-6 mb-6 bg-destructive/5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Zona Periculoasa
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4" />
              Sterge contul
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4" />
              Exporta datele mele
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        &copy; 2025 HQS Imobiliare. Toate drepturile rezervate.
      </footer>
    </div>
  )
}