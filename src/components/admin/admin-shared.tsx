'use client'

import { motion } from 'framer-motion'
import type { ElementType, ReactNode } from 'react'
import {
  PROPERTY_STATUS_LABELS,
  STATUS_LABELS,
  statusTone,
} from '@/lib/admin-labels'
import type { AdminPropertyStatus } from '@/lib/admin-dashboard'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-semibold', statusTone(status))}>
      {STATUS_LABELS[status] || PROPERTY_STATUS_LABELS[status as AdminPropertyStatus] || status.replaceAll('_', ' ')}
    </span>
  )
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ElementType
  label: string
  value: number | string
  note: string
  tone: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ElementType
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
