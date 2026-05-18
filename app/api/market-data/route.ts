import { NextResponse } from "next/server"
import { getMarketSignal } from "@/lib/complexity"
import { loadMarketData } from "@/lib/market-data"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const limited = await rateLimit(request, "market-data", 120, 60_000)
  if (limited) return limited

  try {
    const url = new URL(request.url)
    const zone = String(url.searchParams.get("zone") || "").trim()
    const rows = await loadMarketData()
    return NextResponse.json({
      market_data: rows,
      signal: zone ? getMarketSignal(zone, rows) : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Market data request failed" }, { status: 500 })
  }
}
