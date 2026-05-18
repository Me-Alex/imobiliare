import { jsonError, requireAdminPermissionAsync } from "@/lib/admin-api"
import { normalizePropertyPayload } from "@/lib/admin-properties"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  const auth = await requireAdminPermissionAsync(request, "bulk")
  if ("error" in auth) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return jsonError("Nu exista randuri de import.", 400)
    const dryRun = Boolean(body.dry_run || body.preview)
    const preview = buildPreview(rows)
    const normalized = preview.validRows.map((row) => normalizePropertyPayload(row))

    if (dryRun) {
      const result = {
        type: "properties",
        status: preview.errors.length ? "PREVIEW_WITH_ERRORS" : "PREVIEW_READY",
        total_count: rows.length,
        success_count: normalized.length,
        error_count: preview.errors.length,
        errors: preview.errors,
        preview: { rows: normalized.slice(0, 20) },
        created_by: auth.session.actor,
        updated_at: new Date().toISOString(),
      }
      await auth.supabase.from("admin_bulk_imports").insert(result)
      return NextResponse.json({ preview: result })
    }

    if (!normalized.length) {
      const result = { type: "properties", status: "FAILED", total_count: rows.length, success_count: 0, error_count: preview.errors.length || rows.length, errors: preview.errors.length ? preview.errors : [{ message: "Nu exista randuri valide." }], preview: { rows: [] }, created_by: auth.session.actor, updated_at: new Date().toISOString() }
      await auth.supabase.from("admin_bulk_imports").insert(result)
      return jsonError("Importul nu are randuri valide.", 400)
    }

    const { data, error } = await auth.supabase.from("properties").upsert(normalized, { onConflict: "slug" }).select("id,title,slug,status")
    const result = { type: "properties", status: error ? "FAILED" : (preview.errors.length ? "DONE_WITH_ERRORS" : "DONE"), total_count: rows.length, success_count: error ? 0 : (data || []).length, error_count: error ? rows.length : preview.errors.length, errors: error ? [{ message: error.message }] : preview.errors, preview: { rows: normalized.slice(0, 20) }, rollback_payload: { slugs: normalized.map((row) => row.slug) }, created_by: auth.session.actor, updated_at: new Date().toISOString() }
    await auth.supabase.from("admin_bulk_imports").insert(result)
    if (error) return jsonError(error.message, 400)
    return NextResponse.json({ imported: data || [], summary: result })
  } catch (error: any) {
    return jsonError(error.message || "Bulk import failed")
  }
}

function buildPreview(rows: Array<Record<string, any>>) {
  const seenSlugs = new Set<string>()
  const errors: Array<{ row: number; field?: string; message: string }> = []
  const validRows: Array<Record<string, any>> = []

  rows.forEach((row, index) => {
    const normalized = normalizePropertyPayload(row)
    const rowNumber = index + 2
    if (!normalized.title || normalized.title.length < 3) errors.push({ row: rowNumber, field: "title", message: "Titlul este obligatoriu." })
    if (normalized.price <= 0) errors.push({ row: rowNumber, field: "price", message: "Pretul trebuie sa fie pozitiv." })
    if (normalized.area_sqm <= 0) errors.push({ row: rowNumber, field: "area_sqm", message: "Suprafata trebuie sa fie pozitiva." })
    if (seenSlugs.has(normalized.slug)) errors.push({ row: rowNumber, field: "slug", message: `Slug duplicat in fisier: ${normalized.slug}` })
    if (String(normalized.status).toUpperCase() === "PUBLISHED" && !normalized.cover_image_url) errors.push({ row: rowNumber, field: "cover_image_url", message: "Listingurile publicate necesita cover image." })
    seenSlugs.add(normalized.slug)
    const rowErrors = errors.filter((error) => error.row === rowNumber)
    if (!rowErrors.length) validRows.push(row)
  })

  return { errors, validRows }
}

