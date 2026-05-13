import { getAdminClient, getAdminRpcSecret } from "@/lib/admin-api"
import { requireClient } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const { data, error } = await getAdminClient().rpc("admin_list_appointments", {
      admin_secret: getAdminRpcSecret(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const email = String(session.user.email || "").toLowerCase()
    const appointments = (Array.isArray(data) ? data : []).filter((item: any) => String(item.client_email || "").toLowerCase() === email)
    return NextResponse.json({ appointments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client appointments request failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "client-appointments", 8, 60_000)
  if (limited) return limited

  const session = await requireClient(request)
  if ("error" in session) return session.error

  try {
    const body = await request.json().catch(() => ({}))
    const profile = await session.supabase
      .from("client_profiles")
      .select("full_name, phone")
      .eq("user_id", session.user.id)
      .maybeSingle()

    const payload = {
      property_id: body.property_id || null,
      slot_id: body.slot_id || null,
      requested_at: body.requested_at || body.starts_at || new Date().toISOString(),
      client_name: body.client_name || profile.data?.full_name || session.user.email || "Client HQS",
      client_email: session.user.email,
      client_phone: body.client_phone || profile.data?.phone || null,
      notes: body.notes || "Programare trimisa din portalul clientului.",
    }

    const { data, error } = await getAdminClient().rpc("public_create_appointment", { payload })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await session.supabase.from("client_activity").insert({
      user_id: session.user.id,
      type: "APPOINTMENT_REQUESTED",
      title: "Programare solicitata",
      description: "Clientul a solicitat o vizionare din portal.",
      metadata: { appointment: data, property_id: payload.property_id, slot_id: payload.slot_id },
    })

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Client appointment save failed" }, { status: 500 })
  }
}
