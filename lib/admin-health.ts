import { getRuntimeEnv } from "@/lib/admin-api"
import { providerStatus } from "@/lib/admin-integrations"

type EnvVar = {
  key: string
  required: boolean
  label: string
  group: "core" | "provider" | "webhook" | "public"
}

export const adminRuntimeEnvVars: EnvVar[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, label: "Supabase public URL", group: "public" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, label: "Supabase anon key", group: "public" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, label: "Supabase service role", group: "core" },
  { key: "ADMIN_BOOTSTRAP_EMAILS", required: true, label: "Bootstrap admin emails", group: "core" },
  { key: "RATE_LIMIT_SALT", required: true, label: "Rate limit hashing salt", group: "core" },
  { key: "RESEND_API_KEY", required: false, label: "Resend API key", group: "provider" },
  { key: "RESEND_FROM_EMAIL", required: false, label: "Resend sender", group: "provider" },
  { key: "TWILIO_ACCOUNT_SID", required: false, label: "Twilio SID", group: "provider" },
  { key: "TWILIO_AUTH_TOKEN", required: false, label: "Twilio token", group: "provider" },
  { key: "TWILIO_FROM_NUMBER", required: false, label: "Twilio sender", group: "provider" },
  { key: "GOOGLE_CALENDAR_ID", required: false, label: "Google Calendar ID", group: "provider" },
  { key: "GOOGLE_SERVICE_ACCOUNT_EMAIL", required: false, label: "Google service email", group: "provider" },
  { key: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", required: false, label: "Google private key", group: "provider" },
  { key: "GOOGLE_WORKSPACE_IMPERSONATE_EMAIL", required: false, label: "Google delegated user", group: "provider" },
  { key: "DOCUSIGN_INTEGRATION_KEY", required: false, label: "DocuSign integration key", group: "provider" },
  { key: "DOCUSIGN_USER_ID", required: false, label: "DocuSign user ID", group: "provider" },
  { key: "DOCUSIGN_ACCOUNT_ID", required: false, label: "DocuSign account ID", group: "provider" },
  { key: "DOCUSIGN_PRIVATE_KEY", required: false, label: "DocuSign private key", group: "provider" },
  { key: "DOCUSIGN_BASE_URL", required: false, label: "DocuSign base URL", group: "provider" },
  { key: "STRIPE_SECRET_KEY", required: false, label: "Stripe secret key", group: "provider" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, label: "Stripe webhook secret", group: "webhook" },
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
