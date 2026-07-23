# Refactor: split oversized modules

Branch: `refactor/split-oversized-modules`

## Done

### 1. Split oversized admin surface (partial)

Extracted from `src/views/admin-page.tsx`:

- Labels, status maps, types → `src/lib/admin-labels.ts`
- Work-queue builder → `src/lib/admin-work-items.ts`
- Presentational atoms → `src/components/admin/admin-shared.tsx`

### 2. Pure helpers (concern-based, not one-file-per-function)

- `buildAdminWorkItems` is a pure function of `AdminDashboardData`
- `statusTone` / `formatAdminDateTime` are pure label helpers
- Reuse `formatPrice` from `src/lib/utils.ts` when wiring the page (avoid duplicate formatters)

### 3. Function inventory

See `docs/FUNCTION_INVENTORY.md`.

### 4. Domain direction (documents / CRM / tours)

No folder move yet (avoids a noisy PR). Logical domains already cluster as:

| Domain | Primary paths |
|--------|----------------|
| Admin | `admin-page`, `admin-dashboard`, `admin-labels`, `server-admin-auth`, `components/admin/*` |
| Documents | `documente-page`, `document-flow`, `legal-*`, `viewing-documents`, `components/features/documents/*` |
| CRM | `crm-page`, `crm.ts`, `crm-api.ts`, `offers*`, deal-room views |
| Virtual tours | `virtual-tour*`, `demo-virtual-tours`, admin review panel |

## Follow-up (same branch or next PR)

```ts
// admin-page.tsx should import:
import {
  ROLE_TONES,
  PROPERTY_STATUS_LABELS,
  STATUS_LABELS,
  formatAdminDateTime,
  type AdminTab,
  type Confirmation,
  type GlobalSearchResult,
  type WorkDestination,
  type WorkItem,
} from '@/lib/admin-labels'
import { buildAdminWorkItems } from '@/lib/admin-work-items'
import { EmptyState, MetricCard, SectionHeader, StatusBadge } from '@/components/admin/admin-shared'
import { cn, formatPrice } from '@/lib/utils'

// workItems:
const workItems = useMemo(
  () => (data ? buildAdminWorkItems(data) : []),
  [data],
)

// replace formatDate(...) with formatAdminDateTime(...)
```

Then delete the inlined copies of those symbols from `admin-page.tsx`.
