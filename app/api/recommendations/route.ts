import { NextResponse } from "next/server"
import { scoreProperty, type BuyerProfile } from "@/lib/experience"
import { supabase } from "@/lib/supabase"
import { getClientSupabase, getClientToken } from "@/lib/client-api"

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
    const token = getClientToken(request)
    const client = token ? getClientSupabase(token) : null
    const { data: authData } = client ? await client.auth.getUser(token) : { data: { user: null } as any }
    const user = authData?.user

    if (client && user) {
      const [{ data: savedProfile }, { data: favorites }] = await Promise.all([
        client.from("client_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        client.from("client_favorites").select("property:properties(city,rooms,type,price)").eq("user_id", user.id),
      ])
      if (savedProfile) {
        profile.budget = Number(savedProfile.budget || profile.budget)
        profile.area = Array.isArray(savedProfile.preferred_zones) && savedProfile.preferred_zones[0] ? savedProfile.preferred_zones[0] : profile.area
        profile.rooms = Number(savedProfile.rooms || profile.rooms)
        profile.purpose = ["locuire", "investitie", "familie", "birou"].includes(savedProfile.purpose) ? savedProfile.purpose : profile.purpose
      }
      const favoriteZone = (favorites || []).map((f: any) => f.property?.city).find(Boolean)
      if (favoriteZone && profile.area === "orice") profile.area = favoriteZone
    }

    const { data, error } = await supabase.from("properties").select("*").eq("status", "PUBLISHED").limit(30)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const recommendations = (data || [])
      .map((property) => {
        const scored = scoreProperty(property, profile)
        const learnedBoost = user && profile.area !== "orice" && property.city.toLowerCase().includes(profile.area.toLowerCase()) ? 7 : 0
        return { property, ...scored, score: Math.min(100, scored.score + learnedBoost), learnedBoost }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return NextResponse.json({ profile, recommendations, learnedFromAccount: Boolean(user) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Recommendation request failed" }, { status: 500 })
  }
}
