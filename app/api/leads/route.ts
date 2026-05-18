import { getAdminClient, getEnv, jsonError } from "@/lib/admin-api"
import { optionalUuid } from "@/lib/admin-properties"
import { leadRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { estimateLeadScore } from "@/lib/experience"
import { rateLimit } from "@/lib/rate-limit"
import { supabase as publicSupabase } from "@/lib/supabase"
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

    const row = {
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

    if (!getEnv("SUPABASE_SERVICE_ROLE_KEY")) {
      const { error } = await publicSupabase.from("leads").insert(row)
      if (error) return jsonError(error.message, 400)
      return NextResponse.json({ lead: { status: "created" } }, { status: 201 })
    }

    const supabase = getAdminClient()
    const { data, error } = await supabase.from("leads").insert(row).select("*").single()

    if (error) return jsonError(error.message, 400)

    await Promise.allSettled([
      supabase.from("lead_history").insert({ lead_id: data.id, status: "NEW", score, assigned_to: "website", note: "Lead creat din website si sincronizat in CRM." }),
      supabase.from("analytics_attribution").insert({ source: body.source, entity: "leads", entity_id: data.id, lead_id: data.id, value: body.budget || 0, metadata: body.context || {} }),
      supabase.from("admin_audit_log").insert({ actor: "website", action: "LEAD_CREATED", entity: "leads", entity_id: data.id, details: data, metadata: data }),
    ])

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Lead request failed", 400)
  }
}
