import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deadlocktrainer.gg'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch approved puzzle slugs
  const { data: puzzles, error: puzzlesError } = await supabase
    .from('puzzles')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .not('slug', 'is', null)
    .not('updated_at', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1000)

  if (puzzlesError) {
    console.error('Failed to fetch puzzles for sitemap:', puzzlesError)
    throw new Error(`Failed to fetch puzzles for sitemap: ${puzzlesError.message}`)
  }

  // Fetch hero slugs
  const { data: heroes, error: heroesError } = await supabase
    .from('heroes')
    .select('slug')
    .eq('is_active', true)
    .not('slug', 'is', null)

  if (heroesError) {
    console.error('Failed to fetch heroes for sitemap:', heroesError)
    throw new Error(`Failed to fetch heroes for sitemap: ${heroesError.message}`)
  }

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

  const puzzleRoutes: MetadataRoute.Sitemap = (puzzles ?? [])
    .filter((p) => p.slug && p.updated_at)
    .map((p) => ({
      url:             `${BASE_URL}/puzzles/${p.slug}`,
      lastModified:    new Date(p.updated_at),
      changeFrequency: 'weekly',
      priority:        0.8,
    }))

  const heroRoutes: MetadataRoute.Sitemap = (heroes ?? [])
    .filter((h) => h.slug)
    .map((h) => ({
      url:             `${BASE_URL}/heroes/${h.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.8,
    }))

  return [...staticRoutes, ...puzzleRoutes, ...heroRoutes]
}