import { jsonError } from "@/lib/admin-api"
import { propertyFiltersFromUrl, searchPublishedProperties } from "@/lib/property-search"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const limited = await rateLimit(request, "properties-search", 120, 60_000)
  if (limited) return limited

  try {
    const filters = propertyFiltersFromUrl(new URL(request.url))
    const result = await searchPublishedProperties(filters)
    return NextResponse.json(result)
  } catch (error: any) {
    return jsonError(error.message || "Property search failed", 400)
  }
}
