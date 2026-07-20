## 2024-05-18 - Missing Accessibility Attributes on Custom List Component
**Learning:** Decorative icons in lists and custom action buttons (like edit/delete) often lack `aria-hidden` and `aria-label` respectively, relying on visual cues rather than semantic meaning.
**Action:** Always verify that icon-only action buttons use `aria-label` and non-semantic decorative icons have `aria-hidden="true"`.

## 2024-05-18 - Netlify Deployment for Next.js App Router with Dynamic API Routes
**Learning:** For a Next.js app that uses App Router and has dynamic API routes (`/api/*`), configuring `output: 'export'` (or `NEXT_PUBLIC_OUTPUT_EXPORT=1`) will fail during build because dynamic API routes cannot be statically exported. Additionally, if using Netlify, deploying static export `out/` with redirect to `index.html` might break if the app is relying on standard Next.js routing instead of true SPA export.
**Action:** When building for standard Netlify deployment (not statically exported), ensure the publish directory is `.next` (or let Netlify auto-detect) instead of `out`, and do not set `NEXT_PUBLIC_OUTPUT_EXPORT=1` if the app uses Next.js server features or dynamic API routes.
