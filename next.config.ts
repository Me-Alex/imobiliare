import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_OUTPUT_EXPORT === '1';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isStaticExport
    ? { output: 'export' as const, images: { unoptimized: true } }
    : {
        // Cloudflare Pages compatibility
        images: {
          unoptimized: true,
        },
        async headers() {
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
              ],
            },
          ]
        },
      }),
  reactStrictMode: true,
};

export default nextConfig;
