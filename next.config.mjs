import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable API routes on Vercel
  // Static exports don't support server-side functionality like API routes
  trailingSlash: true,
  
  // Add bundle analyzer for performance monitoring
  webpack: (config, { isServer }) => {
    // Optimize client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        // Specifically exclude Node.js modules that stockfish.wasm might try to use
        perf_hooks: false,
        worker_threads: false,
        child_process: false,
      }
    }
    
    // No special WASM configuration needed for API-based Stockfish
    
    return config
  },
  
  // Performance optimizations
  experimental: {
    // Disabled optimizeCss due to missing critters dependency
    // optimizeCss: true,
    optimizeServerReact: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/realtime-js'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'njvbiqoskebgwclunhpq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Compression
  compress: true,
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
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
          // Required for WebAssembly threading (Stockfish.wasm)
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // Specific headers for Stockfish WASM files
      {
        source: '/stockfish/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  productionBrowserSourceMaps: false,

  webpack(cfg) {
    if (!cfg.dev) {
      cfg.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: { compress: { drop_console: true } }
        })
      )
    }
    return cfg
  }
}

export default withBundleAnalyzer(nextConfig)
