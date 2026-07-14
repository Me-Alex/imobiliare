# Task 7a — Mock Data Fallbacks for Cloudflare Workers

## Summary
Added mock data fallbacks to all API routes so the HQS Imobiliare site shows content even when the Prisma/SQLite database is unavailable (e.g., deployed on Cloudflare Workers).

## Changes Made

### New File: `/src/lib/mock-data.ts`
- Created shared mock data module exporting:
  - `MOCK_PROPERTIES` — 9 property objects (apartments, houses, villa, land, commercial) across Bucharest zones
  - `MOCK_ZONES` — 9 zone objects without `_count`
  - `MOCK_ZONES_WITH_COUNTS` — 9 zone objects with `_count.properties` derived from property distribution
- Fixed quote escaping issues in `popularFor` fields (zone Unirii and Drumul Taberei)

### Modified: `/src/app/api/properties/route.ts`
- Added `import { MOCK_PROPERTIES } from '@/lib/mock-data'`
- Catch block now returns `MOCK_PROPERTIES` with pagination metadata instead of 500 error

### Modified: `/src/app/api/zones/route.ts`
- Added `import { MOCK_ZONES_WITH_COUNTS } from '@/lib/mock-data'`
- Catch block now returns `{ zones: MOCK_ZONES_WITH_COUNTS }` instead of 500 error

### Modified: `/src/app/api/market-data/route.ts`
- Added `import { MOCK_ZONES } from '@/lib/mock-data'`
- Catch block now returns zones, empty weeklyData, and summary object instead of 500 error

### Modified: `/src/app/api/properties/[slug]/route.ts`
- Added `import { MOCK_PROPERTIES } from '@/lib/mock-data'`
- Catch block searches MOCK_PROPERTIES by slug, returns 404 if not found, otherwise returns the property

### Modified: `/src/app/api/properties/compare/route.ts`
- Added `import { MOCK_PROPERTIES } from '@/lib/mock-data'`
- Catch block attempts to re-read request body (with safe fallback), filters MOCK_PROPERTIES by IDs, validates minimum 2 results