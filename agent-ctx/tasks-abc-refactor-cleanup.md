# Task A + B + C — Refactor & Cleanup

## Files Created (4 new files)

| File | Lines | Description |
|------|-------|-------------|
| `src/components/features/vizionare-card.tsx` | 215 | Extracted VizionareCard component — status badge, staff info, date/time, property info, action buttons (feedback, documents, cancel, reschedule) |
| `src/components/features/vizionare-documents-section.tsx` | 120 | Extracted VizionareDocumentsSection — document list tied to a vizionare with download/preview/delete |
| `src/components/layout/index.ts` | 5 | Barrel export for layout/ |
| `src/components/property/index.ts` | 5 | Barrel export for property/ |
| `src/components/marketing/index.ts` | 8 | Barrel export for marketing/ |
| `src/components/panels/index.ts` | 3 | Barrel export for panels/ |
| `src/components/dialogs/index.ts` | 2 | Barrel export for dialogs/ |
| `src/components/zone/index.ts` | 2 | Barrel export for zone/ |
| `src/components/features/index.ts` | 4 | Barrel export for features/ |

## Files Modified (3 files)

| File | Lines (before → after) | Description |
|------|------------------------|-------------|
| `src/views/vizionarile-mele-page.tsx` | 624 → 311 | Removed inline VizionareCard, DocumentList, DocTypeBadge, getStaffById, getDocFileIcon. Now imports VizionareCard from features/ |
| `src/components/property/edit-property-dialog.tsx` | 751 → 754 | Replaced `innerHTML` with `erroredIndices` Set state + conditional rendering for failed image thumbnails |
| `src/views/programare-vizionare-page.tsx` | 837 → 875 | Added `ImageWithFallback` component using state; replaced `innerHTML` with React-safe conditional rendering |
| `src/app/globals.css` | 963 → 967 | Added `/* ── @layer component: ... ── */` comments before every component-specific CSS class section |

## ESLint Results

- **All modified/new files**: 0 errors, 0 warnings
- **Pre-existing error** in `src/components/property/property-form.tsx:63` (refs during render) — NOT introduced by this work

## Key Changes Summary

### Task A — Component Extraction
- `vizionarile-mele-page.tsx` reduced from 624 → 311 lines (~50% reduction)
- `VizionareCard` is a standalone component accepting `vizionare` prop + callbacks (`onCancel`, `onAddFeedback`, `onReschedule`)
- `VizionareDocumentsSection` accepts `vizionareId` prop, self-contained with its own localStorage access
- DocTypeBadge is a private sub-component inside vizionare-documents-section.tsx

### Task B — innerHTML Removal
- `edit-property-dialog.tsx`: Added `erroredIndices: Set<number>` state; on img error, adds index to set; conditionally renders "Eroare" div
- `programare-vizionare-page.tsx`: Created `ImageWithFallback` helper component with `errored` boolean state; renders Building2 icon on error

### Task C — Barrel Files + CSS Organization
- 7 barrel `index.ts` files created covering layout, property, marketing, panels, dialogs, zone, features
- All 40+ component-specific CSS classes in globals.css annotated with `/* ── @layer component: <component-list> ── */` comments identifying which components use them