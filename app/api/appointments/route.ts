import { getAdminClient, jsonError } from "@/lib/admin-api"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { data, error } = await getAdminClient().rpc("public_create_appointment", { payload })

    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return jsonError(error.message || "Appointment request failed", 400)
  }
}
