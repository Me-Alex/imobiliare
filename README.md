# HQS Imobiliare

A responsive real-estate platform for Bucharest, built with Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, Supabase, and OpenNext for Cloudflare.

## Local setup

Requirements: Node.js 20+ and [Bun](https://bun.sh/).

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run db:generate
bun run dev
```

The development server runs at `http://localhost:3000`. The included SQLite database contains demo listings and is configured by the example environment file.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma database URL for local development |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/publishable Supabase browser key |
| `ZAI_API_KEY` | Server-only AI provider credential; configure it as a Cloudflare Worker secret |
| `ZAI_API_URL` | Optional server-only AI chat-completions endpoint |

Copy `.env.example` to `.env` and keep real credentials out of version control. Never place GitHub tokens, Cloudflare API tokens, Supabase secret keys, or service-role keys in client variables or committed files.

## Quality checks

```bash
bun run lint
bun run typecheck
bun run build
# or run all three
bun run check
```

## Authentication checks

Supabase Auth and its `profiles` table must be available for account access. An unavailable profile now shows a retry screen; the app does not assume an active Client account. A suspended account is denied by the API even if an older admin registry entry still exists.

In Supabase **Authentication → URL Configuration**, set the production Site URL and allow both exact callback URLs for each deployment you support:

- `https://hqs-imobiliare.floreaalexandru2002.workers.dev/?page=login&auth_callback=google`
- `https://hqs-imobiliare.floreaalexandru2002.workers.dev/?page=login&auth_callback=email`

Add the equivalent localhost URLs for local development. Google login additionally requires the Google provider and its OAuth credentials in Supabase. Confirmation-email templates that override the default link must honor the requested redirect URL. See [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

Run `bun run check:auth` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` set. The deployment workflow runs this after publishing, checking that Supabase email authentication responds and protected APIs reject anonymous callers. A build or public-page HTTP 200 alone does not verify login.

For demo-account checks, additionally supply `AUTH_SMOKE_ACCOUNTS` as a JSON object mapping `CLIENT`, `OWNER`, `AGENT`, and `ADMIN` to dedicated test emails, and set `AUTH_SMOKE_PASSWORD` in the process environment. The script checks login, token refresh, profile role, admin API access, and logout. It never prints credentials or changes account data. These checks create only temporary login sessions and close each session with local logout. Do not commit test credentials.

For browser coverage, install Chromium with `bunx playwright install chromium`, start the app, and run `bun run test:auth-browser` with the same demo environment variables. Set `AUTH_TEST_BASE_URL` to test a deployed origin instead of localhost. This covers validation, blocked storage, mobile registration, the Google provider handoff, and each role's login, reload, redirect, and logout. Traces, videos, and screenshots are disabled to keep credentials out of artifacts. Google account consent and email confirmation delivery still require an interactive end-to-end check.

If the project hostname does not resolve, restore the existing project in the Supabase dashboard or correct the project URL and matching public key in GitHub repository variables and `wrangler.toml`, then redeploy. Client code cannot restore a paused or deleted Supabase project using a publishable key.

## Data and deployment

- Local and standard Node.js development uses Prisma with SQLite.
- Cloudflare Workers builds use OpenNext and the D1 binding defined in `wrangler.toml`.
- Supabase provides authentication and mirrors authenticated user-submitted listings to `public.properties`.
- `supabase-setup.sql` is a reviewed bootstrap for a fresh Supabase project. Read it before applying it to an existing database.

Build for Cloudflare with `bun run cf:build`. Preview with `bun run cf:preview`, or deploy with `bun run cf:deploy` after configuring Cloudflare credentials outside the repository. Configure `ZAI_API_KEY` in the Worker secrets dashboard before enabling live AI responses; the deploy command preserves dashboard-managed variables and secrets. The `Deploy Cloudflare Worker` GitHub Actions workflow validates lint, types, and the OpenNext build before each production deployment. It requires the `CLOUDFLARE_API_TOKEN` repository secret and `CLOUDFLARE_ACCOUNT_ID` repository variable.

This project targets Cloudflare **Workers**, not the legacy static Pages export. For Workers Builds, use `bun run cf:build` as the build command and `bun run cf:deploy` as the deploy command. Remove or reconfigure any older Cloudflare Pages integration that still calls `pages:build`.
