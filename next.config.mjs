/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization
  output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true,
    domains: ['gudtek.com'],
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
