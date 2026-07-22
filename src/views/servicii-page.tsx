'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  Camera,
  CheckCircle2,
  FileCheck2,
  House,
  Loader2,
  Megaphone,
  Ruler,
  Rotate3D,
  Send,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHero } from '@/components/layout/page-hero'
import { useAppStore } from '@/store/use-app-store'
import { isValidEmail } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ServiceDefinition = {
  id: string
  title: string
  shortTitle: string
  description: string
  category: 'Strategie' | 'Prezentare' | 'Promovare' | 'Tranzacție'
  icon: LucideIcon
  outcomes: string[]
  featured?: boolean
  directPage?: 'evaluare'
}

type ServicePackage = {
  id: string
  name: string
  description: string
  items: string[]
  primaryServiceId: string
  featured?: boolean
}

type ServiceRequestSelection =
  | { kind: 'service'; service: ServiceDefinition }
  | { kind: 'package'; package: ServicePackage; primaryService: ServiceDefinition }

const SERVICES: ServiceDefinition[] = [
  {
    id: 'evaluare',
    title: 'Evaluare orientativă a proprietății',
    shortTitle: 'Evaluare proprietate',
    description: 'Primești rapid un interval orientativ de piață, bazat pe caracteristicile proprietății și date comparabile.',
    category: 'Strategie',
    icon: BadgeDollarSign,
    outcomes: ['Estimare AI rapidă', 'Factori care influențează prețul', 'Punct de pornire pentru listare'],
    featured: true,
    directPage: 'evaluare',
  },
  {
    id: 'fotografie',
    title: 'Fotografie imobiliară profesională',
    shortTitle: 'Fotografie profesională',
    description: 'Un set coerent de imagini luminoase și corect încadrate, pregătite pentru anunț și promovare.',
    category: 'Prezentare',
    icon: Camera,
    outcomes: ['Pregătirea cadrului', 'Fotografii interioare și exterioare', 'Selecție optimizată pentru anunț'],
    featured: true,
  },
  {
    id: 'tur-virtual',
    title: 'Tur virtual 360°',
    shortTitle: 'Tur virtual 360°',
    description: 'Vizitatorii pot explora proprietatea de la distanță, cameră cu cameră, înainte să programeze vizionarea.',
    category: 'Prezentare',
    icon: Rotate3D,
    outcomes: ['Captură panoramică', 'Navigare între camere', 'Integrare în pagina proprietății'],
    featured: true,
  },
  {
    id: 'video',
    title: 'Video de prezentare și cadre aeriene',
    shortTitle: 'Video și cadre aeriene',
    description: 'Un material scurt pentru proprietăți care beneficiază de prezentarea spațiului, clădirii și împrejurimilor.',
    category: 'Prezentare',
    icon: Video,
    outcomes: ['Traseu video al proprietății', 'Montaj pentru social media', 'Cadre aeriene unde sunt permise'],
  },
  {
    id: 'home-staging',
    title: 'Pregătire pentru fotografiere și vizionări',
    shortTitle: 'Home staging',
    description: 'Recomandări practice pentru lumină, mobilier, ordine și mici ajustări care ajută proprietatea să se prezinte mai bine.',
    category: 'Prezentare',
    icon: Sparkles,
    outcomes: ['Checklist pe camere', 'Rearanjare și pregătire', 'Recomandări cu impact vizual'],
  },
  {
    id: 'plan-releveu',
    title: 'Plan orientativ și măsurători pentru prezentare',
    shortTitle: 'Plan și măsurători',
    description: 'O schiță clară pentru prezentarea compartimentării și a dimensiunilor, distinctă de documentația cadastrală.',
    category: 'Prezentare',
    icon: Ruler,
    outcomes: ['Măsurători de prezentare', 'Plan lizibil pentru anunț', 'Marcarea zonelor funcționale'],
  },
  {
    id: 'promovare',
    title: 'Anunț, copywriting și promovare premium',
    shortTitle: 'Promovare premium',
    description: 'Poziționarea proprietății, redactarea anunțului și distribuția conținutului într-un plan unitar.',
    category: 'Promovare',
    icon: Megaphone,
    outcomes: ['Titlu și descriere optimizate', 'Selecția canalelor potrivite', 'Urmărirea cererilor generate'],
  },
  {
    id: 'documente',
    title: 'Pregătirea dosarului pentru tranzacție',
    shortTitle: 'Dosar tranzacție',
    description: 'Checklist operațional pentru documentele uzuale, organizarea versiunilor și coordonarea pașilor din Deal Room.',
    category: 'Tranzacție',
    icon: FileCheck2,
    outcomes: ['Listă de documente necesare', 'Urmărirea documentelor lipsă', 'Coordonare cu profesioniștii implicați'],
  },
]

const PACKAGES: ServicePackage[] = [
  {
    id: 'start-listare',
    name: 'Start listare',
    description: 'Pentru o proprietate care urmează să fie publicată.',
    items: ['Evaluare orientativă', 'Fotografie profesională', 'Descriere și structură de anunț'],
    primaryServiceId: 'fotografie',
  },
  {
    id: 'prezentare-premium',
    name: 'Prezentare premium',
    description: 'Pentru proprietăți unde experiența vizuală contează.',
    items: ['Fotografie profesională', 'Tur virtual 360°', 'Video de prezentare'],
    primaryServiceId: 'tur-virtual',
    featured: true,
  },
  {
    id: 'pregatit-pentru-tranzactie',
    name: 'Pregătit pentru tranzacție',
    description: 'Pentru proprietari care vor un proces bine organizat.',
    items: ['Checklist documente', 'Deal Room', 'Coordonarea pașilor și responsabililor'],
    primaryServiceId: 'documente',
  },
]

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  location: '',
  details: '',
  privacyAccepted: false,
}

export function ServiciiPage() {
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [selection, setSelection] = useState<ServiceRequestSelection | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const openService = (service: ServiceDefinition) => {
    if (service.directPage) {
      navigateTo(service.directPage)
      return
    }
    setSelection({ kind: 'service', service })
  }

  const openPackage = (servicePackage: ServicePackage) => {
    const primaryService = SERVICES.find((item) => item.id === servicePackage.primaryServiceId)
    if (!primaryService) {
      toast.error('Pachetul nu poate fi solicitat momentan.')
      return
    }

    setSelection({ kind: 'package', package: servicePackage, primaryService })
  }

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selection) return
    if (form.name.trim().length < 2) {
      toast.error('Introdu numele complet.')
      return
    }
    if (!isValidEmail(form.email)) {
      toast.error('Introdu o adresă de email validă.')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Introdu un număr de telefon valid.')
      return
    }
    if (!form.privacyAccepted) {
      toast.error('Confirmarea informării privind protecția datelor este obligatorie.')
      return
    }

    setSubmitting(true)
    try {
      const requestIdentity = selection.kind === 'package'
        ? {
            propertyTitle: `Pachet servicii: ${selection.package.name}`,
            messageLines: [
              'Tip solicitare: pachet de servicii',
              `Pachet: ${selection.package.name}`,
              `Cod pachet: ${selection.package.id}`,
              `Servicii incluse: ${selection.package.items.join(', ')}`,
              `Serviciu principal: ${selection.primaryService.title} (${selection.primaryService.id})`,
            ],
          }
        : {
            propertyTitle: `Serviciu: ${selection.service.title}`,
            messageLines: [
              'Tip solicitare: serviciu individual',
              `Serviciu: ${selection.service.title}`,
              `Cod serviciu: ${selection.service.id}`,
            ],
          }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          propertyTitle: requestIdentity.propertyTitle,
          privacyAccepted: form.privacyAccepted,
          message: [
            ...requestIdentity.messageLines,
            `Zonă / localitate: ${form.location.trim() || 'nespecificată'}`,
            `Detalii: ${form.details.trim() || 'Clientul solicită să fie contactat pentru stabilirea detaliilor.'}`,
          ].join('\n'),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Solicitarea nu a putut fi trimisă.')

      toast.success('Solicitarea a fost trimisă', {
        description: 'Echipa o va vedea în centrul de administrare și te va contacta pentru detalii.',
      })
      setForm(INITIAL_FORM)
      setSelection(null)
    } catch (error) {
      toast.error('Solicitarea nu a fost trimisă', {
        description: error instanceof Error ? error.message : 'Încearcă din nou.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        variant="border"
        icon={House}
        title="Servicii pentru proprietatea ta"
        description="De la evaluare și pregătirea anunțului până la tur virtual, promovare și organizarea tranzacției."
        breadcrumb={[{ label: 'Acasă', page: 'acasa' }, { label: 'Servicii' }]}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => document.getElementById('servicii-disponibile')?.scrollIntoView({ behavior: 'smooth' })}>
            Vezi serviciile <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigateTo('evaluare')}>
            <BadgeDollarSign className="mr-2 h-4 w-4" /> Evaluare rapidă
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Alegi serviciul', 'Selectezi exact ajutorul de care ai nevoie.'],
            ['2', 'Descrii proprietatea', 'Transmiți doar datele esențiale pentru contact.'],
            ['3', 'Stabilim planul', 'Echipa confirmă detaliile și următorul pas.'],
          ].map(([step, title, description]) => (
            <div key={step} className="flex gap-3 rounded-xl border bg-card/80 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div>
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </div>
      </PageHero>

      <section id="servicii-disponibile" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline">Servicii individuale</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Alege ce vrei să rezolvi</h2>
            <p className="mt-2 text-muted-foreground">Poți începe cu un singur serviciu. După cerere, echipa îți recomandă doar pașii relevanți proprietății.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((service, index) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index * 0.04, 0.2) }}>
                <Card className={cn('flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md', service.featured && 'border-primary/30')}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><service.icon className="h-5 w-5" /></div>
                      <Badge variant={service.featured ? 'default' : 'secondary'}>{service.category}</Badge>
                    </div>
                    <CardTitle className="pt-3 text-lg">{service.shortTitle}</CardTitle>
                    <CardDescription className="leading-relaxed">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="space-y-2">
                      {service.outcomes.map((outcome) => <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{outcome}</li>)}
                    </ul>
                    <Button aria-label={service.directPage ? 'Începe evaluarea proprietății' : `Solicită serviciul ${service.shortTitle}`} className="mt-6 w-full" variant={service.featured ? 'default' : 'outline'} onClick={() => openService(service)}>
                      {service.directPage ? 'Începe evaluarea' : 'Solicită serviciul'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Badge variant="outline">Pachete recomandate</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Mai puține decizii, un plan coerent</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Pachetele grupează serviciile care funcționează bine împreună. Conținutul final se confirmă înainte de începerea lucrului.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {PACKAGES.map((item) => (
              <Card key={item.name} className={cn(item.featured && 'border-primary shadow-md')}>
                <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{item.name}</CardTitle>{item.featured ? <Badge>Recomandat</Badge> : null}</div><CardDescription>{item.description}</CardDescription></CardHeader>
                <CardContent>
                  <ul className="space-y-3">{item.items.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />{feature}</li>)}</ul>
                  <Button aria-label={`Cere detalii pentru pachetul ${item.name}`} className="mt-6 w-full" variant={item.featured ? 'default' : 'outline'} onClick={() => openPackage(item)}>Cere detalii</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            ['Evaluarea online este un raport ANEVAR?', 'Nu. Estimarea online este orientativă. Pentru scopuri bancare, fiscale sau juridice este necesar un evaluator autorizat, după caz.'],
            ['Pot solicita doar fotografierea?', 'Da. Fiecare serviciu poate fi cerut separat, fără să alegi un pachet complet.'],
            ['Ce se întâmplă după solicitare?', 'Cererea ajunge în centrul de administrare, iar echipa stabilește cu tine proprietatea, disponibilitatea și livrabilele exacte.'],
          ].map(([question, answer]) => <Card key={question}><CardHeader><CardTitle className="text-base">{question}</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">{answer}</p></CardContent></Card>)}
        </div>
      </section>

      <Dialog open={Boolean(selection)} onOpenChange={(open) => { if (!open && !submitting) setSelection(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selection?.kind === 'package'
                ? `Solicită pachetul „${selection.package.name}”`
                : `Solicită ${selection?.service.shortTitle.toLocaleLowerCase('ro-RO') ?? 'serviciul'}`}
            </DialogTitle>
            <DialogDescription>Completează datele esențiale. Detaliile și livrabilele vor fi confirmate înainte de începerea serviciului.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitRequest}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="service-name">Nume *</Label><Input id="service-name" autoComplete="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Numele tău" /></div>
              <div className="space-y-2"><Label htmlFor="service-phone">Telefon *</Label><Input id="service-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="07xx xxx xxx" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="service-email">Email *</Label><Input id="service-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nume@email.ro" /></div>
            <div className="space-y-2"><Label htmlFor="service-location">Zona sau localitatea proprietății</Label><Input id="service-location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Ex: Floreasca, București" /></div>
            <div className="space-y-2"><Label htmlFor="service-details">Ce ar trebui să știm?</Label><Textarea id="service-details" rows={4} maxLength={1500} value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder="Tipul proprietății, suprafața și perioada preferată" /></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={form.privacyAccepted} onChange={(event) => setForm((current) => ({ ...current, privacyAccepted: event.target.checked }))} />
              <span>Am citit <a href="/confidentialitate" target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">informarea privind protecția datelor</a> și sunt de acord să fiu contactat în legătură cu această solicitare.</span>
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={submitting} onClick={() => setSelection(null)}>Renunță</Button>
              <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Trimite solicitarea</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
