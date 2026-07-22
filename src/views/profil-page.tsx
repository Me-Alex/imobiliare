'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  Download,
  Monitor,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { loadFromLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import { loadManagedPropertyCache } from '@/lib/managed-properties'
import {
  ACCOUNT_ROLE_DEFINITIONS,
  type AccountRole,
} from '@/lib/account-roles'
import type { UploadedDocument, Vizionare } from '@/lib/types'

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  newProperties: true,
  priceAlerts: true,
  viewingUpdates: true,
  weeklyNewsletter: false,
  specialOffers: false,
}

const DEFAULT_DISPLAY: Record<string, string> = {
  currency: 'EUR',
  defaultSort: 'newest',
  defaultType: 'all',
}

const NOTIFICATION_LABELS: Record<string, string> = {
  newProperties: 'Email pentru proprietati noi',
  priceAlerts: 'Alerte de pret',
  viewingUpdates: 'Actualizari vizionari',
  weeklyNewsletter: 'Newsletter saptamanal',
  specialOffers: 'Oferte speciale',
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function ProfilPage() {
  const { user, profile, loading, updateProfile } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const favorites = useAppStore((state) => state.favorites)

  const properties = useMemo(() => loadManagedPropertyCache(user?.id), [user?.id])
  const vizionari = useMemo(() => loadFromLS<Vizionare[]>(LS_KEYS.VIZIONARI, []), [])
  const documents = useMemo(() => loadFromLS<UploadedDocument[]>(LS_KEYS.DOCUMENTS, []), [])
  const savedSearches = useMemo(() => loadFromLS<Array<{ id: string }>>(LS_KEYS.SAVED_SEARCHES, []), [])

  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [display, setDisplay] = useState(DEFAULT_DISPLAY)
  const [saving, setSaving] = useState(false)
  const [changingRole, setChangingRole] = useState(false)

  if (profile && loadedProfileId !== profile.id) {
    setLoadedProfileId(profile.id)
    setFullName(profile.fullName)
    setPhone(profile.phone)
    setBio(profile.bio)
    setCompanyName(profile.companyName)
    setLicenseNumber(profile.licenseNumber)
    setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notificationPreferences })
    setDisplay({ ...DEFAULT_DISPLAY, ...profile.displayPreferences })
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    const { error } = await updateProfile({
      fullName,
      phone,
      bio,
      companyName,
      licenseNumber,
      notificationPreferences: notifications,
      displayPreferences: display,
    })
    setSaving(false)

    if (error) {
      toast.error('Profilul nu a putut fi salvat', { description: error })
      return
    }
    toast.success('Profil salvat in Supabase')
  }, [bio, companyName, display, fullName, licenseNumber, notifications, phone, updateProfile])

  const switchClientOwnerRole = useCallback(async () => {
    if (!profile || !['CLIENT', 'OWNER'].includes(profile.role)) return
    const nextRole = profile.role === 'CLIENT' ? 'OWNER' : 'CLIENT'
    setChangingRole(true)
    const { error } = await updateProfile({ role: nextRole })
    setChangingRole(false)

    if (error) {
      toast.error('Tipul contului nu a putut fi schimbat', { description: error })
      return
    }
    toast.success(nextRole === 'OWNER' ? 'Profilul Proprietar este activ' : 'Profilul Client este activ')
    navigateTo('dashboard')
  }, [navigateTo, profile, updateProfile])

  const handleExport = useCallback(() => {
    if (!profile || typeof window === 'undefined') return
    const exportData = {
      profile,
      favorites: favorites.length,
      properties,
      vizionari,
      documents,
      savedSearches,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hqs-date-cont.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Datele contului au fost exportate')
  }, [documents, favorites.length, profile, properties, savedSearches, vizionari])

  if (loading) return <div className="min-h-[calc(100vh-10rem)] animate-pulse bg-muted/10" />

  if (!user || !profile) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12 text-center">
        <div className="space-y-4">
          <UserIcon className="mx-auto h-10 w-10 text-primary" />
          <h2 className="text-xl font-bold">Autentifica-te</h2>
          <Button onClick={() => navigateTo('login')}>Autentifica-te</Button>
        </div>
      </div>
    )
  }

  const role = profile.role
  const roleDefinition = ACCOUNT_ROLE_DEFINITIONS[role]
  const showProfessionalFields = role === 'OWNER' || role === 'AGENT'
  const activeVizionari = vizionari.filter((item) => ['pending', 'confirmed', 'checked_in'].includes(item.status)).length

  const stats = role === 'CLIENT'
    ? [
        ['Favorite', favorites.length],
        ['Vizionari active', activeVizionari],
        ['Documente', documents.length],
        ['Cautari salvate', savedSearches.length],
      ]
    : role === 'OWNER'
      ? [
          ['Proprietati proprii', properties.length],
          ['Solicitari active', activeVizionari],
          ['Documente', documents.length],
          ['Rapoarte', 0],
        ]
      : role === 'AGENT'
        ? [
            ['Proprietati alocate', properties.length],
            ['Vizionari', activeVizionari],
            ['Documente clienti', documents.length],
            ['Lead-uri', 0],
          ]
        : [
            ['Proprietati', properties.length],
            ['Vizionari', vizionari.length],
            ['Documente', documents.length],
            ['Module cont', 4],
          ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 gap-2" onClick={() => navigateTo('dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Inapoi la Dashboard
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {initials(profile.fullName || profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold lg:text-3xl">{profile.fullName}</h1>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{roleDefinition.label}</Badge>
                {profile.isActive && <Badge variant="outline" className="gap-1 text-emerald-600"><BadgeCheck className="h-3 w-3" /> Activ</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-6 rounded-2xl p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5 text-primary" /> {roleDefinition.title}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{roleDefinition.description}</p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {roleDefinition.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
            {(role === 'CLIENT' || role === 'OWNER') && (
              <Button variant="outline" onClick={switchClientOwnerRole} disabled={changingRole}>
                {role === 'CLIENT' ? 'Activeaza profil Proprietar' : 'Foloseste profil Client'}
              </Button>
            )}
          </div>
        </motion.section>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-6 rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <UserIcon className="h-5 w-5 text-primary" /> Informatii personale
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nume complet</Label>
              <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+40 7XX XXX XXX" />
            </div>
            {showProfessionalFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">{role === 'AGENT' ? 'Agentie / companie' : 'Companie (optional)'}</Label>
                  <Input id="companyName" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">{role === 'AGENT' ? 'Cod agent / licenta' : 'Cod fiscal (optional)'}</Label>
                  <Input id="licenseNumber" value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Despre mine</Label>
              <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value.slice(0, 400))} rows={4} />
              <p className="text-right text-xs text-muted-foreground">{bio.length}/400</p>
            </div>
          </div>
        </motion.section>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-5 w-5 text-primary" /> Notificari
            </h2>
            <div className="space-y-4">
              {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={key} className="text-sm">{NOTIFICATION_LABELS[key]}</Label>
                  <Switch
                    id={key}
                    checked={Boolean(notifications[key])}
                    onCheckedChange={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Monitor className="h-5 w-5 text-primary" /> Afisare
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={display.currency} onValueChange={(value) => setDisplay((current) => ({ ...current, currency: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="RON">RON</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sortare implicita</Label>
                <Select value={display.defaultSort} onValueChange={(value) => setDisplay((current) => ({ ...current, defaultSort: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Cele mai noi</SelectItem>
                    <SelectItem value="price-asc">Pret crescator</SelectItem>
                    <SelectItem value="price-desc">Pret descrescator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <BadgeCheck className="h-4 w-4" /> {saving ? 'Se salveaza...' : 'Salveaza profilul'}
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Exporta datele mele
          </Button>
        </div>

        {role === 'AGENT' && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-muted-foreground">
            <BriefcaseBusiness className="mr-2 inline h-4 w-4 text-blue-600" />
            Rolul Agent si datele profesionale sunt administrate de un administrator.
          </div>
        )}
        {role === 'ADMIN' && (
          <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-muted-foreground">
            <Building2 className="mr-2 inline h-4 w-4 text-violet-600" />
            Rolul Administrator nu poate fi schimbat din profilul public.
          </div>
        )}
      </div>
    </div>
  )
}
