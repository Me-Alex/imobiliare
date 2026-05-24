import { PUBLIC_PROPERTY_SELECT, supabase } from "@/lib/supabase"

export async function getPortalProperties() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(PUBLIC_PROPERTY_SELECT)
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal)

    if (error) return []
    return data || []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}
