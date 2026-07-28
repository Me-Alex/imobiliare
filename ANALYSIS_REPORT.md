# HQS Imobiliare — Architecture & Codebase Analysis

> **Repository:** [Me-Alex/imobiliare](https://github.com/Me-Alex/imobiliare)
> **Last reviewed:** 2026-07-29
> **Branch:** main

---

## Table of Contents

1. [What This Is](#1-what-this-is)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Database Design](#4-database-design)
5. [API Surface](#5-api-surface)
6. [Security Posture](#6-security-posture)
7. [Testing](#7-testing)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Code Quality](#9-code-quality)
10. [Risks & Gaps](#10-risks--gaps)
11. [Recommendations](#11-recommendations)

---

## 1. What This Is

HQS Imobiliare is a full-stack real-estate platform targeting Bucharest, Romania. It serves property buyers, sellers, and real-estate agents with:

- **Property listings** with search, filters, map view (Leaflet), and comparison
- **CRM pipeline** — lead tracking from initial contact through offer to close
- **Document management** — a state-machine-driven workflow for contracts, mandates, and viewing reports
- **AI chat assistant** — property Q&A powered by an external LLM provider
- **Market analytics** — zone-level pricing, demand metrics, historical trends
- **Admin dashboard** — staff management, virtual tour review, deal room
- **Notifications** — email (Resend), SMS (Twilio), in-app via notification log

The site is in Romanian. The domain is `hqsimobiliare.ro`.

---

## 2. Tech Stack

### Runtime & Framework

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.x |
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.0.0 |
| Package Manager | Bun | 1.3.6 |
| Edge Runtime | Cloudflare Workers | via OpenNext |

### Data

| Purpose | Technology |
|---------|-----------|
| ORM | Prisma 6.11 (SQLite for dev, D1 for prod) |
| Auth & Realtime | Supabase 2.110 |
| State Management | Zustand 5 |
| Server State | TanStack Query 5 |
| Validation | Zod 4 |

### UI & Styling

| Purpose | Technology |
|---------|-----------|
| CSS | Tailwind CSS 4 |
| Component Primitives | 25+ Radix UI packages |
| Animations | Framer Motion 12 |
| Charts | Recharts 2 |
| Maps | Leaflet 1.9.4 |
| Icons | Lucide React |

### Infrastructure

| Purpose | Technology |
|---------|-----------|
| Deployment | Cloudflare Workers (via OpenNext) |
| Build CLI | Wrangler 4.110 |
| Database | Cloudflare D1 |
| Reverse Proxy (dev) | Caddy |
| CI/CD | GitHub Actions |
| Email | Resend |
| SMS | Twilio (optional) |

### Notable Libraries

- `pdf-lib` — PDF generation for contracts/documents
- `@mdxeditor/editor` — Rich MDX editing
- `next-intl` — Internationalization (currently Romanian-only)
- `sharp` — Server-side image processing
- `react-hook-form` + `@hookform/resolvers` — Form management
- `@dnd-kit` — Drag-and-drop for sortable lists
- `sonner` — Toast notifications
- `embla-carousel-react` — Carousel component
- `z-ai-web-dev-sdk` — AI provider integration

---

## 3. Architecture

### Directory Layout

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # 20+ API route handlers
│   │   ├── admin/                # Dashboard, virtual tours
│   │   ├── appointments-v2/      # Viewing scheduling (CRUD, signatures, notifications)
│   │   ├── ai-chat/              # AI assistant endpoint
│   │   ├── ai-listing-description/ # AI-generated property descriptions
│   │   ├── contact/              # Contact form
│   │   ├── geocode/              # Address → coordinates
│   │   ├── leads/                # CRM lead management
│   │   ├── market-data/          # Zone pricing data
│   │   ├── newsletter/           # Email subscriptions
│   │   ├── offers/               # Negotiation/offer management
│   │   ├── price-alerts/         # Price drop notifications
│   │   ├── properties/           # Property CRUD + comparison
│   │   ├── search/               # Autocomplete suggestions
│   │   ├── valuation/            # Property valuation
│   │   ├── vizionari/            # Viewing appointments
│   │   └── zones/                # Zone data
│   ├── proprietati/              # Property listing pages
│   ├── evaluare/                 # Property valuation page
│   ├── zona/                     # Zone detail pages
│   ├── analiza-piata/            # Market analysis page
│   ├── servicii/                 # Services page
│   ├── despre-noi/               # About page
│   ├── confidentialitate/        # Privacy policy
│   ├── dev/                      # Dev-only preview routes
│   └── layout.tsx                # Root layout (fonts, metadata, providers)
│
├── components/                   # 13 component categories
│   ├── account/                  # Account gate, role access denied
│   ├── admin/                    # Virtual tour review panel
│   ├── dialogs/                  # Auth, contact, gallery, save search, feedback
│   ├── documents-v2/             # Document workspace, card, preview, timeline, state pill
│   ├── features/                 # AI chat, market analytics, mortgage calc, documents
│   ├── layout/                   # Navigation, footer, theme toggle
│   ├── marketing/                # Hero, featured properties, CTA sections
│   ├── monede/                   # Coin/credit system components
│   ├── panels/                   # Side panels
│   ├── property/                 # Property cards, details, filters, comparison
│   ├── ui/                       # Base UI primitives (Radix wrappers)
│   ├── vizionare/                # Viewing/scheduling components
│   └── zone/                     # Zone cards and details
│
├── lib/                          # 60+ utility modules
│   ├── documents/                # Document engine (state machine, templates, fields, bucketing)
│   │   ├── state-machine.ts      # Core state transition logic
│   │   ├── flow.ts               # Document flow orchestration
│   │   ├── templates/            # 6 document templates
│   │   └── fields/               # Field definitions per role
│   ├── notifications/            # Email templates
│   ├── db.ts                     # Prisma client (Node runtime)
│   ├── db-d1.ts                  # D1 adapter (Edge runtime) — 400+ lines
│   ├── edge-db.ts                # Runtime-aware DB selector
│   ├── ai-edge.ts                # AI provider adapter (server-only)
│   ├── rate-limit.ts             # IP-based sliding window rate limiter
│   ├── validators.ts             # Email and input validation
│   ├── server-admin-auth.ts      # Role-based auth middleware
│   ├── crm.ts / crm-api.ts      # CRM business logic
│   ├── supabase.ts               # Supabase client setup
│   └── ...
│
├── hooks/                        # Custom React hooks
├── contexts/                     # React context providers
├── store/                        # Zustand stores
└── views/                        # Page-level composite components
```

### Data Flow

```
Browser
  │
  ├─► Next.js App Router (SSR/SSG)
  │     ├─► API Routes (server-side)
  │     │     ├─► Prisma → SQLite (dev) / D1 (prod)
  │     │     ├─► Supabase (auth, realtime, RLS)
  │     │     └─► External APIs (AI, Resend, Twilio)
  │     └─► Server Components → HTML
  │
  └─► Client Components
        ├─► Zustand (local state)
        ├─► TanStack Query (server state cache)
        └─► Supabase Client (auth, realtime subscriptions)
```

### Dual Database Strategy

The app runs two database layers simultaneously:

1. **Prisma + SQLite** — Used in local development and standard Node.js runtime. The schema in `prisma/schema.prisma` defines 15 models.

2. **Custom D1 Adapter** (`src/lib/db-d1.ts`) — A hand-rolled Prisma-compatible query builder for Cloudflare's D1. It supports `findMany`, `findFirst`, `findUnique`, `create`, `update`, `delete`, `count`, `aggregate`, and `groupBy`. This is necessary because Prisma's D1 adapter doesn't work in the OpenNext edge runtime.

The `edge-db.ts` module detects the runtime and returns the appropriate client.

---

## 4. Database Design

### Models (15 total)

#### User & Auth
| Model | Purpose |
|-------|---------|
| `User` | Basic account (email, name) |
| `UserProfile` | Extended profile with notification/display preferences |
| `StaffMember` | Agents with roles: AGENT, ADMIN, DIRECTOR |

#### Real Estate
| Model | Purpose |
|-------|---------|
| `Property` | Listings — 20+ fields including price, area, rooms, coordinates, gallery |
| `PropertyAnalytics` | Weekly view/inquiry/save counts per property |
| `MarketData` | Zone-level market stats (avg price/sqm, supply, demand) |
| `Zone` | Geographic zones with demand metrics and popular-for tags |

#### CRM
| Model | Purpose |
|-------|---------|
| `Lead` | Pipeline: NEW → CONTACTED → QUALIFIED → VIEWING_SCHEDULED → OFFER → WON/LOST |
| `LeadActivity` | Activity log (notes, calls, emails, status changes) |
| `Offer` | Negotiation with counter-offer chain support |
| `Vizionare` | Property viewing appointments |

#### Communication
| Model | Purpose |
|-------|---------|
| `ContactSubmission` | Website contact form |
| `NewsletterSubscription` | Email signups |
| `PriceAlert` | User-configured price drop alerts |
| `NotificationLog` | Delivery tracking (email, SMS, push, in-app) |

#### Other
| Model | Purpose |
|-------|---------|
| `Post` | Legacy/placeholder — not actively used |

### Schema Highlights

- **Indexing:** Key fields indexed (`zone`, `type`, `transaction`, `status`, `assignedToId`, `email`, `createdAt`)
- **JSON fields:** `galleryUrls`, `preferredZones`, `preferredTypes`, `notificationPreferences`, `displayPreferences` stored as JSON strings
- **Unique constraints:** Property slugs, zone names, user emails, weekly analytics
- **Cascade deletes:** `LeadActivity` cascades when `Lead` is deleted
- **Counter-offer chains:** `Offer.parentOfferId` self-relation for negotiation tracking

### Supabase Migrations

30+ SQL migration files covering:
- Account roles and profiles
- Document workflows and contracts
- Legal document request pipelines
- Coin/credit wallet system
- Property coordinates
- Security hardening (RLS policies)

---

## 5. API Surface

### Public Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/properties` | List properties with filters |
| GET | `/api/properties/[slug]` | Single property detail |
| GET | `/api/properties/compare` | Side-by-side comparison |
| GET | `/api/search/suggestions` | Autocomplete |
| GET | `/api/zones` | Zone listings |
| GET | `/api/market-data` | Market statistics |
| POST | `/api/valuation` | Property valuation estimate |
| GET | `/api/geocode` | Address → lat/lng |
| POST | `/api/contact` | Contact form submission |
| POST | `/api/newsletter` | Newsletter signup |
| POST | `/api/price-alerts` | Create price alert |
| GET/PUT/DELETE | `/api/price-alerts/[id]` | Manage alerts |

### Authenticated Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/leads` | CRM lead management |
| GET/PUT/DELETE | `/api/leads/[id]` | Single lead operations |
| GET/POST | `/api/offers` | Offer management |
| GET/PUT | `/api/offers/[id]` | Single offer operations |
| GET/POST | `/api/vizionari` | Viewing appointments |
| GET/POST | `/api/appointments-v2` | Enhanced appointments |
| POST | `/api/appointments-v2/signatures` | Document signatures |
| POST | `/api/appointments-v2/notify` | Send notifications |

### Admin Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/dashboard` | Admin overview data |
| GET/POST | `/api/admin/virtual-tours` | Virtual tour management |

### AI Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ai-chat` | Conversational AI assistant |
| POST | `/api/ai-listing-description` | Generate property descriptions |

---

## 6. Security Posture

### Strengths

**Content Security Policy** — Well-configured in `next.config.ts`:
- `default-src 'self'`
- `script-src` limited to self + Supabase
- `connect-src` explicitly lists Supabase, Nominatim, OpenStreetMap tiles, and the Worker URL
- `frame-ancestors 'none'` prevents clickjacking
- `object-src 'none'` blocks plugin injection

**Security Headers** — Full suite:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Input Validation:**
- Zod schemas validate all API request bodies
- Custom email validator (`validators.ts`) — pragmatic RFC 5322-lite
- Input sanitization before database operations

**Authentication:**
- Supabase Auth with Bearer token verification
- Role-based access control: AGENT, ADMIN, DIRECTOR
- Admin check via Supabase RPC (`is_admin_user`)
- `server-admin-auth.ts` provides `requireStaff`, `requireAdmin`, `requireAccountRole`

**Rate Limiting:**
- Shared IP-based sliding window (`rate-limit.ts`)
- Per-route instances (e.g., AI chat: 10 req/min, Lead creation: 30 req/min)
- Memory-bounded with automatic pruning (5000 IP cap)

**SSRF Protection:**
- Caddyfile's `XTransformPort` restricted to `127.0.0.1` and `::1`

**SQL Injection Prevention:**
- Prisma ORM with parameterized queries
- D1 adapter uses parameterized bindings (`?1`, `?2`, etc.)

**Document Security:**
- Supabase RLS policies on document buckets
- State machine enforces valid transitions with actor authorization
- Audit snapshots for legal document requests

### Weaknesses

1. **Per-isolate rate limiting** — The in-memory rate limiter resets per Cloudflare Worker isolate. A distributed attack multiplies the effective limit by the number of isolates. The code explicitly documents this limitation.

2. **Hardcoded Supabase key in `wrangler.toml`** — The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is committed to the repo. While this is a publishable key (not a service-role key), it should still be managed via Cloudflare dashboard variables.

3. **`__name` polyfill in root layout** — An inline `<script>` sets `globalThis.__name`. This is a known OpenNext/esbuild workaround but adds a CSP consideration.

4. **AI chat rate limiter is inline, not shared** — `ai-chat/route.ts` implements its own rate limiter instead of using the shared `createIpRateLimiter`. This duplicates logic and could drift.

5. **No CSRF protection** — API routes rely on Bearer tokens for auth but don't validate origin headers for state-changing requests from the browser.

6. **Legacy `Post` model** — Still in the schema but appears unused. Dead schema increases attack surface.

---

## 7. Testing

### Current State

5 test files exist:

| File | Tests |
|------|-------|
| `documents/state-machine.test.ts` | State transition logic |
| `documents/bucketing.test.ts` | Document bucketing |
| `documents/flow-shape.test.ts` | Document flow shapes |
| `rate-limit.test.ts` | Rate limiter behavior |
| `validators.test.ts` | Email validation |

### Coverage

- **Core business logic:** Well-covered (state machine, validators, rate limiter)
- **API routes:** No visible tests
- **Components:** No visible tests
- **Integration/E2E:** None
- **Coverage reporting:** Not configured

### Test Infrastructure

- Vitest 2.1 configured
- `bun run test` executes `vitest run`
- `bun run check` chains lint + typecheck + test

---

## 8. CI/CD Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

Triggers on push to `main` and all pull requests.

```
checkout → bun install → prisma generate → lint + typecheck → test → cf:build
```

Environment variables use placeholders (no real secrets).

### Deploy Workflow (`.github/workflows/deploy-cloudflare.yml`)

Triggers on push to `main` and manual dispatch.

**Quality job:** Same as CI (lint, typecheck, test, cf:verify)

**Deploy job:** Depends on quality passing.
- Requires `CLOUDFLARE_API_TOKEN` secret and `CLOUDFLARE_ACCOUNT_ID` variable
- Uses `--keep-vars` to preserve dashboard-managed variables
- Concurrency group `cloudflare-production` with `cancel-in-progress: false`

### Observations

- Both workflows run quality checks independently (could be deduplicated)
- No branch protection rules visible
- No Dependabot or security scanning configured
- No preview deployments for PRs

---

## 9. Code Quality

### Strengths

- **TypeScript strict mode** enabled
- **Consistent naming** — camelCase for JS/TS, kebab-case for files
- **Separation of concerns** — lib/ for logic, components/ for UI, api/ for routes
- **Well-documented modules** — JSDoc comments explain intent, not just behavior
- **Defensive coding** — Null checks, fallback values, graceful degradation
- **Edge-runtime awareness** — Separate DB adapters for Node vs. Cloudflare

### Concerns

- **D1 adapter is 400+ lines** of hand-rolled query building. This is fragile and could diverge from Prisma's behavior. Consider using Prisma's official D1 adapter once it stabilizes.
- **Duplicate rate limiting** — AI chat has its own inline implementation instead of using the shared module.
- **`legacy-crm.ts`** suggests there's a migration in progress. Legacy code should be tracked and removed.
- **Some components are large** — `documents-v2/` components handle multiple responsibilities.

### File Counts

| Category | Count |
|----------|-------|
| Total TypeScript files | 277 |
| API route files | 20+ |
| Component directories | 13 |
| Lib utility files | 60+ |
| Test files | 5 |
| Supabase migrations | 30+ |
| Prisma models | 15 |

---

## 10. Risks & Gaps

### Critical

| Risk | Impact | Likelihood |
|------|--------|------------|
| Per-isolate rate limiting bypass | API abuse, data scraping | Medium |
| No CSRF protection on state-changing API routes | Unauthorized actions via browser | Low-Medium |
| 20 open issues unaddressed | Accumulated bugs/vulnerabilities | Medium |

### High

| Risk | Impact | Likelihood |
|------|--------|------------|
| No integration or E2E tests | Regressions reach production | High |
| No branch protection on `main` | Force push, accidental deletion | Medium |
| No dependency scanning (Dependabot/Snyk) | Known vulnerabilities in dependencies | Medium |
| D1 adapter hand-rolled, not battle-tested | Query bugs, data corruption | Low-Medium |

### Medium

| Risk | Impact | Likelihood |
|------|--------|------------|
| Hardcoded Supabase anon key in wrangler.toml | Credential exposure | Low |
| Legacy Post model still in schema | Confusion, unnecessary surface area | Low |
| No error monitoring (Sentry etc.) | Silent failures in production | Medium |
| No preview deployments | PRs merged without visual verification | Medium |

---

## 11. Recommendations

### Immediate (This Week)

1. **Enable branch protection on `main`**
   - Require PR reviews
   - Require status checks (CI) to pass
   -禁止 force push

2. **Add Dependabot**
   - Create `.github/dependabot.yml` for npm and GitHub Actions
   - Auto-merge minor/patch updates with CI passing

3. **Move Supabase key out of `wrangler.toml`**
   - Use Cloudflare dashboard variables
   - Keep only `SUPABASE_URL` in code (it's not sensitive)

4. **Unify rate limiting**
   - Refactor `ai-chat/route.ts` to use `createIpRateLimiter` from the shared module
   - Eliminate duplicate code

### Short-Term (This Month)

5. **Add global rate limiting**
   - Implement Durable Objects or Workers KV-based counters
   - Critical for production with multiple isolates

6. **Add API route tests**
   - At minimum: test each route's happy path and auth rejection
   - Use Vitest with mocked Supabase/Prisma

7. **Set up error monitoring**
   - Integrate Sentry or equivalent
   - Track 5xx rates, unhandled rejections, D1 query failures

8. **Add preview deployments**
   - Cloudflare Pages preview for each PR
   - Visual verification before merge

### Medium-Term (This Quarter)

9. **Migrate D1 adapter to Prisma's official D1 support**
   - When `@prisma/adapter-d1` stabilizes
   - Eliminates 400+ lines of custom code

10. **Add component tests**
    - React Testing Library for critical UI flows
    - Property search, document workflow, lead management

11. **Remove legacy code**
    - Clean up `Post` model
    - Complete `legacy-crm.ts` migration
    - Remove dead routes/components

12. **Add API documentation**
    - OpenAPI/Swagger spec
    - Auto-generated from Zod schemas

### Long-Term

13. **Search engine upgrade** — Algolia or Elasticsearch for property search
14. **CDN image optimization** — Cloudflare Image Resizing for property photos
15. **PWA support** — Offline capability, install prompt
16. **Multi-language** — `next-intl` is already installed; add English support

---

## Appendix: Key File Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (15 models) |
| `src/lib/db-d1.ts` | D1 database adapter (Edge runtime) |
| `src/lib/db.ts` | Prisma client (Node runtime) |
| `src/lib/edge-db.ts` | Runtime-aware DB selector |
| `src/lib/rate-limit.ts` | IP-based rate limiter |
| `src/lib/validators.ts` | Input validation |
| `src/lib/server-admin-auth.ts` | Auth middleware |
| `src/lib/ai-edge.ts` | AI provider adapter |
| `src/lib/documents/state-machine.ts` | Document workflow engine |
| `src/lib/notifications.ts` | Notification service |
| `next.config.ts` | Security headers, CSP, image config |
| `wrangler.toml` | Cloudflare Workers config |
| `Caddyfile` | Dev reverse proxy |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy-cloudflare.yml` | Production deploy |
