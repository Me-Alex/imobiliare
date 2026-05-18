import { jsonError } from "@/lib/admin-api"
import { optionalUuid } from "@/lib/admin-properties"
import { leadRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { estimateLeadScore } from "@/lib/experience"
import { rateLimit } from "@/lib/rate-limit"
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = await rateLimit(request, "public-leads", 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, leadRequestSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data

    const score = estimateLeadScore({
      budget: body.budget,
      urgency: body.urgency,
      message: body.message,
      phone: body.phone,
    })
    const details = [
      body.message,
      body.intent ? `Intentie: ${body.intent}` : "",
      body.budget > 0 ? `Buget detectat: EUR ${body.budget.toLocaleString("ro-RO")}` : "",
      Object.keys(body.context).length ? `Context website: ${JSON.stringify(body.context).slice(0, 1200)}` : "",
    ].filter(Boolean).join("\n")

    const lead = {
      id: crypto.randomUUID(),
      name: body.name,
      phone: body.phone || body.email || "contact-necompletat",
      email: body.email || null,
      message: details || null,
      status: "NEW",
      source: body.source,
      property_id: optionalUuid(body.property_id),
      score,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from("leads").insert(lead)

    if (error) return jsonError(error.message, 400)

    await Promise.allSettled([
      supabase.from("lead_history").insert({ lead_id: lead.id, status: "NEW", score, assigned_to: "website", note: "Lead creat din website si sincronizat in CRM." }),
      supabase.from("analytics_attribution").insert({ source: body.source, entity: "leads", entity_id: lead.id, lead_id: lead.id, value: body.budget || 0, metadata: body.context || {} }),
      supabase.from("admin_audit_log").insert({ actor: "website", action: "LEAD_CREATED", entity: "leads", entity_id: lead.id, details: lead, metadata: lead }),
    ])

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Lead request failed", 400)
  }
}
