import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.NEXT_PUBLIC_OUTPUT_EXPORT === '1'
    ? { output: 'export' as const, images: { unoptimized: true } }
    : {
        // Cloudflare Pages compatibility
        images: {
          unoptimized: true,
        },
      }),
  reactStrictMode: true,
  async headers() {
    // Content-Security-Policy: deliberately conservative. The platform
    // embeds map tiles from OpenStreetMap, allows Supabase + Cloudflare
    // Worker origins, and only permits inline scripts for the Next.js
    // runtime plus the `__name` polyfill in the root layout. If you add
    // new third-party origins (analytics, video, etc.) update the
    // corresponding directive here — do NOT loosen `'unsafe-inline'`
    // for scripts without auditing every inline <script> in the app.
    const csp = [
      "default-src 'self'",
      // Next.js / React require eval-free inline + nonce'd scripts; we
      // currently rely on Next's auto-generated nonces in production.
      "script-src 'self' 'unsafe-inline' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Connect targets used by the running app: Supabase REST/Realtime,
      // Cloudflare Worker endpoints, the geocoder (Nominatim) and tile
      // servers for Leaflet. Add new origins explicitly; avoid wildcards.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://hqs-imobiliare.floreaalexandru2002.workers.dev",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Only sent over HTTPS in browsers that opt-in. Safe to always set
          // because the app is HTTPS-only in production.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
};

export default nextConfig;
