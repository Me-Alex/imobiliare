import { NextResponse } from "next/server"
import { supabaseUrl } from "@/lib/supabase"

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hqs-imobiliare",
    target: "cloudflare-workers-opennext",
    supabase: Boolean(supabaseUrl),
    checked_at: new Date().toISOString(),
  })
}
