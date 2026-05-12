import { NextResponse } from "next/server"
import { buildViewingSlots } from "@/lib/complexity"

export const runtime = "edge"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const urgency = url.searchParams.get("urgency") || "normal"
  const slots = buildViewingSlots(["rapid", "normal", "flexibil"].includes(urgency) ? urgency as any : "normal")

  return NextResponse.json({ slots })
}
