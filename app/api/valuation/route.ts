import { NextResponse } from "next/server"
import { calculateValuation } from "@/lib/complexity"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const valuation = calculateValuation({
      area: Number(body.area || 70),
      rooms: Number(body.rooms || 2),
      zone: String(body.zone || "Bucuresti Nord"),
      condition: ["renovat", "bun", "de-renovat", "premium"].includes(body.condition) ? body.condition : "bun",
      parking: Number(body.parking || 0),
      floor: body.floor === undefined ? undefined : Number(body.floor),
    })

    return NextResponse.json({ valuation })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Valuation request failed" }, { status: 500 })
  }
}
