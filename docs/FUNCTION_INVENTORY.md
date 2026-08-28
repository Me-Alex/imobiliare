# HQS Imobiliare — Function / Module Inventory

Source: `main` @ `38318a9` plus branch `refactor/split-oversized-modules`.

## Unit of modularity

In this codebase the practical unit is the **file** (component, lib module, API route), not every inner function.

---

## Views (`src/views/`) — split priority

| File | Primary export | ~Size | Priority |
|------|----------------|-------|----------|
| admin-page.tsx | `AdminPage` | 64KB | **In progress** (helpers extracted) |
| documente-page.tsx | documents workspace | 33KB | High |
| property-page.tsx | property detail | 32KB | High |
| deal-room-page.tsx | deal room | 27KB | Medium |
| login-page.tsx | auth UI | 24KB | Medium |
| monede-page.tsx | coins | 22KB | Low |
| disponibilitate-staff-page.tsx | staff calendar | 22KB | Medium |
| owner-dashboard-page.tsx | owner dash | 20KB | Medium |
| adauga-proprietate-page.tsx | publish flow | 19KB | Medium |
| servicii-page.tsx | services hub | 18KB | Low |
| vizionarile-mele-page.tsx | my viewings | 16KB | Medium |
| crm-page.tsx | CRM | 16KB | Medium |
| profil-page.tsx | profile | 16KB | Low |
| dashboard-page.tsx | client dash | 12KB | Low |
| programare-vizionare-page.tsx | book viewing | 11KB | Low |
| evaluare-page.tsx | valuation | 9KB | Low |
| proprietati-page.tsx | listings | 5KB | Low |
| calculator / zone / acasa / analiza | thin shells | 2–4KB | Low |

---

## New modules on this branch (admin domain)

| Path | Exports |
|------|---------|
| `src/lib/admin-labels.ts` | `ROLE_TONES`, `PROPERTY_STATUS_LABELS`, `STATUS_LABELS`, `statusTone`, `formatAdminDateTime`, types (`AdminTab`, `WorkItem`, …) |
| `src/lib/admin-work-items.ts` | `buildAdminWorkItems` |
| `src/components/admin/admin-shared.tsx` | `StatusBadge`, `MetricCard`, `SectionHeader`, `EmptyState` |

`admin-page.tsx` still contains local copies of these symbols until the follow-up wiring commit removes the duplication and imports the modules above.

---

## Lib domains (`src/lib/`)

| Module | Concern |
|--------|---------|
| account-roles | RBAC labels |
| admin-dashboard | admin DTO / status unions |
| admin-labels / admin-work-items | admin UI labels + work queue |
| ai-* | listing AI |
| api / coins-api / crm-api | HTTP clients |
| constants / types / utils / validators | shared primitives |
| db / db-d1 / edge-db | data access |
| document-flow / document-navigation / legal-* / viewing-documents | **documents domain** |
| notifications | email/SMS/in-app |
| offers / crm | **CRM domain** |
| property-* / supabase-properties / virtual-tour* | **listings domain** |
| transaction-workspace | **deal-room domain** |
| server-admin-auth | admin auth gate |

---

## Component domains

- **documents/** — cards, upload, legal panels, request dialogs
- **property/** — card, grid, filters, form, map, virtual tour editor/viewer
- **marketing/** — hero (large), stats, CTA, FAQ, partners
- **admin/** — virtual tour review + shared atoms (new)
- **panels/** — favorites, notifications, price alerts, saved searches
- **vizionare/** — booking steps
- **ui/** — shadcn primitives (do not split further)

---

## API routes

Each `src/app/api/**/route.ts` exports HTTP verbs for: admin dashboard, virtual tours, AI chat/listing, contact, geocode, leads, offers, price-alerts, properties, search suggestions, valuation, vizionari, zones, newsletter, market-data.

---

## Recommended next extractions

1. Wire `admin-page.tsx` → import extracted modules (delete local duplicates)
2. Split `documente-page.tsx` → list / filters / legal-request panels
3. Split `property-page.tsx` → gallery / specs / tour / CTA
4. Split `hero-section.tsx` → search + stats strip
5. Optional later: `src/domains/{admin,documents,crm,listings}/` barrel folders
