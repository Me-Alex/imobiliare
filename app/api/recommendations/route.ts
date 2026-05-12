import { NextResponse } from "next/server"
import { scoreProperty, type BuyerProfile } from "@/lib/experience"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const profile: BuyerProfile = {
      budget: Number(body.budget || 250000),
      area: String(body.area || "orice"),
      rooms: Number(body.rooms || 2),
      purpose: ["locuire", "investitie", "familie", "birou"].includes(body.purpose) ? body.purpose : "locuire",
    }

    const { data, error } = await supabase.from("properties").select("*").eq("status", "PUBLISHED").limit(30)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const recommendations = (data || [])
      .map((property) => ({ property, ...scoreProperty(property, profile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return NextResponse.json({ profile, recommendations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Recommendation request failed" }, { status: 500 })
  }
}
