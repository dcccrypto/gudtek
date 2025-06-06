/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable API routes on Vercel
  // Static exports don't support server-side functionality like API routes
  trailingSlash: true,
  
  // Image optimization
  images: {
    // Keep unoptimized for compatibility, but remove domains restriction
    unoptimized: true,
  },
  
  // SEO and performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
