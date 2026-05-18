import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { createStripeInvoice } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "accounting")
  if ("error" in auth) return auth.error

  const body = await request.json().catch(() => ({}))
  try {
    const result = await createStripeInvoice({ clientEmail: body.client_email || body.email, clientName: body.client_name || body.name, description: body.description || body.property_title || "Servicii HQS Imobiliare", amount: Number(body.amount || 0), currency: body.currency || "eur", propertyId: body.property_id })
    const invoice = result.invoice || {}
    const { data } = await auth.supabase.from("admin_invoices").insert({ stripe_customer_id: result.customer?.id, stripe_invoice_id: invoice.id, hosted_invoice_url: invoice.hosted_invoice_url, invoice_pdf: invoice.invoice_pdf, client_email: body.client_email || body.email, client_name: body.client_name || body.name, property_id: body.property_id || null, amount: Number(body.amount || 0), currency: body.currency || "eur", status: invoice.status || "SENT", metadata: result, created_by: auth.session.actor }).select("*").single()
    await auth.supabase.from("admin_provider_jobs").insert({ provider: "stripe", action: "create_invoice", status: "SENT", target: body.client_email || body.email, entity: "admin_invoices", entity_id: data?.id || null, request: body, response: result, provider_event_id: invoice.id, created_by: auth.session.actor, attempts: 1 })
    return NextResponse.json({ invoice: data, stripe: result })
  } catch (error: any) {
    await auth.supabase.from("admin_provider_jobs").insert({ provider: "stripe", action: "create_invoice", status: error?.name === "IntegrationConfigError" ? "FAILED_CONFIG" : "FAILED_PROVIDER", target: body.client_email || body.email, request: body, response: {}, error: error?.message, created_by: auth.session.actor, attempts: 1 })
    return jsonError(error.message || "Stripe invoice failed", error?.name === "IntegrationConfigError" ? 400 : 502)
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "accounting")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || "").trim()
    const action = String(body.action || "").toLowerCase()
    if (!id) return jsonError("invoice id lipseste", 400)
    if (!["mark_paid", "void", "resend"].includes(action)) return jsonError("Actiune factura invalida.", 400)

    const { data: invoice, error: loadError } = await auth.supabase.from("admin_invoices").select("*").eq("id", id).single()
    if (loadError) return jsonError(loadError.message, 400)

    const now = new Date().toISOString()
    let status = invoice.status
    let queued = null
    if (action === "mark_paid") status = "PAID"
    if (action === "void") status = "VOID"
    if (action === "resend") {
      status = invoice.status || "SENT"
      const queuedResult = await auth.supabase.from("admin_notification_outbox").insert({
        channel: "EMAIL",
        target: invoice.client_email,
        subject: "Factura HQS Imobiliare",
        body: invoice.hosted_invoice_url ? `Factura poate fi achitata aici: ${invoice.hosted_invoice_url}` : "Factura HQS este disponibila in portal.",
        status: "QUEUED",
        entity: "admin_invoices",
        entity_id: id,
        created_by: auth.session.actor,
        updated_at: now,
      }).select("*").maybeSingle()
      queued = queuedResult.data || null
    }

    const metadata = {
      ...(invoice.metadata || {}),
      admin_actions: [...(Array.isArray(invoice.metadata?.admin_actions) ? invoice.metadata.admin_actions : []), { action, actor: auth.session.actor, at: now }],
    }
    const { data, error } = await auth.supabase.from("admin_invoices").update({ status, metadata, updated_at: now }).eq("id", id).select("*").single()
    if (error) return jsonError(error.message, 400)

    await Promise.allSettled([
      auth.supabase.from("admin_audit_log").insert({ actor: auth.session.actor, action: `INVOICE_${action.toUpperCase()}`, entity: "admin_invoices", entity_id: id, details: { action, status }, metadata: { action, status } }),
      action === "resend" ? auth.supabase.from("admin_provider_jobs").insert({ provider: "resend", action: "send_notification", status: "QUEUED", target: invoice.client_email, entity: "admin_notification_outbox", entity_id: queued?.id || null, request: { target: invoice.client_email, subject: "Factura HQS Imobiliare", body: invoice.hosted_invoice_url || "Factura HQS" }, created_by: auth.session.actor, next_attempt_at: now, updated_at: now }) : Promise.resolve(),
    ])

    return NextResponse.json({ invoice: data, queued })
  } catch (error: any) {
    return jsonError(error.message || "Invoice action failed")
  }
}
