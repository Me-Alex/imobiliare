import { featureCatalog, featureCategories } from "@/lib/feature-catalog"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  const live = featureCatalog.filter((item) => item.status === "live").length
  const next = featureCatalog.filter((item) => item.status === "next").length
  const planned = featureCatalog.filter((item) => item.status === "planned").length

  return NextResponse.json({
    total: featureCatalog.length,
    summary: { live, next, planned, maturity: Math.round((live / featureCatalog.length) * 100) },
    categories: featureCategories,
    features: featureCatalog,
  })
}
