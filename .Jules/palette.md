## 2024-05-18 - Missing Accessibility Attributes on Custom List Component
**Learning:** Decorative icons in lists and custom action buttons (like edit/delete) often lack `aria-hidden` and `aria-label` respectively, relying on visual cues rather than semantic meaning.
**Action:** Always verify that icon-only action buttons use `aria-label` and non-semantic decorative icons have `aria-hidden="true"`.

## 2024-05-18 - Netlify Deployment for Next.js App Router with Dynamic API Routes
**Learning:** For a Next.js app that uses App Router and has dynamic API routes (`/api/*`), configuring `output: 'export'` (or `NEXT_PUBLIC_OUTPUT_EXPORT=1`) will fail during build because dynamic API routes cannot be statically exported. Additionally, if using Netlify, deploying static export `out/` with redirect to `index.html` might break if the app is relying on standard Next.js routing instead of true SPA export.
**Action:** When building for standard Netlify deployment (not statically exported), ensure the publish directory is `.next` (or let Netlify auto-detect) instead of `out`, and do not set `NEXT_PUBLIC_OUTPUT_EXPORT=1` if the app uses Next.js server features or dynamic API routes.

## 2024-05-18 - Netlify Deployment Plugin for Next.js
**Learning:** Netlify relies on `@netlify/plugin-nextjs` for Next.js app routing and build outputs to work correctly without manual routing rules, especially for standard dynamic apps (not fully static exports).
**Action:** When creating `netlify.toml` for standard Next.js deployments, ensure the `@netlify/plugin-nextjs` plugin is listed in the plugins block so that dynamic routes and server components function natively on Netlify.

## 2024-05-18 - Next.js output: export behavior with dynamic routes
**Learning:** If a Next.js App Router project uses dynamic API routes without explicit `export const dynamic = 'force-static'`, setting `output: 'export'` (or using it conditionally via environment variables) will cause the build to fail, even on platforms like Netlify or Vercel if the environment variable happens to be set or if it's evaluated incorrectly.
**Action:** Remove `output: 'export'` from `next.config.ts` entirely if the app relies on dynamic server-side rendering or dynamic API routes, rather than trying to conditionally set it based on an environment variable, which can lead to unpredictable CI failures.
