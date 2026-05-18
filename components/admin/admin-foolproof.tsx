"use client"

import { buildAdminTasks, buildReadinessChecks, guideForView, guidedActions, type AdminTask } from "@/lib/admin-foolproof"
import { type Row, type View } from "./admin-shared"
import { Badge, Button, Panel, Title } from "./admin-ui"

type Navigate = (view: View, query?: string) => void

type Props = {
  enabled: boolean
  view: View
  core: Row
  modules: Row
  platform: Row
  metrics: Row
  lastLoadedAt: string
  navigateView: Navigate
  toggle: () => void
}

const taskTone: Record<AdminTask["tone"], string> = {
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  neutral: "border-bg-surface bg-bg-secondary text-text-primary",
}

function asView(value: string): View {
  return value as View
}

export function AdminFoolproofLayer({ enabled, view, core, modules, platform, metrics, lastLoadedAt, navigateView, toggle }: Props) {
  const tasks = buildAdminTasks(core, modules, platform, metrics)
  const checks = buildReadinessChecks(core, platform)
  const guide = guideForView(view)
  const urgentCount = tasks.filter((task) => task.tone === "danger" || task.tone === "warn").length

  if (!enabled) {
    return (
      <Panel className="border-dashed">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black">Guided mode is off</p>
            <p className="text-sm text-text-muted">Turn it on when you want the admin to show next steps, safety checks and simpler paths.</p>
          </div>
          <Button onClick={toggle}>Turn guided mode on</Button>
        </div>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, currentColor 0 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Guided admin</Badge>
              <Badge>{urgentCount ? `${urgentCount} needs attention` : "no blockers"}</Badge>
              {lastLoadedAt && <Badge>updated {lastLoadedAt}</Badge>}
            </div>
            <h2 className="mt-4 max-w-3xl text-2xl font-black md:text-4xl">What do you want to get done?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">Use these guided paths instead of searching through every admin module. Each path opens the right page with the safest workflow first.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {guidedActions.slice(0, view === "overview" ? 8 : 4).map((action) => (
                <button key={action.id} type="button" onClick={() => navigateView(asView(action.view), action.query)} className="rounded-xl border border-bg-surface bg-bg-secondary p-4 text-left transition hover:-translate-y-0.5 hover:border-accent hover:text-accent">
                  <span className="grid h-9 w-12 place-items-center rounded-lg bg-accent/12 text-xs font-black text-accent">{action.mark}</span>
                  <span className="mt-3 block font-black text-text-primary">{action.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-text-muted">{action.body}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-bg-surface bg-bg-secondary p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">Next best actions</p>
                <p className="text-xs text-text-muted">Do these first.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={toggle}>Hide guide</Button>
            </div>
            <div className="mt-4 space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <button key={task.id} type="button" onClick={() => navigateView(asView(task.view), task.query)} className={`w-full rounded-lg border p-3 text-left transition hover:border-accent ${taskTone[task.tone]}`}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-black">{task.title}</span>
                    <span className="text-xs font-black uppercase">{task.cta}</span>
                  </span>
                  <span className="mt-1 block text-xs opacity-80">{task.meta}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <Title compact title={guide.title} subtitle={guide.goal} />
          <div className="grid gap-3 md:grid-cols-3">
            {guide.steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-bg-surface bg-bg-secondary p-3">
                <p className="text-xs font-black uppercase text-accent">Step {index + 1}</p>
                <p className="mt-1 text-sm font-bold">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-600">{guide.primary}</div>
        </Panel>
        <Panel>
          <Title compact title="Safety checks" subtitle="Click a failed check to open the right section." />
          <div className="space-y-2">
            {checks.map((check) => (
              <button key={check.id} type="button" onClick={() => navigateView(asView(check.view))} className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left ${check.ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                <span>
                  <span className="block text-sm font-black">{check.label}</span>
                  <span className="text-xs text-text-muted">{check.detail}</span>
                </span>
                <Badge>{check.ok ? "OK" : "FIX"}</Badge>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-bg-surface bg-bg-secondary p-3 text-xs text-text-muted">
            Avoid: {guide.avoid.join(" / ")}
          </div>
        </Panel>
      </div>
    </div>
  )
}
