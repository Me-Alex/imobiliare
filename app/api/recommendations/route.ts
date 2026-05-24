import { NextResponse } from "next/server"
import { scoreProperty, type BuyerProfile } from "@/lib/experience"
import { PUBLIC_PROPERTY_SELECT, supabase } from "@/lib/supabase"
import { getClientSupabase, getClientToken } from "@/lib/client-api"
import { rateLimit } from "@/lib/rate-limit"



function numericInput(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, numeric))
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "recommendations", 30, 60_000)
  if (limited) return limited

  try {
    const body = await request.json().catch(() => ({}))
    const profile: BuyerProfile = {
      budget: numericInput(body.budget, 250000, 10_000, 50_000_000),
      area: String(body.area || "orice").trim().slice(0, 80) || "orice",
      rooms: Math.round(numericInput(body.rooms, 2, 1, 12)),
      purpose: ["locuire", "investitie", "familie", "birou"].includes(body.purpose) ? body.purpose : "locuire",
    }
    const token = getClientToken(request)
    const client = token ? getClientSupabase(token) : null
    const { data: authData } = client ? await client.auth.getUser(token) : { data: { user: null } as any }
    const user = authData?.user

    if (client && user) {
      const [{ data: savedProfile }, { data: favorites }, { data: offers }, { data: activity }] = await Promise.all([
        client.from("client_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        client.from("client_favorites").select("property:properties(city,rooms,type,price)").eq("user_id", user.id),
        client.from("property_offers").select("property_title, offer_price, status, property:properties(city,rooms,type,price)").eq("user_id", user.id).limit(20),
        client.from("client_activity").select("type, metadata, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ])
      if (savedProfile) {
        profile.budget = Number(savedProfile.budget || profile.budget)
        profile.area = Array.isArray(savedProfile.preferred_zones) && savedProfile.preferred_zones[0] ? savedProfile.preferred_zones[0] : profile.area
        profile.rooms = Number(savedProfile.rooms || profile.rooms)
        profile.purpose = ["locuire", "investitie", "familie", "birou"].includes(savedProfile.purpose) ? savedProfile.purpose : profile.purpose
      }
      const favoriteZone = (favorites || []).map((f: any) => f.property?.city).find(Boolean)
      if (favoriteZone && profile.area === "orice") profile.area = favoriteZone
      const offerBudget = (offers || []).map((offer: any) => Number(offer.offer_price || 0)).filter(Boolean).sort((a: number, b: number) => b - a)[0]
      if (offerBudget && offerBudget > profile.budget) profile.budget = offerBudget
      const viewedZone = (activity || []).map((item: any) => item.metadata?.property_city || item.metadata?.city).find(Boolean)
      if (viewedZone && profile.area === "orice") profile.area = viewedZone
    }

    const { data, error } = await supabase.from("properties").select(PUBLIC_PROPERTY_SELECT).eq("status", "PUBLISHED").limit(30)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const recommendations = (data || [])
      .map((property) => {
        const scored = scoreProperty(property, profile)
        const learnedBoost = user && profile.area !== "orice" && property.city.toLowerCase().includes(profile.area.toLowerCase()) ? 7 : 0
        const behaviorBoost = user && property.featured ? 4 : 0
        const reasons = [...scored.reasons]
        if (learnedBoost) reasons.push("potrivire invatata din activitate")
        if (behaviorBoost) reasons.push("selectie similara cu interesul tau")
        return { property, ...scored, reasons: reasons.slice(0, 5), score: Math.min(100, scored.score + learnedBoost + behaviorBoost), learnedBoost, behaviorBoost }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return NextResponse.json({ profile, recommendations, learnedFromAccount: Boolean(user) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Recommendation request failed" }, { status: 500 })
  }
}
