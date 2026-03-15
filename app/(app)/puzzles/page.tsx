// app/(app)/puzzles/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Flame, Users, Heart, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge, GamePhaseBadge, Badge } from '@/components/ui/badge'
import { formatNumber, PAGE_SIZE, getPaginationRange } from '@/lib/utils'
import type { DifficultyLevel, GamePhase } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Puzzles' }

interface PageProps {
  searchParams: Promise<{
    difficulty?: string
    phase?: string
    hero?: string
    mechanic?: string
    search?: string
    sort?: string
    page?: string
  }>
}

async function getPuzzles(filters: Awaited<PageProps['searchParams']>) {
  const supabase = await createClient()
  const page   = parseInt(filters.page ?? '1', 10)
  const { from, to } = getPaginationRange(page)

  let query = supabase
    .from('puzzles')
    .select(`
      id, slug, title, difficulty, game_phase,
      solve_count, upvote_count, avg_difficulty, is_potd, created_at,
      creator:profiles!creator_id (username, display_name, avatar_url),
      tags:puzzle_tags (id, tag_type, tag_value)
    `, { count: 'exact' })
    .eq('status', 'approved')

  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty as DifficultyLevel)
  if (filters.phase)      query = query.eq('game_phase', filters.phase as GamePhase)
  if (filters.search)     query = query.ilike('title', `%${filters.search}%`)

  // Sort
  switch (filters.sort) {
    case 'most_liked':  query = query.order('upvote_count', { ascending: false }); break
    case 'most_solved': query = query.order('solve_count',  { ascending: false }); break
    default:            query = query.order('created_at',   { ascending: false })
  }

  query = query.range(from, to)
  const { data, count } = await query

  // Filter by hero/mechanic tag (done in-memory after fetch since Supabase
  // doesn't easily support nested foreign-table filters in .eq)
  let filtered = (data ?? []) as any[]
  if (filters.hero) {
    filtered = filtered.filter((p: any) =>
      p.tags.some((t: any) => t.tag_type === 'hero' && t.tag_value === filters.hero)
    )
  }
  if (filters.mechanic) {
    filtered = filtered.filter((p: any) =>
      p.tags.some((t: any) => t.tag_type === 'mechanic' && t.tag_value === filters.mechanic)
    )
  }

  return { puzzles: filtered, total: count ?? 0, page, pageSize: PAGE_SIZE }
}

async function getFilterOptions() {
  const supabase = await createClient()
  const [heroRes, mechRes] = await Promise.all([
    supabase.from('heroes').select('name, slug').eq('is_active', true).order('name'),
    supabase.from('mechanics').select('name, slug').order('name'),
  ])
  return {
    heroes:    heroRes.data   ?? [],
    mechanics: mechRes.data   ?? [],
  }
}

export default async function PuzzlesPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const [{ puzzles, total, page, pageSize }, { heroes, mechanics }] = await Promise.all([
    getPuzzles(filters),
    getFilterOptions(),
  ])

  const totalPages   = Math.ceil(total / pageSize)
  const activeFilters = [filters.difficulty, filters.phase, filters.hero, filters.mechanic].filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Puzzles
        </h1>
        <p className="text-slate-500">
          {total > 0 ? `${formatNumber(total)} community-made puzzles` : 'Browse all puzzles'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar filters ─────────────────────────────── */}
        <aside className="w-full lg:w-56 shrink-0 space-y-4">

          {/* Search */}
          <form method="GET" action="/puzzles">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
              <input
                name="search"
                defaultValue={filters.search}
                placeholder="Search puzzles…"
                className="w-full h-10 rounded-lg pl-9 pr-3 text-sm bg-[#0f1114] border border-white/8 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
              {/* Carry other filter params */}
              {filters.difficulty && <input type="hidden" name="difficulty" value={filters.difficulty} />}
              {filters.phase      && <input type="hidden" name="phase"      value={filters.phase} />}
              {filters.sort       && <input type="hidden" name="sort"       value={filters.sort} />}
            </div>
          </form>

          {/* Filter groups */}
          <FilterGroup title="Sort by">
            <FilterLink href={buildUrl(filters, { sort: undefined })}  active={!filters.sort}>Newest</FilterLink>
            <FilterLink href={buildUrl(filters, { sort: 'most_liked' })}  active={filters.sort === 'most_liked'}>Most liked</FilterLink>
            <FilterLink href={buildUrl(filters, { sort: 'most_solved' })} active={filters.sort === 'most_solved'}>Most solved</FilterLink>
          </FilterGroup>

          <FilterGroup title="Difficulty">
            <FilterLink href={buildUrl(filters, { difficulty: undefined })} active={!filters.difficulty}>All</FilterLink>
            <FilterLink href={buildUrl(filters, { difficulty: 'beginner' })}     active={filters.difficulty === 'beginner'}>Beginner</FilterLink>
            <FilterLink href={buildUrl(filters, { difficulty: 'intermediate' })} active={filters.difficulty === 'intermediate'}>Intermediate</FilterLink>
            <FilterLink href={buildUrl(filters, { difficulty: 'advanced' })}     active={filters.difficulty === 'advanced'}>Advanced</FilterLink>
          </FilterGroup>

          <FilterGroup title="Game phase">
            <FilterLink href={buildUrl(filters, { phase: undefined })} active={!filters.phase}>All</FilterLink>
            <FilterLink href={buildUrl(filters, { phase: 'early' })} active={filters.phase === 'early'}>Early game</FilterLink>
            <FilterLink href={buildUrl(filters, { phase: 'mid' })}   active={filters.phase === 'mid'}>Mid game</FilterLink>
            <FilterLink href={buildUrl(filters, { phase: 'late' })}  active={filters.phase === 'late'}>Late game</FilterLink>
          </FilterGroup>

          {heroes.length > 0 && (
            <FilterGroup title="Hero">
              <FilterLink href={buildUrl(filters, { hero: undefined })} active={!filters.hero}>All heroes</FilterLink>
              {heroes.map((h) => (
                <FilterLink key={h.slug} href={buildUrl(filters, { hero: h.slug })} active={filters.hero === h.slug}>
                  {h.name}
                </FilterLink>
              ))}
            </FilterGroup>
          )}

          {mechanics.length > 0 && (
            <FilterGroup title="Mechanic">
              <FilterLink href={buildUrl(filters, { mechanic: undefined })} active={!filters.mechanic}>All mechanics</FilterLink>
              {mechanics.slice(0, 12).map((m) => (
                <FilterLink key={m.slug} href={buildUrl(filters, { mechanic: m.slug })} active={filters.mechanic === m.slug}>
                  {m.name}
                </FilterLink>
              ))}
            </FilterGroup>
          )}

          {/* Clear filters */}
          {activeFilters.length > 0 && (
            <Link href="/puzzles" className="block text-xs text-amber-400 hover:text-amber-300 transition-colors pt-1">
              Clear all filters ({activeFilters.length})
            </Link>
          )}
        </aside>

        {/* ── Puzzle grid ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {puzzles.length === 0 ? (
            <div className="text-center py-24">
              <SlidersHorizontal className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No puzzles match your filters.</p>
              <Link href="/puzzles" className="text-sm text-amber-400 hover:text-amber-300 mt-2 inline-block">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {puzzles.map((puzzle: any) => (
                  <PuzzleCard key={puzzle.id} puzzle={puzzle} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl(filters, { page: String(page - 1) })}>
                      <button className="px-3 py-1.5 rounded-lg text-sm text-slate-400 bg-[#0f1114] border border-white/8 hover:border-white/15 transition-colors">
                        ← Prev
                      </button>
                    </Link>
                  )}
                  <span className="text-xs text-slate-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildUrl(filters, { page: String(page + 1) })}>
                      <button className="px-3 py-1.5 rounded-lg text-sm text-slate-400 bg-[#0f1114] border border-white/8 hover:border-white/15 transition-colors">
                        Next →
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────

function buildUrl(current: Record<string, string | undefined>, overrides: Record<string, string | undefined>): string {
  const merged = { ...current, ...overrides, page: overrides.page ?? '1' }
  // Remove undefined values
  const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) as Record<string, string>
  const params = new URLSearchParams(clean)
  return `/puzzles?${params.toString()}`
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-600 uppercase tracking-wider mb-1.5 font-medium">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`block text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
        active
          ? 'text-amber-400 bg-amber-500/10'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
      }`}
    >
      {children}
    </Link>
  )
}

function PuzzleCard({ puzzle }: { puzzle: any }) {
  const heroTags = puzzle.tags.filter((t: any) => t.tag_type === 'hero').slice(0, 2)

  return (
    <Link
      href={`/puzzles/${puzzle.slug}`}
      className="group block rounded-xl bg-[#0f1114] border border-white/6 hover:border-amber-500/25 transition-all duration-200 overflow-hidden hover:-translate-y-0.5"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <DifficultyBadge difficulty={puzzle.difficulty} />
          <div className="flex items-center gap-1.5">
            {puzzle.is_potd && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                <Flame className="w-3 h-3" />
              </span>
            )}
            {puzzle.game_phase && <GamePhaseBadge phase={puzzle.game_phase} />}
          </div>
        </div>

        <h2 className="font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug mb-1 line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
          {puzzle.title}
        </h2>

        <p className="text-xs text-slate-600 mb-3">
          by {puzzle.creator?.display_name ?? puzzle.creator?.username}
        </p>

        {heroTags.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {heroTags.map((t: any) => (
              <Badge key={t.id} variant="ghost" size="sm">{t.tag_value}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {formatNumber(puzzle.solve_count)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> {formatNumber(puzzle.upvote_count)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-amber-400 group-hover:gap-2 transition-all">
            Solve <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
