import { jsonError } from "@/lib/admin-api"
import { listPropertyFacets } from "@/lib/property-search"
import { rateLimit } from "@/lib/rate-limit"
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"


export async function GET(request: Request) {
  const limited = await rateLimit(request, "search-suggestions", 120, 60_000)
  if (limited) return limited

  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") || "").trim().toLowerCase()
    const facets = await listPropertyFacets()
    const { data: poi } = await supabase.from("zone_poi").select("zone,name,category").limit(200)
    const raw = [
      ...facets.zones.map((value) => ({ type: "zone", value })),
      ...facets.types.map((value) => ({ type: "tip", value })),
      ...(Array.isArray(poi) ? poi.flatMap((item) => [item.zone, item.name].filter(Boolean).map((value) => ({ type: item.category || "poi", value }))) : []),
    ]
    const suggestions = raw
      .filter((item, index, rows) => item.value && rows.findIndex((row) => row.value === item.value) === index)
      .filter((item) => !q || String(item.value).toLowerCase().includes(q))
      .slice(0, 20)
    return NextResponse.json({ suggestions })
  } catch (error: any) {
    return jsonError(error.message || "Search suggestions failed", 400)
  }
}
