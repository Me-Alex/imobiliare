import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { listAdminSnapshot } from "@/lib/admin-data"
import { buildExecutiveReport } from "@/lib/platform-reports"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const limited = rateLimit(request, "admin-export", 20, 60_000)
  if (limited) return limited

  const auth = await requireAdminPermissionAsync(request, "exports")
  if ("error" in auth) return auth.error

  try {
    const url = new URL(request.url)
    const format = url.searchParams.get("format") || "json"
    const { core, modules, platform } = await listAdminSnapshot()
    const payload = { report: buildExecutiveReport({ ...platform, ...modules, ...core }), ...core, platform, modules, _admin: auth.session }

    if (format === "csv") {
      return new NextResponse(toCsv(payload), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hqs-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    return jsonError(error.message || "Admin export failed")
  }
}

function toCsv(payload: any) {
  const rows: Array<Array<string | number>> = [
    ["categorie", "nume", "status", "valoare", "detalii"],
    ...asRows(payload.leads).map((lead) => ["lead", lead.name || lead.email || lead.phone || lead.id, lead.status || "", lead.score || "", lead.source || ""]),
    ...asRows(payload.properties).map((property) => ["proprietate", property.title || property.slug || property.id, property.status || "", property.price || 0, property.city || ""]),
    ...asRows(payload.appointments).map((appointment) => ["programare", appointment.client_name || appointment.client_email || appointment.id, appointment.status || "REQUESTED", appointment.requested_at || "", appointment.property_title || ""]),
    ...asRows(payload.platform?.property_offers).map((offer) => ["oferta", offer.property_title || offer.id, offer.status || "", offer.counter_offer || offer.offer_price || 0, offer.client_email || offer.client_name || ""]),
    ...asRows(payload.platform?.client_documents).map((document) => ["document", document.title || document.type || document.id, document.status || "", document.expires_at || "", document.notes || ""]),
    ...asRows(payload.platform?.admin_notification_outbox).map((item) => ["notificare", item.subject || item.title || item.id, item.status || "", item.due_at || "", item.target || ""]),
    ...asRows(payload.platform?.admin_invoices).map((item) => ["factura", item.stripe_invoice_id || item.id, item.status || "", item.amount || 0, item.client_email || ""]),
  ]

  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
}

function asRows(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, any> => item && typeof item === "object") : []
}
