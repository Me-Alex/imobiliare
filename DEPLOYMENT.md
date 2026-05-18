# Deployment

- Runtime target: Cloudflare Workers through OpenNext (`@opennextjs/cloudflare`).
- Worker build: `npm run worker:build`.
- Worker deploy: `npm run worker:deploy`.
- Cloudflare config: `wrangler.jsonc` uses `main: .open-next/worker.js` and `assets.directory: .open-next/assets`.
- Legacy Pages build compatibility: `npm run cloudflare:build` / `npm run pages:build` builds OpenNext and prepares fallback static assets for the existing Pages project while production traffic is intended to run through the Worker.
- Production builds use `next build --webpack`; this avoids Next 16 Turbopack server chunk loading failures in the Worker runtime.
- Data/auth: Supabase. Admin access uses Supabase Auth Bearer tokens and `admin_roles` RBAC, not Basic Auth.
- Required public variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN`.
- Required admin variables: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_BOOTSTRAP_EMAILS`, `RATE_LIMIT_SALT`.
- Provider variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_WORKSPACE_IMPERSONATE_EMAIL`, `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_BASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Legacy variables no longer used by admin runtime routes: `ADMIN_PASSWORD`, `ADMIN_RPC_SECRET`, `ADMIN_ALLOWED_USERS`.
- Missing provider credentials do not block the dashboard; provider actions return safe admin errors and write failed provider jobs.
- Admin readiness is visible under Admin -> Integrations through `runtime_health`.
- Public health check: `/api/health`.
- Live audit: `npm run audit:live`.
- Full local verification: `npm run verify:cloudflare`.
