"use client"

import { useEffect, useMemo, useState } from "react"
import { featureCatalog, featureCategories, FeatureCategory, FeatureStatus } from "@/lib/feature-catalog"

const statusLabels: Record<FeatureStatus | "all", string> = { all: "Toate", live: "Live", next: "In lucru", planned: "Planificate" }
const impactScore = { ridicat: 3, mediu: 2, rapid: 1 }

export default function FeatureCommandCenter({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FeatureCategory | "all">("all")
  const [status, setStatus] = useState<FeatureStatus | "all">("all")
  const [pinned, setPinned] = useState<number[]>([])
  const [budget, setBudget] = useState(2500)
  const [weeks, setWeeks] = useState(4)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("hqs-feature-priorities") || "[]")
      if (Array.isArray(stored)) setPinned(stored.filter((id) => typeof id === "number"))
    } catch {}
  }, [])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return featureCatalog.filter((item) => {
      if (category !== "all" && item.category !== category) return false
      if (status !== "all" && item.status !== status) return false
      if (!text) return true
      return [item.title, item.benefit, featureCategories[item.category], item.status, item.impact].join(" ").toLowerCase().includes(text)
    })
  }, [query, category, status])

  const live = featureCatalog.filter((item) => item.status === "live").length
  const next = featureCatalog.filter((item) => item.status === "next").length
  const maturity = Math.round((live / featureCatalog.length) * 100)
  const selectedFeatures = featureCatalog.filter((item) => pinned.includes(item.id))
  const selectedScore = selectedFeatures.reduce((sum, item) => sum + impactScore[item.impact], 0)
  const estimatedCost = selectedScore * budget
  const estimatedWeeks = Math.max(1, Math.ceil(selectedFeatures.length / Math.max(1, weeks)))

  const togglePinned = (id: number) => {
    const nextPinned = pinned.includes(id) ? pinned.filter((item) => item !== id) : [...pinned, id]
    setPinned(nextPinned)
    localStorage.setItem("hqs-feature-priorities", JSON.stringify(nextPinned))
  }

  const exportRoadmap = () => {
    const rows = [["ID", "Categorie", "Functionalitate", "Status", "Impact", "Beneficiu"], ...filtered.map((item) => [item.id, featureCategories[item.category], item.title, item.status, item.impact, item.benefit])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    link.download = "hqs-100-functionalitati.csv"
    link.click()
  }

  const grouped = Object.entries(featureCategories).map(([key, label]) => ({
    key: key as FeatureCategory,
    label,
    count: featureCatalog.filter((item) => item.category === key).length,
    live: featureCatalog.filter((item) => item.category === key && item.status === "live").length,
  }))

  return (
    <section className={compact ? "space-y-6" : "bg-bg-primary px-4 py-16"}>
      <div className={compact ? "space-y-6" : "mx-auto max-w-7xl space-y-8"}>
        <div className="flex flex-col gap-5 border-b border-bg-surface pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Roadmap produs</p>
            <h1 className="mt-3 text-3xl font-black text-text-primary md:text-5xl">100 functionalitati pentru HQS Imobiliare</h1>
            <p className="mt-4 text-sm leading-relaxed text-text-muted md:text-base">Un centru de control pentru ce este live, ce urmeaza si ce merita prioritizat. Lista este filtrabila, exportabila si poate fi folosita ca plan de lucru pentru urmatoarele sprinturi.</p>
          </div>
          <button onClick={exportRoadmap} className="h-11 rounded-lg bg-accent px-5 text-sm font-black text-bg-primary">Exporta CSV</button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Functionalitati" value={featureCatalog.length} detail="total in roadmap" />
          <Metric label="Live acum" value={live} detail={`${maturity}% maturitate`} />
          <Metric label="In lucru" value={next} detail="gata de prioritizat" />
          <Metric label="Selectate" value={pinned.length} detail="salvate local" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_190px_160px]">
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="form-input" placeholder="Cauta dupa functionalitate, impact sau beneficiu" />
              <select value={category} onChange={(e) => setCategory(e.target.value as FeatureCategory | "all")} className="form-input">
                <option value="all">Toate categoriile</option>
                {Object.entries(featureCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as FeatureStatus | "all")} className="form-input">
                {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => togglePinned(item.id)} className={`min-h-40 rounded-lg border p-4 text-left transition-all ${pinned.includes(item.id) ? "border-accent bg-accent/10" : "border-bg-surface bg-bg-secondary hover:border-accent/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-black text-accent">#{item.id.toString().padStart(3, "0")}</span>
                    <span className="rounded-full border border-bg-surface px-2 py-1 text-[11px] font-bold uppercase text-text-muted">{statusLabels[item.status]}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">{item.benefit}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted">{featureCategories[item.category]}</span>
                    <span className="font-black text-accent">{item.impact}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h2 className="text-lg font-black text-text-primary">Plan rapid</h2>
              <p className="mt-2 text-sm text-text-muted">Selecteaza functionalitati din lista si obtii un plan orientativ.</p>
              <div className="mt-4 grid gap-3">
                <label><span className="mb-1 block text-xs font-bold uppercase text-text-muted">Buget per punct impact</span><input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} className="form-input" /></label>
                <label><span className="mb-1 block text-xs font-bold uppercase text-text-muted">Functionalitati pe saptamana</span><input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value || 1))} className="form-input" /></label>
              </div>
              <div className="mt-4 rounded-lg bg-bg-secondary p-4">
                <p className="text-xs uppercase text-text-muted">Estimare selectie</p>
                <p className="mt-1 text-2xl font-black text-text-primary">EUR {estimatedCost.toLocaleString("ro-RO")}</p>
                <p className="mt-1 text-sm text-text-muted">{estimatedWeeks} saptamani orientativ pentru {selectedFeatures.length} item-uri.</p>
              </div>
            </div>

            <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
              <h2 className="text-lg font-black text-text-primary">Prioritati salvate</h2>
              <div className="mt-4 space-y-2">
                {selectedFeatures.length ? selectedFeatures.slice(0, 8).map((item) => <div key={item.id} className="rounded-lg bg-bg-secondary p-3"><p className="text-sm font-bold text-text-primary">{item.title}</p><p className="text-xs text-text-muted">{featureCategories[item.category]} - {statusLabels[item.status]}</p></div>) : <p className="text-sm text-text-muted">Apasa pe functionalitati ca sa le salvezi in plan.</p>}
              </div>
              {pinned.length > 0 && <button onClick={() => { setPinned([]); localStorage.removeItem("hqs-feature-priorities") }} className="mt-4 text-sm font-bold text-accent">Goleste selectia</button>}
            </div>
          </aside>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {grouped.map((item) => <button key={item.key} onClick={() => setCategory(item.key)} className="rounded-lg border border-bg-surface bg-bg-card p-4 text-left hover:border-accent"><p className="text-sm font-black text-text-primary">{item.label}</p><p className="mt-2 text-xs text-text-muted">{item.live}/{item.count} live</p><div className="mt-3 h-2 rounded-full bg-bg-secondary"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.round((item.live / item.count) * 100)}%` }} /></div></button>)}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-card p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-3xl font-black text-text-primary">{value}</p><p className="mt-2 text-xs font-bold uppercase text-accent">{detail}</p></div>
}
