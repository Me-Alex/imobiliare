import { NextResponse } from "next/server"
import { z } from "zod"

const emptyStringToUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : undefined
  }
  return value
}

export const optionalText = (max = 500) =>
  z.preprocess(emptyStringToUndefined, z.string().trim().max(max).optional())

export const requiredText = (min = 1, max = 500) =>
  z.preprocess(emptyStringToUndefined, z.string().trim().min(min).max(max))

export const optionalEmail = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().email("Email invalid.").max(160).optional(),
)

export const safeNumber = (fallback: number, min: number, max: number) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return fallback
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }, z.number().min(min).max(max))

export const safeInteger = (fallback: number, min: number, max: number) =>
  safeNumber(fallback, min, max).transform((value) => Math.round(value))

export const metadataSchema = z.record(z.string(), z.unknown()).catch({})

export const riskLevelSchema = z.enum(["scazut", "mediu", "ridicat"]).catch("mediu")

export const leadRequestSchema = z.object({
  name: requiredText(2, 120),
  phone: optionalText(40).default(""),
  email: optionalEmail.default(""),
  message: optionalText(2500).default(""),
  urgency: optionalText(40),
  intent: optionalText(80),
  source: optionalText(80).default("CONTACT_FORM"),
  property_id: optionalText(80).default(""),
  budget: safeNumber(0, 0, 50_000_000),
  context: metadataSchema,
}).refine((value) => value.phone.length >= 7 || Boolean(value.email), {
  message: "Telefonul sau emailul este obligatoriu.",
  path: ["phone"],
})

export const appointmentRequestSchema = z.object({
  name: requiredText(2, 120),
  phone: requiredText(7, 40),
  email: optionalEmail.default(""),
  requested_at: optionalText(80),
  notes: optionalText(2000).default(""),
  property_id: optionalText(80).default(""),
  property_title: optionalText(180),
  slot_id: optionalText(80),
})

export const clientAppointmentRequestSchema = appointmentRequestSchema.partial({
  name: true,
  phone: true,
  email: true,
}).extend({
  notes: optionalText(2000).default(""),
  property_id: optionalText(80).nullable().default(null),
  slot_id: optionalText(80).nullable().default(null),
})

export const clientAccountSchema = z.object({
  full_name: optionalText(140),
  name: optionalText(140),
  phone: optionalText(40).nullable().default(null),
  budget: safeNumber(250_000, 0, 50_000_000),
  preferred_zones: z.union([z.array(z.string().max(80)), z.string().max(500)]).optional().default([]),
  rooms: safeInteger(2, 1, 12),
  purpose: optionalText(40).default("locuire"),
  financing_status: optionalText(80).default("neconfirmat"),
})

export const favoriteRequestSchema = z.object({
  property_id: requiredText(1, 80),
  notes: optionalText(500).nullable().default(null),
})

export const savedSearchSchema = z.object({
  id: optionalText(80).nullable().default(null),
  label: requiredText(2, 120),
  query: optionalText(160).default(""),
  filters: metadataSchema,
  results_count: safeInteger(0, 0, 100000),
  notifications_enabled: z.boolean().default(true),
})

export const offerDraftSchema = z.object({
  propertyTitle: optionalText(160).default("Proprietate HQS"),
  listPrice: safeNumber(250_000, 1_000, 50_000_000),
  clientBudget: safeNumber(0, 0, 50_000_000),
  advancePercent: safeNumber(20, 1, 95),
  closingDays: safeInteger(30, 1, 365),
  riskLevel: riskLevelSchema,
})

export const clientOfferSchema = z.object({
  property_id: optionalText(80).nullable().default(null),
  property_title: optionalText(160).default("Proprietate HQS"),
  client_name: optionalText(140),
  list_price: safeNumber(0, 0, 50_000_000),
  offer_price: safeNumber(0, 0, 50_000_000),
  client_budget: safeNumber(0, 0, 50_000_000),
  advance_percent: safeNumber(20, 1, 95),
  closing_days: safeInteger(30, 1, 365),
  risk_level: riskLevelSchema,
  notes: optionalText(2000),
})

export const clientDocumentSchema = z.object({
  title: optionalText(160).default("Document client"),
  type: optionalText(80).default("act client"),
  status: optionalText(40).default("PENDING"),
  url: optionalText(1000).nullable().default(null),
  expires_at: optionalText(80).nullable().default(null),
  checklist: z.array(z.object({ label: requiredText(1, 160), done: z.boolean().default(false) })).optional(),
  notes: optionalText(1000).nullable().default(null),
})

export const clientActivitySchema = z.object({
  type: optionalText(80).default("CLIENT_NOTE"),
  title: optionalText(180).default("Nota client"),
  description: optionalText(2000).nullable().default(null),
  metadata: metadataSchema,
})

export const clientNotificationUpdateSchema = z.object({
  id: optionalText(80),
  ids: z.array(z.string().trim().min(1).max(80)).max(100).optional().default([]),
  action: z.enum(["read", "unread", "read_all"]).default("read"),
}).refine((value) => value.action === "read_all" || Boolean(value.id) || value.ids.length > 0, {
  message: "id sau ids sunt obligatorii.",
  path: ["id"],
})

export const ownerFeedbackSchema = z.object({
  property_id: requiredText(1, 80),
  rating: safeInteger(5, 1, 5),
  category: optionalText(80).default("GENERAL"),
  message: requiredText(3, 2000),
})

export const adminMediaUploadSchema = z.object({
  property_id: requiredText(1, 80),
  file_name: requiredText(1, 180),
  content_type: optionalText(120).default("application/octet-stream"),
  kind: z.enum(["cover", "gallery", "floorplan"]).default("gallery"),
  size: safeNumber(0, 0, 50_000_000),
  checksum: optionalText(160).nullable().default(null),
  width: safeInteger(0, 0, 20000),
  height: safeInteger(0, 0, 20000),
})

export const propertyViewSchema = z.object({
  property_id: requiredText(1, 80),
  property_slug: optionalText(160).nullable().default(null),
  property_title: optionalText(180).nullable().default(null),
  property_city: optionalText(120).nullable().default(null),
  price: safeNumber(0, 0, 50_000_000),
  rooms: safeInteger(0, 0, 20),
  source: optionalText(80).default("property_page"),
})

export const valuationSchema = z.object({
  area: safeNumber(70, 15, 2_000),
  rooms: safeInteger(2, 1, 12),
  zone: optionalText(120).default("Bucuresti Nord"),
  condition: z.enum(["renovat", "bun", "de-renovat", "premium"]).catch("bun"),
  parking: safeInteger(0, 0, 8),
  floor: z.preprocess(emptyStringToUndefined, z.coerce.number().finite().optional()),
})

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path.length ? `${issue.path.join(".")}: ` : ""
    return {
      error: NextResponse.json(
        { error: `${path}${issue?.message || "Date invalide."}` },
        { status: 400 },
      ),
    }
  }

  return { data: parsed.data }
}
