import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deadlocktrainer.gg'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  // Fetch approved puzzle slugs
  const { data: puzzles } = await admin
    .from('puzzles')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1000)

  // Fetch hero slugs
  const { data: heroes } = await admin
    .from('heroes')
    .select('slug')
    .eq('is_active', true)

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:              BASE_URL,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/puzzles`,
      lastModified:     new Date(),
      changeFrequency:  'hourly',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/puzzle-of-the-day`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/leaderboard`,
      lastModified:     new Date(),
      changeFrequency:  'hourly',
      priority:         0.7,
    },
    {
      url:              `${BASE_URL}/login`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.5,
    },
    {
      url:              `${BASE_URL}/signup`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.5,
    },
  ]

  const puzzleRoutes: MetadataRoute.Sitemap = (puzzles ?? []).map((p) => ({
    url:             `${BASE_URL}/puzzles/${p.slug}`,
    lastModified:    new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  const heroRoutes: MetadataRoute.Sitemap = (heroes ?? []).map((h) => ({
    url:             `${BASE_URL}/heroes/${h.slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  return [...staticRoutes, ...puzzleRoutes, ...heroRoutes]
}
