# Deployment

- Build target: Cloudflare Pages (`imobiliare2`) using `@cloudflare/next-on-pages`.
- Build command: `npm run cloudflare:build`.
- Output directory: `.vercel/output/static`.
- Data/auth: Supabase. Admin access uses Supabase Auth Bearer tokens and `admin_roles` RBAC, not Basic Auth.
- Required public variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Required admin variables: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_BOOTSTRAP_EMAILS`, `ADMIN_SESSION_SIGNING_SECRET`.
- Recommended security variables: `RATE_LIMIT_SALT`, `RESEND_WEBHOOK_SECRET`, `TWILIO_WEBHOOK_AUTH_TOKEN` or `TWILIO_AUTH_TOKEN`, `DOCUSIGN_HMAC_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Provider variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_WORKSPACE_IMPERSONATE_EMAIL`, `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_BASE_URL`, `STRIPE_SECRET_KEY`.
- Legacy variables no longer used by admin runtime routes: `ADMIN_PASSWORD`, `ADMIN_RPC_SECRET`, `ADMIN_ALLOWED_USERS`.
- Missing provider credentials do not block the dashboard; provider actions return safe admin errors and write failed provider jobs.
- Provider webhooks require valid signatures before mutating database state. If `SUPABASE_SERVICE_ROLE_KEY` is missing, webhooks fail with a clear 503 instead of silently accepting events.
- Worker-only OpenNext commands are kept under `worker:*` for a future Workers migration, but Pages production should use `cloudflare:build`.
- Not used: Vercel hosting.
