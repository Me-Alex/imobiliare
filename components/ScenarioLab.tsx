"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, Calculator, LineChart, ShieldCheck } from "lucide-react"

type CompetitionLevel = "scazut" | "mediu" | "ridicat"

type ScenarioForm = {
  propertyPrice: number
  area: number
  zone: string
  monthlyRent: number
  advancePercent: number
  interestRate: number
  years: number
  renovationBudget: number
  holdingYears: number
  riskTolerance: number
  competitionLevel: CompetitionLevel
}

type ScenarioResult = {
  market: { zone: string; liquidity: number; growth: number; risk: string }
  financing: {
    downPayment: number
    financedAmount: number
    monthlyPayment: number
    annualDebtService: number
    totalCashNeeded: number
    closingCosts: number
  }
  performance: {
    grossYield: number
    netYield: number
    annualCashflow: number
    exitValue: number
    projectedEquity: number
    projectedRoi: number
    pricePerSqm: number
    marketDelta: number
  }
  negotiation: {
    recommendedOffer: number
    negotiationRoom: number
    conditionReserve: number
  }
  risk: {
    liquidityScore: number
    riskScore: number
    verdict: "continua" | "negociaza" | "asteapta"
    redFlags: string[]
    strengths: string[]
  }
  nextActions: string[]
}

const money = new Intl.NumberFormat("ro-RO")

const defaultScenario: ScenarioForm = {
  propertyPrice: 285000,
  area: 86,
  zone: "Pipera",
  monthlyRent: 1450,
  advancePercent: 22,
  interestRate: 6.2,
  years: 25,
  renovationBudget: 18000,
  holdingYears: 6,
  riskTolerance: 3,
  competitionLevel: "mediu",
}

const verdictLabels = {
  continua: "Continua analiza",
  negociaza: "Negociaza controlat",
  asteapta: "Asteapta conditii mai bune",
} as const

export default function ScenarioLab() {
  const [form, setForm] = useState(defaultScenario)
  const [scenario, setScenario] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  const signalTone = useMemo(() => {
    if (!scenario) return "border-bg-surface"
    if (scenario.risk.verdict === "continua") return "border-accent"
    if (scenario.risk.verdict === "negociaza") return "border-amber-400"
    return "border-red-400"
  }, [scenario])

  useEffect(() => {
    void runScenario(defaultScenario)
  }, [])

  const updateNumber = (key: keyof ScenarioForm, value: string) => {
    setForm((current) => ({ ...current, [key]: Number(value || 0) }))
  }

  const runScenario = async (payload = form) => {
    setError("")
    setIsPending(true)
    try {
      const response = await fetch("/api/scenario-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Analiza nu a putut fi calculata.")
      setScenario(body.scenario)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analiza nu a putut fi calculata.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="border-y border-bg-surface bg-bg-primary px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Scenario lab</p>
            <h2 className="mt-3 text-3xl font-black text-text-primary md:text-4xl">Simulare investitie, credit si negociere</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              Combina pretul, chiria, finantarea, lichiditatea zonei si costurile de renovare intr-un verdict operational pentru client.
            </p>
          </div>
          <div className={`rounded-lg border ${signalTone} bg-bg-card p-5`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-accent" aria-hidden />
              <div>
                <p className="text-sm font-black uppercase text-text-muted">Verdict scenariu</p>
                <p className="mt-1 text-2xl font-black text-text-primary">
                  {scenario ? verdictLabels[scenario.risk.verdict] : "Se calculeaza"}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  {scenario ? `${scenario.market.zone}: lichiditate ${scenario.risk.liquidityScore}/100, risc ${scenario.risk.riskScore}/100` : "Pornim de la un scenariu implicit pentru nordul Bucurestiului."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-bg-surface bg-bg-card p-5"
            onSubmit={(event) => {
              event.preventDefault()
              runScenario()
            }}
          >
            <div className="grid gap-4">
              <NumberField label="Pret proprietate" value={form.propertyPrice} min={50000} max={5000000} step={5000} onChange={(value) => updateNumber("propertyPrice", value)} />
              <NumberField label="Suprafata mp" value={form.area} min={20} max={500} step={1} onChange={(value) => updateNumber("area", value)} />
              <label className="grid gap-2 text-xs font-bold uppercase text-text-muted">
                Zona
                <input className="form-input" value={form.zone} onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))} />
              </label>
              <NumberField label="Chirie lunara estimata" value={form.monthlyRent} min={0} max={20000} step={50} onChange={(value) => updateNumber("monthlyRent", value)} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Avans %" value={form.advancePercent} min={5} max={95} step={1} onChange={(value) => updateNumber("advancePercent", value)} />
                <NumberField label="Dobanda %" value={form.interestRate} min={1} max={18} step={0.1} onChange={(value) => updateNumber("interestRate", value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Ani credit" value={form.years} min={1} max={35} step={1} onChange={(value) => updateNumber("years", value)} />
                <NumberField label="Ani detinere" value={form.holdingYears} min={1} max={20} step={1} onChange={(value) => updateNumber("holdingYears", value)} />
              </div>
              <NumberField label="Buget renovare" value={form.renovationBudget} min={0} max={500000} step={1000} onChange={(value) => updateNumber("renovationBudget", value)} />
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase text-text-muted">Competitie</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["scazut", "mediu", "ridicat"] as CompetitionLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, competitionLevel: level }))}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold ${form.competitionLevel === level ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-muted"}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-black text-bg-primary transition-opacity hover:opacity-90" disabled={isPending}>
                <Calculator className="h-4 w-4" aria-hidden />
                {isPending ? "Calculeaza" : "Ruleaza scenariu"}
              </button>
            </div>
          </form>

          <div className="grid gap-5">
            {error ? (
              <div className="rounded-lg border border-red-400 bg-bg-card p-5 text-sm font-bold text-red-400">{error}</div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-4">
              <Metric icon={<Calculator className="h-4 w-4" aria-hidden />} label="Rata lunara" value={scenario ? `EUR ${money.format(scenario.financing.monthlyPayment)}` : "-"} />
              <Metric icon={<LineChart className="h-4 w-4" aria-hidden />} label="Randament net" value={scenario ? `${scenario.performance.netYield}%` : "-"} />
              <Metric icon={<ShieldCheck className="h-4 w-4" aria-hidden />} label="ROI exit" value={scenario ? `${scenario.performance.projectedRoi}%` : "-"} />
              <Metric icon={<AlertTriangle className="h-4 w-4" aria-hidden />} label="Risc" value={scenario ? `${scenario.risk.riskScore}/100` : "-"} />
            </div>

            {scenario ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Finantare si performanta">
                  <DataRow label="Cash necesar" value={`EUR ${money.format(scenario.financing.totalCashNeeded)}`} />
                  <DataRow label="Cashflow anual" value={`EUR ${money.format(scenario.performance.annualCashflow)}`} />
                  <DataRow label="Pret/mp" value={`EUR ${money.format(scenario.performance.pricePerSqm)}`} />
                  <DataRow label="Delta fata de zona" value={`${scenario.performance.marketDelta}%`} />
                  <DataRow label="Valoare exit estimata" value={`EUR ${money.format(scenario.performance.exitValue)}`} />
                </Panel>
                <Panel title="Negociere si risc">
                  <DataRow label="Oferta recomandata" value={`EUR ${money.format(scenario.negotiation.recommendedOffer)}`} />
                  <DataRow label="Marja negociere" value={`EUR ${money.format(scenario.negotiation.negotiationRoom)}`} />
                  <DataRow label="Rezerva renovare" value={`${scenario.negotiation.conditionReserve}%`} />
                  <DataRow label="Lichiditate zona" value={`${scenario.risk.liquidityScore}/100`} />
                  <DataRow label="Crestere zona" value={`${scenario.market.growth}%`} />
                </Panel>
                <Panel title="Puncte tari">
                  <BulletList items={scenario.risk.strengths.length ? scenario.risk.strengths : ["scenariu neutru, fara avantaj dominant"]} />
                </Panel>
                <Panel title="Urmatorii pasi">
                  <BulletList items={scenario.nextActions} />
                </Panel>
                <div className="lg:col-span-2">
                  <Panel title="Semnale de atentie">
                    <BulletList items={scenario.risk.redFlags.length ? scenario.risk.redFlags : ["nu exista semnale critice in configuratia curenta"]} />
                  </Panel>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase text-text-muted">
      {label}
      <input className="form-input" type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
      <div className="flex items-center gap-2 text-accent">{icon}<p className="text-xs font-bold uppercase text-text-muted">{label}</p></div>
      <p className="mt-2 text-2xl font-black text-text-primary">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
      <h3 className="text-lg font-black text-text-primary">{title}</h3>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-bg-surface pb-2 last:border-b-0 last:pb-0">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="text-right text-sm font-black text-text-primary">{value}</p>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-muted">{item}</li>
      ))}
    </ul>
  )
}
