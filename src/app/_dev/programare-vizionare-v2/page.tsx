'use client'

/**
 * Preview of the redesigned booking + flow.
 *
 * The current production booking page lives at /programare-vizionare and
 * is a 200+ line monster with a multi-step modal, a calendar widget, and
 * separate flows for owner vs client. This preview shows the alternative:
 * a single inline form (3 fields) that takes the client straight to the
 * new `ClientFlow` workspace.
 *
 * The split is also simplified: the property page decides whether the
 * transaction is a sale or a rental, and the workspace renders the right
 * shape (1 form for rentals, 3 progressive stages for sales).
 */

import { useState } from 'react'
import { ArrowRight, CalendarCheck2, KeyRound, Home, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientFlow, type ClientSubmission } from '@/components/documents-v2'
import type { TransactionKind } from '@/lib/documents/flow-shape'

interface PropertyInfo {
  title: string
  zone: string
  kind: TransactionKind
}

const DEMO_PROPERTIES: PropertyInfo[] = [
  {
    title: 'Apartament 2 camere, Herăstrău',
    zone: 'Sector 1, București · 55 m²',
    kind: 'RENTAL',
  },
  {
    title: 'Vilă 5 camere, Pipera',
    zone: 'Sector 2, București · 240 m²',
    kind: 'SALE',
  },
]

type Step = 'pick' | 'book' | 'flow' | 'done'

export default function BookingFlowPreview() {
  const [step, setStep] = useState<Step>('pick')
  const [property, setProperty] = useState<PropertyInfo | null>(null)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [submissionLog, setSubmissionLog] = useState<ClientSubmission[]>([])

  if (step === 'pick') {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <header>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Preview · programare vizionare
            </p>
            <h1
              className="mt-1 text-2xl text-foreground"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Alege o proprietate
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Versiunea nouă a formularului de programare: 3 câmpuri, fără modal, fără calendar.
              Agentul te contactează în mai puțin de o oră.
            </p>
          </header>

          <ul className="space-y-3">
            {DEMO_PROPERTIES.map((p) => (
              <li key={p.title}>
                <button
                  type="button"
                  onClick={() => {
                    setProperty(p)
                    setStep('book')
                  }}
                  className="group flex w-full items-center gap-4 rounded-lg border border-border/70 bg-card p-4 text-left transition-colors hover:border-emerald-700/40 hover:bg-emerald-50/30"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/20">
                    {p.kind === 'RENTAL' ? <KeyRound className="size-5" /> : <Home className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium text-foreground">{p.title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.zone} ·{' '}
                      <span className="font-medium text-foreground/80">
                        {p.kind === 'RENTAL' ? 'Închiriere' : 'Vânzare'}
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-md border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <strong className="font-medium text-foreground">Demo mode.</strong>{' '}
            Selectează oricare. Pe pagina reală proprietățile vin din API.
          </div>
        </div>
      </main>
    )
  }

  if (step === 'book' && property) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <button
            type="button"
            onClick={() => {
              setProperty(null)
              setStep('pick')
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Alege altă proprietate
          </button>

          <header>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Programare vizionare
            </p>
            <h1
              className="mt-1 text-2xl text-foreground"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {property.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.zone} · {property.kind === 'RENTAL' ? 'Închiriere' : 'Vânzare'}
            </p>
          </header>

          <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <CalendarCheck2 className="mt-0.5 size-5 text-emerald-700" aria-hidden />
              <div>
                <h2 className="text-base font-medium text-foreground">3 câmpuri, gata</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Agentul te contactează în mai puțin de o oră ca să confirme data.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="bk-name" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nume
                </label>
                <Input
                  id="bk-name"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Ion Popescu"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label htmlFor="bk-email" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  id="bk-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  placeholder="ion@exemplu.ro"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label htmlFor="bk-phone" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Telefon
                </label>
                <Input
                  id="bk-phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="+40 700 000 000"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                size="lg"
                disabled={!contact.name || !contact.email || !contact.phone}
                onClick={() => setStep('flow')}
              >
                Continuă
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (step === 'flow' && property) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl mb-6 rounded-md border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">Preview · {property.kind === 'RENTAL' ? 'Închiriere' : 'Vânzare'}.</strong>{' '}
          {property.kind === 'RENTAL'
            ? 'Un singur formular. Agentul pregătește contractul în spate.'
            : '3 etape progresive. Următoarea se deblochează când trimiți precedenta.'}
        </div>

        <ClientFlow
          kind={property.kind}
          summary={{
            propertyTitle: property.title,
            propertyZone: property.zone,
          }}
          prefill={contact}
          onSubmit={async (submission) => {
            await new Promise((r) => setTimeout(r, 400))
            setSubmissionLog((prev) => [...prev, submission])
            if (property.kind === 'RENTAL' || submission.stageId === 'contract') {
              setStep('done')
            }
          }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Gata
          </p>
          <h1
            className="mt-1 text-2xl text-foreground"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Mulțumim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agentul a primit datele și te contactează în curând.
          </p>
        </header>

        <section className="rounded-lg border border-border/70 bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">Trimise în această sesiune</h2>
          <p className="mt-1 text-xs text-muted-foreground">Debug: ce a ajuns la server.</p>
          <pre className="mt-3 max-h-72 overflow-auto rounded bg-muted/30 p-3 text-[0.7rem] text-foreground/90">
{JSON.stringify(submissionLog, null, 2)}
          </pre>
        </section>

        <div>
          <Button variant="outline" onClick={() => {
            setStep('pick')
            setProperty(null)
            setSubmissionLog([])
          }}>
            Începe din nou
          </Button>
        </div>
      </div>
    </main>
  )
}
