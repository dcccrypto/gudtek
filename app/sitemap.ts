import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gudtek.club'
  const currentDate = new Date().toISOString()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/memes`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/announcements`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // API endpoints for better crawling
    {
      url: `${baseUrl}/api/total-supply`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/api/circulating-supply`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.6,
    },
  ]
} 