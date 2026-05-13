import { getAdminClient, jsonError } from "@/lib/admin-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"


export async function POST(request: Request) {
  const limited = rateLimit(request, "appointments", 8, 60_000)
  if (limited) return limited

  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("public_create_appointment", { payload })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Appointment request failed", 400)
  }
}
