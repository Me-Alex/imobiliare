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

Copy `.env.example` to `.env` and keep real credentials out of version control. Never place GitHub tokens, Cloudflare API tokens, Supabase secret keys, or service-role keys in client variables or committed files.

## Quality checks

```bash
bun run lint
bun run typecheck
bun run build
# or run all three
bun run check
```

## Data and deployment

- Local and standard Node.js development uses Prisma with SQLite.
- Cloudflare Workers builds use OpenNext and the D1 binding defined in `wrangler.toml`.
- Supabase provides authentication and mirrors authenticated user-submitted listings to `public.properties`.
- `supabase-setup.sql` is a reviewed bootstrap for a fresh Supabase project. Read it before applying it to an existing database.

Build for Cloudflare with `bun run cf:build`. Preview with `bun run cf:preview`, or deploy with `bun run cf:deploy` after configuring Cloudflare credentials outside the repository.

This project targets Cloudflare **Workers**, not the legacy static Pages export. For Workers Builds, use `bun run cf:build` as the build command and `bun run cf:deploy` as the deploy command. Remove or reconfigure any older Cloudflare Pages integration that still calls `pages:build`.
