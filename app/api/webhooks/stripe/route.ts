import { getAdminClient, jsonError } from "@/lib/admin-api"
import { verifyStripeSignature } from "@/lib/admin-integrations"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const payload = await request.text()
  try {
    const valid = await verifyStripeSignature(payload, request.headers.get("stripe-signature"))
    if (!valid) return jsonError("Invalid Stripe signature", 400)
    const event = JSON.parse(payload)
    await getAdminClient().from("admin_provider_events").upsert({ provider: "stripe", event_id: event.id, event_type: event.type, payload: event }, { onConflict: "provider,event_id" })
    const invoice = event.data?.object
    if (invoice?.id) await getAdminClient().from("admin_invoices").update({ status: invoice.status || event.type, hosted_invoice_url: invoice.hosted_invoice_url || null, invoice_pdf: invoice.invoice_pdf || null, metadata: invoice, updated_at: new Date().toISOString() }).eq("stripe_invoice_id", invoice.id)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    return jsonError(error.message || "Stripe webhook failed", 400)
  }
}
