import { getMarketSignal, localMarketMatrix, type MarketSignal } from "@/lib/complexity"
import { supabase } from "@/lib/supabase"

export type MarketDataRow = {
  id?: string
  zone: string
  avg_price: number
  rent_yield: number
  liquidity: number
  growth: number
  risk: "scazut" | "mediu" | "ridicat"
  poi: string[]
  source?: string | null
  effective_at?: string | null
  status?: string
  updated_at?: string
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

export function marketRowToSignal(row: Partial<MarketDataRow>): MarketSignal {
  return {
    zone: String(row.zone || "Bucuresti Nord"),
    avgPrice: Number(row.avg_price || 0),
    rentYield: Number(row.rent_yield || 0),
    liquidity: Number(row.liquidity || 0),
    growth: Number(row.growth || 0),
    risk: row.risk || "mediu",
    poi: Array.isArray(row.poi) ? row.poi.map(String) : [],
  }
}

export function normalizeMarketDataPayload(payload: Record<string, any>) {
  const zone = String(payload.zone || "").trim()
  const risk = ["scazut", "mediu", "ridicat"].includes(String(payload.risk)) ? String(payload.risk) : "mediu"
  return {
    zone,
    avg_price: Math.max(0, Number(payload.avg_price ?? payload.avgPrice ?? 0) || 0),
    rent_yield: Math.max(0, Number(payload.rent_yield ?? payload.rentYield ?? 0) || 0),
    liquidity: Math.max(0, Math.min(100, Math.round(Number(payload.liquidity ?? 70) || 70))),
    growth: Number(payload.growth ?? 0) || 0,
    risk,
    poi: Array.isArray(payload.poi) ? payload.poi.map(String).filter(Boolean) : String(payload.poi || "").split(",").map((item) => item.trim()).filter(Boolean),
    source: payload.source || "admin",
    effective_at: payload.effective_at || new Date().toISOString().slice(0, 10),
    status: payload.status || "ACTIVE",
    updated_at: new Date().toISOString(),
  }
}

export async function listMarketData(): Promise<MarketDataRow[]> {
  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .eq("status", "ACTIVE")
    .order("zone", { ascending: true })
    .limit(100)

  if (error || !Array.isArray(data)) {
    return localMarketMatrix.map((item) => ({
      zone: item.zone,
      avg_price: item.avgPrice,
      rent_yield: item.rentYield,
      liquidity: item.liquidity,
      growth: item.growth,
      risk: item.risk as MarketDataRow["risk"],
      poi: item.poi,
      source: "local_fallback",
      status: "ACTIVE",
    }))
  }

  return data as MarketDataRow[]
}

export async function loadMarketSignal(zone: string): Promise<MarketSignal> {
  const fallback = getMarketSignal(zone || "Bucuresti Nord")
  const rows = await listMarketData()
  const q = normalizeText(zone || fallback.zone)
  const exact = rows.find((row) => normalizeText(row.zone) === q)
  const fuzzy = rows.find((row) => {
    const candidate = normalizeText(row.zone)
    return q.includes(candidate) || candidate.includes(q)
  })
  return marketRowToSignal(exact || fuzzy || {
    zone: fallback.zone,
    avg_price: fallback.avgPrice,
    rent_yield: fallback.rentYield,
    liquidity: fallback.liquidity,
    growth: fallback.growth,
    risk: fallback.risk as MarketDataRow["risk"],
    poi: fallback.poi,
  })
}
