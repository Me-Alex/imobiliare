import { getAdminClient, jsonError } from "@/lib/admin-api"
import { appointmentRequestSchema, parseJsonBody } from "@/lib/api-validation"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"



export async function POST(request: Request) {
  const limited = rateLimit(request, "appointments", 8, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, appointmentRequestSchema)
    if ("error" in parsed) return parsed.error

    const { data, error } = await getAdminClient().rpc("public_create_appointment", { payload: parsed.data })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Appointment request failed", 400)
  }
}
