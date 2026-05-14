import { getAdminClient, getAdminRpcSecret, jsonError } from "@/lib/admin-api"
import { estimateLeadScore } from "@/lib/experience"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = rateLimit(request, "public-leads", 10, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body.name || "").trim()
    const phone = String(body.phone || "").trim()
    const email = body.email ? String(body.email).trim() : ""
    const message = String(body.message || "").trim()

    if (name.length < 2) return jsonError("Numele este obligatoriu.", 400)
    if (phone.length < 7 && !email.includes("@")) return jsonError("Telefonul sau emailul este obligatoriu.", 400)

    const score = estimateLeadScore({
      budget: Number(body.budget || 0),
      urgency: body.urgency ? String(body.urgency) : undefined,
      message,
      phone,
    })
    const context = body.context && typeof body.context === "object" ? body.context : {}
    const details = [
      message,
      body.intent ? `Intentie: ${String(body.intent)}` : "",
      Number(body.budget) > 0 ? `Buget detectat: EUR ${Number(body.budget).toLocaleString("ro-RO")}` : "",
      Object.keys(context).length ? `Context website: ${JSON.stringify(context).slice(0, 1200)}` : "",
    ].filter(Boolean).join("\n")

    const { data, error } = await getAdminClient().rpc("admin_mutate_lead", {
      admin_secret: getAdminRpcSecret(),
      actor_name: "website",
      payload: {
        name,
        phone,
        email: email || null,
        message: details,
        status: "NEW",
        source: String(body.source || "CONTACT_FORM"),
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
