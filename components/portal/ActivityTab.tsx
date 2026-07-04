"use client"

import { useState, useCallback } from "react"
import { Card, Badge, Button, EmptyState } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const TYPE_MAP: Record<string, string> = {
  offer: "Ofertă",
  viewing: "Vizitare",
  document: "Document",
  system: "Sistem",
  appointment: "Programare",
}

/* ─────────────────── component ─────────────────── */

export default function ActivityTab() {
  const { activity, notifications, setMessage, headers, refresh } = usePortal()
  const [toggling, setToggling] = useState<string | null>(null)

  const toggleRead = useCallback(
    async (id: string, current: string) => {
      setToggling(id)
      try {
        const nextAction = current === "READ" || current === "read" ? "unread" : "read"
        const res = await fetch("/api/client/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers() },
          body: JSON.stringify({ id, action: nextAction }),
        })
        if (!res.ok) throw new Error()
        await refresh()
      } catch {
        setMessage("Nu s-a putut actualiza notificarea.")
      } finally {
        setToggling(null)
      }
    },
    [headers, refresh, setMessage]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Activity Timeline ── */}
      <Card title="Istoric activitate">
        {!activity || activity.length === 0 ? (
          <EmptyState message="Nu există activitate recentă." colSpan={1} />
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                    {item.type && (
                      <Badge variant="default">
                        {TYPE_MAP[item.type] ?? item.type}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-text-muted line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.created_at && (
                    <p className="text-xs text-text-muted">
                      {formatDateTime(item.created_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Notifications ── */}
      <Card title="Notificări">
        {!notifications || notifications.length === 0 ? (
          <EmptyState message="Nu ai notificări." colSpan={1} />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isRead = (n.status ?? "").toUpperCase() === "READ"
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isRead
                      ? "border-bg-surface bg-bg-primary/30 opacity-70"
                      : "border-accent/30 bg-accent/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className={`text-sm font-semibold truncate ${isRead ? "text-text-muted" : ""}`}>
                        {n.title}
                      </h4>
                      {n.body && (
                        <p className="text-sm text-text-muted line-clamp-2">{n.body}</p>
                      )}
                      {n.due_at && (
                        <p className="text-xs text-text-muted">
                          Termen: {formatDate(n.due_at)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      className="shrink-0 px-2 text-xs"
                      onClick={() => toggleRead(n.id, n.status ?? "")}
                      disabled={toggling === n.id}
                    >
                      {isRead ? "☑ Citit" : "○ Necitit"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
