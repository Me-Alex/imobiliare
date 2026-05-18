import { jsonError } from "@/lib/admin-api"
import { ownerFeedbackSchema, parseJsonBody } from "@/lib/api-validation"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const limited = await rateLimit(request, "owner-feedback", 20, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  const parsed = await parseJsonBody(request, ownerFeedbackSchema)
  if ("error" in parsed) return parsed.error

  const email = String(session.user.email || "").trim().toLowerCase()
  const { data: property, error: propertyError } = await session.supabase
    .from("properties")
    .select("id,title,owner_email")
    .eq("id", parsed.data.property_id)
    .maybeSingle()

  if (propertyError) return jsonError(propertyError.message, 400)
  if (!property || String(property.owner_email || "").toLowerCase() !== email) {
    return jsonError("Proprietatea nu este asociata contului autentificat.", 403)
  }

  const { data, error } = await session.supabase
    .from("owner_feedback")
    .insert({
      owner_user_id: session.user.id,
      owner_email: email,
      property_id: parsed.data.property_id,
      rating: parsed.data.rating,
      category: parsed.data.category,
      message: parsed.data.message,
      status: "NEW",
    })
    .select("*")
    .single()

  if (error) return jsonError(error.message, 400)
  return NextResponse.json({ feedback: data })
}
