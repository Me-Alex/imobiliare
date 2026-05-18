import { afterEach, describe, expect, it, vi } from "vitest"
import { buildAdminTasks, buildReadinessChecks, guideForView } from "@/lib/admin-foolproof"

describe("admin foolproof helpers", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("prioritizes risky admin work before generic actions", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-18T10:00:00.000Z"))

    const tasks = buildAdminTasks(
      {
        leads: [{ id: "l1", status: "NEW", updated_at: "2026-05-16T09:00:00.000Z" }],
        properties: [{ id: "p1", title: "Draft", status: "DRAFT" }, { id: "p2", title: "No cover", status: "PUBLISHED" }],
        appointments: [{ id: "a1", status: "CONFIRMED", start_at: "2026-05-19T10:00:00.000Z" }],
      },
      { documents: [{ id: "d1", status: "PENDING" }] },
      {
        admin_provider_jobs: [{ id: "j1", provider: "twilio", status: "FAILED_PROVIDER" }],
        admin_invoices: [{ id: "i1", status: "SENT" }],
        property_media: [{ id: "m1", property_id: "p1", kind: "gallery", review_status: "NEEDS_ALT" }],
      },
      { activeLeads: [{ id: "l1", status: "NEW", updated_at: "2026-05-16T09:00:00.000Z" }] },
    )

    expect(tasks[0].id).toBe("failed-jobs")
    expect(tasks.map((task) => task.id)).toEqual(expect.arrayContaining(["stale-leads", "new-leads", "drafts", "missing-cover", "needs-alt", "pending-docs", "open-invoices", "next-tours"]))
  })

  it("returns a clean fallback when there are no blockers", () => {
    const tasks = buildAdminTasks({ leads: [], properties: [], appointments: [] }, { documents: [] }, { admin_provider_jobs: [], admin_invoices: [], property_media: [] }, { activeLeads: [] })

    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({ id: "clean", tone: "ok", view: "overview" })
  })

  it("reports readiness checks for access, media, providers, documents and inventory", () => {
    const checks = buildReadinessChecks(
      { properties: [{ id: "p1", cover_image_url: "https://example.com/cover.jpg" }] },
      { admin_roles: [{ email: "admin@example.com", status: "ACTIVE" }], admin_provider_jobs: [{ status: "SENT" }], property_media: [{ property_id: "p1", kind: "cover" }], client_documents: [{ id: "doc1" }] },
    )

    expect(checks.every((check) => check.ok)).toBe(true)
  })

  it("falls back to a generic guide for secondary admin pages", () => {
    expect(guideForView("unknown").steps).toHaveLength(3)
  })
})
