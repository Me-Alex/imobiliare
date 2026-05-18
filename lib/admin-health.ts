import { getRuntimeEnv } from "@/lib/admin-api"
import { providerStatus } from "@/lib/admin-integrations"

type EnvVar = {
  key: string
  required: boolean
  label: string
  group: "core" | "provider" | "webhook" | "public"
}

export const adminRuntimeEnvVars: EnvVar[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, label: "URL public Supabase", group: "public" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, label: "Cheie anonima Supabase", group: "public" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, label: "Cheie service role Supabase", group: "core" },
  { key: "ADMIN_BOOTSTRAP_EMAILS", required: true, label: "Emailuri bootstrap admin", group: "core" },
  { key: "RATE_LIMIT_SALT", required: true, label: "Salt pentru rate limit", group: "core" },
  { key: "RESEND_API_KEY", required: false, label: "Cheie API Resend", group: "provider" },
  { key: "RESEND_FROM_EMAIL", required: false, label: "Expeditor Resend", group: "provider" },
  { key: "TWILIO_ACCOUNT_SID", required: false, label: "Twilio SID", group: "provider" },
  { key: "TWILIO_AUTH_TOKEN", required: false, label: "Token Twilio", group: "provider" },
  { key: "TWILIO_FROM_NUMBER", required: false, label: "Expeditor Twilio", group: "provider" },
  { key: "GOOGLE_CALENDAR_ID", required: false, label: "Google Calendar ID", group: "provider" },
  { key: "GOOGLE_SERVICE_ACCOUNT_EMAIL", required: false, label: "Email service account Google", group: "provider" },
  { key: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", required: false, label: "Cheie privata Google", group: "provider" },
  { key: "GOOGLE_WORKSPACE_IMPERSONATE_EMAIL", required: false, label: "Utilizator delegat Google", group: "provider" },
  { key: "DOCUSIGN_INTEGRATION_KEY", required: false, label: "Cheie integrare DocuSign", group: "provider" },
  { key: "DOCUSIGN_USER_ID", required: false, label: "ID utilizator DocuSign", group: "provider" },
  { key: "DOCUSIGN_ACCOUNT_ID", required: false, label: "ID cont DocuSign", group: "provider" },
  { key: "DOCUSIGN_PRIVATE_KEY", required: false, label: "Cheie privata DocuSign", group: "provider" },
  { key: "DOCUSIGN_BASE_URL", required: false, label: "URL de baza DocuSign", group: "provider" },
  { key: "STRIPE_SECRET_KEY", required: false, label: "Cheie secreta Stripe", group: "provider" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, label: "Secret webhook Stripe", group: "webhook" },
]

export function buildAdminRuntimeHealth() {
  const env = getRuntimeEnv()
  const variables = adminRuntimeEnvVars.map((item) => ({
    ...item,
    configured: Boolean(env[item.key]),
  }))
  const missingRequired = variables.filter((item) => item.required && !item.configured)
  const missingOptional = variables.filter((item) => !item.required && !item.configured)
  const providers = providerStatus()
  const readyProviders = Object.values(providers).filter(Boolean).length

  return {
    generated_at: new Date().toISOString(),
    deployment: {
      target: "cloudflare-workers-opennext",
      next: "16.2.6",
    },
    summary: {
      ok: missingRequired.length === 0,
      required: variables.filter((item) => item.required).length,
      configuredRequired: variables.filter((item) => item.required && item.configured).length,
      missingRequired: missingRequired.length,
      optional: variables.filter((item) => !item.required).length,
      configuredOptional: variables.filter((item) => !item.required && item.configured).length,
      missingOptional: missingOptional.length,
      readyProviders,
      totalProviders: Object.keys(providers).length,
    },
    providers,
    variables,
  }
}
