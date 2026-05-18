import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { createStripeInvoice } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"


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
