// app/(app)/puzzles/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PuzzleSolver } from '@/components/puzzle/puzzle-solver'
import { PuzzleSidebar } from '@/components/puzzle/puzzle-sidebar'
import { DifficultyBadge, GamePhaseBadge } from '@/components/ui/badge'
import type { PuzzleWithDetails } from '@/lib/supabase/index'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPuzzle(slug: string, userId?: string): Promise<PuzzleWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('puzzles')
    .select(`
      *,
      creator:profiles!creator_id (
        id, username, display_name, avatar_url, level
      ),
      options:puzzle_options (
        id, label, is_correct, explanation,
        outcome_video_type, outcome_video_ref, sort_order
      ),
      tags:puzzle_tags (
        id, tag_type, tag_value
      )
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (error || !data) return null

  // Check user-specific state if authenticated
  let userHasLiked    = false
  let userHasAttempted = false

  if (userId) {
    const [likeRes, attemptRes] = await Promise.all([
      supabase.from('puzzle_likes')
        .select('puzzle_id').eq('puzzle_id', data.id).eq('user_id', userId).maybeSingle(),
      supabase.from('puzzle_attempts')
        .select('id').eq('puzzle_id', data.id).eq('user_id', userId).limit(1).maybeSingle(),
    ])
    userHasLiked    = !!likeRes.data
    userHasAttempted = !!attemptRes.data
  }

  return {
    ...data,
    creator:           data.creator as any,
    options:           (data.options as any[]).sort((a, b) => a.sort_order - b.sort_order),
    tags:              data.tags as any[],
    user_has_liked:    userHasLiked,
    user_has_attempted: userHasAttempted,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('puzzles')
    .select('title, description, difficulty')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Puzzle not found' }

  return {
    title: data.title,
    description: data.description ?? `Solve this ${data.difficulty} Deadlock puzzle and improve your game sense.`,
  }
}

export default async function PuzzlePage({ params }: PageProps) {
  const { slug }  = await params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const puzzle = await getPuzzle(slug, user?.id)
  if (!puzzle) notFound()

  // Check if this is today's POTD
  const { data: potd } = await supabase
    .from('potd_log')
    .select('puzzle_id')
    .eq('date', new Date().toISOString().split('T')[0])
    .maybeSingle()
  const isPotd = potd?.puzzle_id === puzzle.id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Breadcrumb / title ───────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {isPotd && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/12 border border-amber-500/25">
              <Flame className="w-3 h-3" /> Puzzle of the Day
            </span>
          )}
          <DifficultyBadge difficulty={puzzle.difficulty} />
          {puzzle.game_phase && <GamePhaseBadge phase={puzzle.game_phase} />}
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {puzzle.title}
        </h1>
        {puzzle.description && (
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">{puzzle.description}</p>
        )}
      </div>

      {/* ── Main layout: solver + sidebar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 xl:gap-8">

        {/* Left: video solver */}
        <div>
          <PuzzleSolver
            puzzle={puzzle}
            userId={user?.id}
            isPotd={isPotd}
          />
        </div>

        {/* Right: meta sidebar */}
        <div>
          <PuzzleSidebar
            puzzle={puzzle}
            userId={user?.id}
            hasAttempted={puzzle.user_has_attempted}
          />
        </div>
      </div>
    </div>
  )
}