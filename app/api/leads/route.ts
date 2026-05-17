import { getAdminClient, getAdminRpcSecret, jsonError } from "@/lib/admin-api"
import { leadRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { estimateLeadScore } from "@/lib/experience"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = rateLimit(request, "public-leads", 10, 60_000)
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

    const { data, error } = await getAdminClient().rpc("admin_mutate_lead", {
      admin_secret: getAdminRpcSecret(),
      actor_name: "website",
      payload: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        message: details,
        status: "NEW",
        source: body.source,
        property_id: body.property_id || "",
        score,
        note: "Lead creat din website si sincronizat in CRM.",
      },
    })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Lead request failed", 400)
  }
}
