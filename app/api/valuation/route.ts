import { NextResponse } from "next/server"
import { parseJsonBody, valuationSchema } from "@/lib/api-validation"
import { calculateValuation } from "@/lib/complexity"
import { loadMarketData } from "@/lib/market-data"
import { rateLimit } from "@/lib/rate-limit"


export async function POST(request: Request) {
  const limited = await rateLimit(request, "valuation", 30, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, valuationSchema)
    if ("error" in parsed) return parsed.error
    const body = parsed.data
    const marketData = await loadMarketData()

    const valuation = calculateValuation({
      area: body.area,
      rooms: body.rooms,
      zone: body.zone,
      condition: body.condition,
      parking: body.parking,
      floor: body.floor,
    }, marketData)

    return NextResponse.json({ valuation })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Valuation request failed" }, { status: 500 })
  }
}
