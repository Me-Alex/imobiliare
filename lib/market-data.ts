import { getAdminClient } from "@/lib/admin-api"
import { getMarketSignal, localMarketMatrix, type MarketSignal } from "@/lib/complexity"
import { supabase } from "@/lib/supabase"

function asMarketRows(value: unknown): MarketSignal[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, any> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      zone: String(item.zone || "").trim(),
      avgPrice: Number(item.avgPrice ?? item.avg_price ?? 0),
      rentYield: Number(item.rentYield ?? item.rent_yield ?? 0),
      liquidity: Math.round(Number(item.liquidity ?? 0)),
      growth: Number(item.growth ?? 0),
      risk: String(item.risk || "mediu"),
      poi: Array.isArray(item.poi)
        ? item.poi.map(String).map((entry) => entry.trim()).filter(Boolean)
        : String(item.poi || "").split(",").map((entry) => entry.trim()).filter(Boolean),
      updated_at: item.updated_at ? String(item.updated_at) : null,
    }))
    .filter((item) => item.zone)
}

export async function loadMarketData(options?: { admin?: boolean }) {
  try {
    const client = options?.admin ? getAdminClient() : supabase
    const { data, error } = await client.from("market_data").select("*").order("updated_at", { ascending: false }).limit(200)
    if (error) return localMarketMatrix
    const rows = asMarketRows(data)
    return rows.length ? rows : localMarketMatrix
  } catch {
    return localMarketMatrix
  }
}

export async function loadMarketSignal(zone: string, options?: { admin?: boolean }) {
  const rows = await loadMarketData(options)
  return getMarketSignal(zone, rows)
}
