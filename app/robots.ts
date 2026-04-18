import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deadlocktrainer.gg'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/admin/',
          '/api/',
          '/settings',
          '/notifications',
          '/dashboard',
          '/submissions',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
