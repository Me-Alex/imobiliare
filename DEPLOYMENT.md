# Deployment

- Build target: Cloudflare Workers via OpenNext Cloudflare adapter.
- Data: Supabase.
- Build command: `npm run cloudflare:build`.
- Preview command: `npm run cloudflare:preview`.
- Deploy command: `npm run cloudflare:deploy`.
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_PASSWORD, ADMIN_RPC_SECRET, ADMIN_ALLOWED_USERS.
- Not used: Vercel.
