import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/private/',
          '/_next/',
          '/\.', // Hidden files
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://gudtek.club/sitemap.xml',
    host: 'https://gudtek.club',
  }
} 