# Deployment

- Build target: Cloudflare Pages (`imobiliare2`) using `@cloudflare/next-on-pages`.
- Build command: `npm run cloudflare:build`.
- Output directory: `.vercel/output/static`.
- Data: Supabase.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`, `ADMIN_RPC_SECRET`, `ADMIN_ALLOWED_USERS`.
- Worker-only OpenNext commands are kept under `worker:*` for a future Workers migration, but Pages production should use `cloudflare:build`.
- Not used: Vercel hosting.
