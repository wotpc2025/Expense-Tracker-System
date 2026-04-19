/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for smaller container/runtime footprint.
  // This is required by the Dockerfile runner stage that copies .next/standalone.
  output: 'standalone',

  // Remove the default `x-powered-by: Next.js` header for less fingerprinting.
  poweredByHeader: false,

  // Apply baseline security headers to all routes.
  // Keep this list centralized here so CDN/reverse-proxy policy is easy to audit.
  async headers() {
    return [
      {
        // Apply headers globally to every path served by this app.
        source: '/(.*)',
        headers: [
          // Prevent clickjacking via iframe embedding.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Disable MIME sniffing and enforce declared content-types.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Restrict referrer details on cross-origin navigation.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Legacy XSS filter header for older browsers.
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Deny sensitive browser features by default.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            // Enforce HTTPS for one year (effective only when served over HTTPS).
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
