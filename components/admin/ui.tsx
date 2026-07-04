"use client"

import Link from "next/link"
import type { ReactNode } from "react"

/* ---------- PageHeader ---------- */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_24px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && <div className="text-sm text-text-muted">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/* ---------- Card ---------- */

export function Card({
  children,
  className = "",
  title,
  actions,
}: {
  children: ReactNode
  className?: string
  title?: string
  actions?: ReactNode
}) {
  return (
    <div className={`rounded-2xl border border-bg-surface bg-bg-secondary p-5 shadow-[0_0_24px_rgba(0,0,0,0.06)] ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

/* ---------- StatCard ---------- */

export function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string
  value: ReactNode
  href?: string
  hint?: string
}) {
  const content = (
    <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-5 shadow-[0_0_24px_rgba(0,0,0,0.06)]">
      <p className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-black text-accent">{value}</p>
      {hint && <p className="mt-2 text-sm text-text-muted">{hint}</p>}
      {href && <div className="mt-3"><span className="text-sm text-accent hover:underline">Vezi tot →</span></div>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

/* ---------- DataTable ---------- */

export function DataTable({
  columns,
  children,
  minWidth = 640,
}: {
  columns: Array<{ label: string; className?: string }>
  children: ReactNode
  minWidth?: number
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${minWidth}px` }}>
          <thead className="bg-bg-primary/50">
            <tr>
              {columns.map((col) => (
                <th key={col.label} className={`px-4 py-3 text-left ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-t border-bg-surface hover:bg-bg-primary/40">{children}</tr>
}

/* ---------- EmptyState ---------- */

export function EmptyState({ message, colSpan = 1 }: { message: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-text-muted">
        {message}
      </td>
    </tr>
  )
}

/* ---------- Badge ---------- */

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "danger" }) {
  const styles: Record<string, string> = {
    default: "border-bg-surface text-text-muted",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  }
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${styles[variant]}`}>
      {children}
    </span>
  )
}

/* ---------- LoadingState ---------- */

export function LoadingState({ message = "Se incarca..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-text-muted">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-bg-surface border-t-accent" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}

/* ---------- Button ---------- */

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost"
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary: "bg-accent text-bg-primary hover:opacity-90",
    secondary: "border border-bg-surface text-text-primary hover:bg-bg-primary/50",
    ghost: "text-text-muted hover:text-text-primary",
  }
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Input ---------- */

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent ${className}`}
      {...props}
    />
  )
}

/* ---------- Select ---------- */

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent sm:w-auto ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
