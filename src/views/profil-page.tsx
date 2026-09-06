'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useTheme } from 'next-themes'
import { ArrowRight, Bell, Check, Download, Loader2, Monitor, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageState } from '@/components/ui/page-state'
import { useAuth, type AccountProfile } from '@/contexts/auth-context'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { ACCOUNT_ROLE_DEFINITIONS } from '@/lib/account-roles'
import { getAccountMenuItems } from '@/lib/navigation-config'
import { cn } from '@/lib/utils'

const NOTIFICATIONS = [
  { key: 'newProperties', label: 'Proprietăți noi', description: 'Noutăți despre anunțurile disponibile.', defaultValue: true },
  { key: 'priceAlerts', label: 'Schimbări de preț', description: 'Actualizări pentru alertele tale de preț.', defaultValue: true },
  { key: 'viewingUpdates', label: 'Programările mele', description: 'Confirmări și modificări ale vizionărilor.', defaultValue: true },
  { key: 'weeklyNewsletter', label: 'Rezumat săptămânal', description: 'Noutăți și informații despre piața imobiliară.', defaultValue: false },
  { key: 'specialOffers', label: 'Oferte speciale', description: 'Mesaje despre promoțiile agenției.', defaultValue: false },
] as const

function profileDraft(profile: AccountProfile) {
  return {
    fullName: profile.fullName, phone: profile.phone, bio: profile.bio,
    companyName: profile.companyName, licenseNumber: profile.licenseNumber,
    notificationPreferences: {
      ...Object.fromEntries(NOTIFICATIONS.map(item => [item.key, item.defaultValue])),
      ...profile.notificationPreferences,
    },
  }
}

export function ProfilPage() {
  const { user, profile, loading } = useAuth()
  const navigateTo = useAppStore(state => state.navigateTo)
  if (loading) return <PageState tone="loading" title="Încărcăm profilul" />
  if (!user || !profile) return <PageState title="Profilul tău, într-un singur loc" description="Autentifică-te pentru a edita datele și preferințele contului."
    action={<Button onClick={() => navigateTo('login')}>Intră în cont</Button>} />
  return <ProfileSettings key={profile.id} profile={profile} />
}

function ProfileSettings({ profile }: { profile: AccountProfile }) {
  const { updateProfile } = useAuth()
  const navigateTo = useAppStore(state => state.navigateTo)
  const { theme, setTheme } = useTheme()
  const [draft, setDraft] = useState(() => profileDraft(profile))
  const [saved, setSaved] = useState(() => profileDraft(profile))
  const [section, setSection] = useState('personal')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [pendingPage, setPendingPage] = useState<PageKey | null>(null)
  const [roleDialog, setRoleDialog] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [changingRole, setChangingRole] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const roleDefinition = ACCOUNT_ROLE_DEFINITIONS[profile.role]
  const professional = profile.role === 'OWNER' || profile.role === 'AGENT'
  const navigation = getAccountMenuItems(profile.role).filter(item => item.page !== 'profil')
  const nextRole = profile.role === 'CLIENT' ? 'OWNER' : 'CLIENT'
  const nextRoleLabel = ACCOUNT_ROLE_DEFINITIONS[nextRole].label

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const changeField = (key: 'fullName' | 'phone' | 'bio' | 'companyName' | 'licenseNumber', value: string) => {
    setDraft(current => ({ ...current, [key]: value }))
    setSaveError('')
    setSavedMessage('')
  }
  const goTo = (page: PageKey) => {
    if (dirty) setPendingPage(page)
    else navigateTo(page)
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving || !dirty) return
    if (!draft.fullName.trim()) { setSection('personal'); setSaveError('Completează numele înainte de a salva.'); return }
    const snapshot = { ...draft, fullName: draft.fullName.trim(), phone: draft.phone.trim() }
    setSaving(true)
    setSaveError('')
    try {
      const { error } = await updateProfile(snapshot)
      if (error) { setSaveError('Nu am putut salva modificările. Datele tale sunt încă aici; încearcă din nou.'); return }
      setDraft(snapshot)
      setSaved(snapshot)
      setSavedMessage('Modificările au fost salvate.')
    } catch { setSaveError('Nu am putut salva modificările. Verifică conexiunea și încearcă din nou.') }
    finally { setSaving(false) }
  }
  const switchRole = async () => {
    if (changingRole) return
    setChangingRole(true)
    setRoleError('')
    try {
      const { error } = await updateProfile({ role: nextRole })
      if (error) { setRoleError('Tipul contului nu a putut fi schimbat. Încearcă din nou.'); return }
      setRoleDialog(false)
    } catch { setRoleError('Verifică conexiunea și încearcă din nou.') }
    finally { setChangingRole(false) }
  }
  const exportProfile = () => {
    const blob = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hqs-profilul-meu.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-semibold tracking-tight">Profilul meu</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Datele tale, preferințele și accesul la tot ce ai de făcut.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11 gap-2" disabled={saving} onClick={() => goTo('dashboard')}>Prezentarea contului <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          <Button variant="ghost" className="min-h-11 lg:hidden" asChild><a href="#profile-navigation-title">Paginile contului</a></Button>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <div className="mb-6 flex items-center gap-4 border-b pb-6">
            <Avatar className="h-14 w-14 shrink-0"><AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {profile.fullName.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback></Avatar>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-lg font-semibold">{profile.fullName}</p><Badge variant="secondary">{roleDefinition.label}</Badge></div>
              <p className="mt-1 break-all text-sm text-muted-foreground">{profile.email}</p></div>
          </div>

          <form onSubmit={save} noValidate aria-label="Setările profilului">
            <Tabs value={section} onValueChange={setSection} className="gap-6">
              <TabsList aria-label="Secțiunile profilului" className="grid h-auto w-full grid-cols-3 gap-1 p-1">
                <TabsTrigger value="personal" className="min-h-12 gap-2 whitespace-normal px-2"><UserRound aria-hidden="true" className="hidden sm:block" />Date personale</TabsTrigger>
                <TabsTrigger value="preferences" className="min-h-12 gap-2"><Bell aria-hidden="true" className="hidden sm:block" />Preferințe</TabsTrigger>
                <TabsTrigger value="account" className="min-h-12 gap-2"><ShieldCheck aria-hidden="true" className="hidden sm:block" />Cont și date</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="rounded-xl border bg-card p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Cum te putem contacta</h2>
                <p className="mt-2 text-sm text-muted-foreground">Păstrează datele actualizate pentru discuțiile cu agenția și programările tale.</p>
                <fieldset disabled={saving} className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="profile-name">Nume complet <span className="text-muted-foreground">(obligatoriu)</span></Label>
                    <Input id="profile-name" autoComplete="name" value={draft.fullName} onChange={event => changeField('fullName', event.target.value)} maxLength={120} required aria-invalid={Boolean(saveError && !draft.fullName.trim())} className="min-h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="profile-phone">Telefon <span className="text-muted-foreground">(opțional)</span></Label>
                    <Input id="profile-phone" type="tel" autoComplete="tel" value={draft.phone} onChange={event => changeField('phone', event.target.value)} placeholder="+40 7XX XXX XXX" maxLength={40} className="min-h-11" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-email">Adresa de e-mail</Label>
                    <Input id="profile-email" type="email" value={profile.email} readOnly aria-describedby="profile-email-help" className="min-h-11 bg-muted/40" />
                    <p id="profile-email-help" className="text-xs text-muted-foreground">Adresa folosită la autentificare. Nu poate fi modificată din această pagină.</p></div>
                  {professional && <>
                    <div className="space-y-2"><Label htmlFor="profile-company">{profile.role === 'AGENT' ? 'Agenție / companie' : 'Companie (opțional)'}</Label>
                      <Input id="profile-company" autoComplete="organization" value={draft.companyName} onChange={event => changeField('companyName', event.target.value)} maxLength={160} className="min-h-11" /></div>
                    <div className="space-y-2"><Label htmlFor="profile-license">{profile.role === 'AGENT' ? 'Cod agent / licență' : 'Cod fiscal (opțional)'}</Label>
                      <Input id="profile-license" value={draft.licenseNumber} onChange={event => changeField('licenseNumber', event.target.value)} maxLength={80} className="min-h-11" /></div>
                  </>}
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-bio">Despre tine <span className="text-muted-foreground">(opțional)</span></Label>
                    <Textarea id="profile-bio" value={draft.bio} onChange={event => changeField('bio', event.target.value)} maxLength={400} rows={4} aria-describedby="profile-bio-help" placeholder="Câteva cuvinte despre tine sau despre ce cauți." />
                    <p id="profile-bio-help" className="text-right text-xs tabular-nums text-muted-foreground">{draft.bio.length} / 400 caractere</p></div>
                </fieldset>
              </TabsContent>

              <TabsContent value="preferences" className="rounded-xl border bg-card p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Preferințele tale</h2>
                <fieldset className="mt-6" disabled={saving}><legend className="font-medium">Aspectul aplicației</legend>
                  <p className="mt-1 text-sm text-muted-foreground">Se aplică imediat în acest browser.</p>
                  <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Aspectul aplicației">
                    {([{ value: 'light', label: 'Luminos', icon: Sun }, { value: 'dark', label: 'Întunecat', icon: Moon }, { value: 'system', label: 'Automat', icon: Monitor }] as const).map(item => (
                      <Button key={item.value} type="button" variant="outline" aria-pressed={theme === item.value} onClick={() => setTheme(item.value)}
                        className={cn('min-h-12 flex-col gap-1 px-1 py-2 text-xs sm:flex-row sm:text-sm', theme === item.value && 'border-primary bg-primary/5 text-primary')}><item.icon className="h-4 w-4" aria-hidden="true" />{item.label}</Button>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={saving} className="mt-8 border-t pt-6"><legend className="float-left w-full font-medium">Mesajele pe care le preferi</legend>
                  <p className="clear-both pt-1 text-sm text-muted-foreground">Alege categoriile, apoi salvează modificările.</p>
                  <div className="mt-4 divide-y">{NOTIFICATIONS.map(item => <div key={item.key} className="flex items-center justify-between gap-4 py-4">
                    <Label htmlFor={`profile-${item.key}`} className="block flex-1 cursor-pointer space-y-1 py-1"><span className="block text-sm font-medium">{item.label}</span><span className="block text-sm font-normal leading-relaxed text-muted-foreground">{item.description}</span></Label>
                    <Switch id={`profile-${item.key}`} checked={Boolean(draft.notificationPreferences[item.key])}
                      onCheckedChange={checked => { setDraft(current => ({ ...current, notificationPreferences: { ...current.notificationPreferences, [item.key]: checked } })); setSavedMessage('') }} />
                  </div>)}</div>
                </fieldset>
              </TabsContent>

              <TabsContent value="account" className="rounded-xl border bg-card p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Contul și datele tale</h2>
                <div className="mt-6"><h3 className="font-medium">Tip de cont: {roleDefinition.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{roleDefinition.description}</p>
                  {(profile.role === 'CLIENT' || profile.role === 'OWNER') ? <>
                    <p className="mt-3 text-sm text-muted-foreground">{profile.role === 'CLIENT' ? 'Vrei să publici un anunț? Treci la contul Proprietar.' : 'Vrei să te concentrezi pe căutarea unei locuințe? Poți trece la contul Client.'}</p>
                    <Button type="button" variant="outline" className="mt-4 min-h-11" disabled={dirty || saving} onClick={() => { setRoleError(''); setRoleDialog(true) }}>Schimbă în {nextRoleLabel}</Button>
                    {dirty && <p className="mt-2 text-xs text-muted-foreground">Salvează sau anulează modificările înainte de a schimba tipul contului.</p>}
                  </> : <p className="mt-3 text-sm text-muted-foreground">Rolul {roleDefinition.label} este gestionat de administratorul platformei.</p>}
                </div>
                <div className="mt-8 border-t pt-6"><h3 className="font-medium">O copie a profilului tău</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Descarcă datele de contact și preferințele salvate, într-un fișier JSON. Documentele și anunțurile nu sunt incluse.</p>
                  <Button type="button" variant="outline" className="mt-4 min-h-11 gap-2" onClick={exportProfile}><Download className="h-4 w-4" aria-hidden="true" />Descarcă profilul</Button></div>
              </TabsContent>
            </Tabs>

            <div className={cn('z-10 mt-5 rounded-xl border bg-background p-4', dirty && 'sticky bottom-20 sm:bottom-3')}>
              {saveError && <p role="alert" className="mb-3 text-sm text-destructive">{saveError}</p>}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">{!dirty && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}{saving ? 'Salvăm modificările…' : dirty ? 'Ai modificări nesalvate.' : savedMessage || 'Datele tale sunt actualizate.'}</p>
                <div className="flex gap-2">{dirty && <Button type="button" variant="ghost" disabled={saving} className="min-h-11" onClick={() => { setDraft(saved); setSaveError(''); setSavedMessage('Modificările au fost anulate.') }}>Anulează</Button>}
                  <Button type="submit" disabled={saving || !dirty} className="min-h-11 flex-1 gap-2 sm:flex-none">{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Salvează modificările</Button></div>
              </div>
            </div>
          </form>
        </div>

        <aside className="min-w-0 rounded-xl border bg-muted/30 p-5" aria-labelledby="profile-navigation-title">
          <h2 id="profile-navigation-title" className="scroll-mt-36 text-lg font-semibold">Unde vrei să mergi?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Acces direct la paginile contului tău.</p>
          <nav aria-label="Navigare din profil" className="mt-4 divide-y">{navigation.map(item => <button key={item.page} type="button" disabled={saving} onClick={() => goTo(item.page)} className="flex min-h-16 w-full items-center gap-3 rounded-md py-3 text-left transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
            <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.description}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>)}</nav>
        </aside>
      </div>

      <Dialog open={pendingPage !== null} onOpenChange={open => { if (!open) setPendingPage(null) }}><DialogContent>
        <DialogHeader><DialogTitle>Pleci fără să salvezi?</DialogTitle><DialogDescription>Ai modificări în profil care nu au fost salvate. Rămâi aici pentru a le salva sau continuă fără ele.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setPendingPage(null)}>Rămân în profil</Button><Button onClick={() => { const page = pendingPage; setPendingPage(null); if (page) navigateTo(page) }}>Continuă fără salvare</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={roleDialog} onOpenChange={open => { if (!changingRole) setRoleDialog(open) }}><DialogContent>
        <DialogHeader><DialogTitle>Treci la contul {nextRoleLabel}?</DialogTitle><DialogDescription>{ACCOUNT_ROLE_DEFINITIONS[nextRole].description} Datele profilului se păstrează. Paginile disponibile în cont se vor actualiza.</DialogDescription></DialogHeader>
        {roleError && <p role="alert" className="text-sm text-destructive">{roleError}</p>}
        <DialogFooter><Button variant="outline" disabled={changingRole} onClick={() => setRoleDialog(false)}>Păstrează contul actual</Button><Button disabled={changingRole} onClick={switchRole}>{changingRole ? 'Se schimbă…' : `Confirmă contul ${nextRoleLabel}`}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
