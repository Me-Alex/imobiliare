"use client"

import { type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { type Row } from "./admin-shared"

export function LoadingState() {
  return <Panel><div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /><p className="text-lg font-black">Se incarca adminul</p><p className="max-w-md text-sm text-text-muted">Citire simultana din API-urile admin pentru CRM, portofoliu, module, platforma si rapoarte.</p></div></Panel>
}

export function NavButton({ item, active, onClick }: { item: any; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return <button onClick={onClick} className={`flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition md:w-full ${active ? "bg-accent text-bg-primary" : "text-text-muted hover:bg-bg-secondary hover:text-text-primary"}`}><Icon className="h-4 w-4" />{item.label}</button>
}

export function Panel({ children, tight = false, className = "" }: { children: ReactNode; tight?: boolean; className?: string }) {
  return <section className={`rounded-lg border border-bg-surface/80 bg-bg-card shadow-card ${tight ? "overflow-hidden" : "p-5"} ${className}`}>{children}</section>
}

export function Title({ title, subtitle, action, compact = false }: { title: string; subtitle?: string; action?: ReactNode; compact?: boolean }) {
  return <div className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${compact ? "mb-3" : "border-b border-bg-surface/70 pb-5"}`}><div><h2 className={`${compact ? "text-lg" : "text-2xl md:text-3xl"} font-black`}>{title}</h2>{subtitle && <p className="mt-1 text-sm leading-6 text-text-muted">{subtitle}</p>}</div>{action}</div>
}

export function Kpis({ cards }: { cards: Array<[ReactNode, ReactNode, ReactNode, any]> }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, meta, Icon]) => <Panel key={String(label)}><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-2 text-xs font-bold text-accent">{meta}</p></div><span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/12 text-accent"><Icon className="h-5 w-5" /></span></div></Panel>)}</div>
}

export function Table({ heads, rows, render, empty }: { heads: string[]; rows: Row[]; render: (row: Row) => ReactNode; empty: string }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr>{heads.map((head) => <th key={head} className="bg-bg-secondary px-5 py-4 text-xs font-black uppercase tracking-wide text-text-muted">{head}</th>)}</tr></thead><tbody>{rows.length ? rows.map(render) : <tr className="border-t border-bg-surface"><td className="px-5 py-10 text-center text-sm text-text-muted" colSpan={heads.length}>{empty}</td></tr>}</tbody></table></div>
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="px-5 py-4 align-middle">{children}</td>
}

export function Button({ children, onClick, disabled, variant = "primary", size = "md", className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md"; className?: string }) {
  const styles = { primary: "border-accent bg-accent text-bg-primary hover:bg-accent/90", ghost: "border-bg-surface bg-bg-secondary text-text-primary hover:border-accent hover:text-accent", danger: "border-rose-500/40 bg-rose-500/10 text-rose-500 hover:border-rose-500" }
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg border font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${size === "sm" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm"} ${styles[variant]} ${className}`}>{children}</button>
}

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-text-muted">{label}</span><input className="form-input" value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mt-3 block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-text-muted">{label}</span><textarea className="form-input min-h-24 resize-y" value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function Select({ children, value, onChange, disabled }: { children: ReactNode; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-lg border border-bg-surface bg-bg-secondary px-2 text-xs font-bold outline-none focus:border-accent disabled:opacity-50">{children}</select>
}

export function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-text-muted">{label}</span><select className="form-input" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>
}

export function Grid({ children, columns = 3 }: { children: ReactNode; columns?: 1 | 3 | 4 }) {
  const classes = columns === 1 ? "grid gap-3" : columns === 4 ? "grid gap-3 md:grid-cols-2 xl:grid-cols-4" : "grid gap-3 md:grid-cols-3"
  return <div className={classes}>{children}</div>
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-bg-surface bg-bg-secondary px-2.5 py-1 text-xs font-black">{children}</span>
}

export function Filter({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition ${active ? "border-accent bg-accent text-bg-primary" : "border-bg-surface bg-bg-secondary text-text-muted hover:border-accent hover:text-accent"}`}>{children}</button>
}

export function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${tone === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-500" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"}`}>{children}</div>
}

export function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-bg-surface bg-bg-secondary px-2 py-2 text-center"><p className="text-sm font-black">{value}</p><p className="text-[11px] text-text-muted">{label}</p></div>
}

export function Recent({ title, rows, render }: { title: string; rows: Row[]; render: (row: Row) => ReactNode }) {
  return <Panel><h3 className="mb-4 font-black">{title}</h3><div className="space-y-3">{rows.length ? rows.map(render) : <Empty text="Nu exista date." />}</div></Panel>
}

export function MiniRow({ title, meta, value }: { title: ReactNode; meta: ReactNode; value: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-bg-surface bg-bg-secondary p-3"><div><p className="font-black">{title}</p><p className="text-sm text-text-muted">{meta}</p></div><p className="text-right text-sm font-black text-accent">{value}</p></div>
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-bg-surface p-4 text-center text-sm text-text-muted">{text}</div>
}

export function BarList({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data || {}).filter(([, value]) => value > 0)
  const max = Math.max(1, ...entries.map(([, value]) => value))
  return <div><h3 className="font-black">{title}</h3><div className="mt-4 space-y-3">{entries.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span>{value}</span></div><div className="h-2 rounded-full bg-bg-secondary"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} /></div></div>)}{!entries.length && <Empty text="Nu exista date." />}</div></div>
}

export function Result({ label, value }: { label: string; value: ReactNode }) {
  return <div className="mt-4 rounded-lg border border-bg-surface bg-bg-secondary p-4"><p className="text-sm text-text-muted">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
}
