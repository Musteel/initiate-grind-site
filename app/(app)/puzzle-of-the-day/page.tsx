// app/(app)/puzzle-of-the-day/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Flame, Calendar, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PuzzleSolver } from '@/components/puzzle/puzzle-solver'
import { PuzzleSidebar } from '@/components/puzzle/puzzle-sidebar'
import { DifficultyBadge } from '@/components/ui/badge'
import type { PuzzleWithDetails } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Puzzle of the Day' }

async function getTodaysPotd(userId?: string): Promise<PuzzleWithDetails | null> {
  const supabase = await createClient()
  const today    = new Date().toISOString().split('T')[0]

  // Look up today's POTD
  const { data: potd } = await supabase
    .from('potd_log')
    .select('puzzle_id')
    .eq('date', today)
    .maybeSingle()

  if (!potd?.puzzle_id) return null

  const { data } = await supabase
    .from('puzzles')
    .select(`
      *,
      creator:profiles!creator_id (id, username, display_name, avatar_url, level),
      options:puzzle_options (id, label, is_correct, explanation, outcome_video_type, outcome_video_ref, sort_order),
      tags:puzzle_tags (id, tag_type, tag_value)
    `)
    .eq('id', potd.puzzle_id)
    .eq('status', 'approved')
    .single()

  if (!data) return null

  let userHasLiked    = false
  let userHasAttempted = false

  if (userId) {
    const [likeRes, attemptRes] = await Promise.all([
      supabase.from('puzzle_likes').select('puzzle_id').eq('puzzle_id', data.id).eq('user_id', userId).maybeSingle(),
      supabase.from('puzzle_attempts').select('id').eq('puzzle_id', data.id).eq('user_id', userId).maybeSingle(),
    ])
    userHasLiked    = !!likeRes.data
    userHasAttempted = !!attemptRes.data
  }

  return {
    ...data,
    creator:            data.creator as any,
    options:            (data.options as any[]).sort((a, b) => a.sort_order - b.sort_order),
    tags:               data.tags as any[],
    user_has_liked:     userHasLiked,
    user_has_attempted: userHasAttempted,
  }
}

export default async function PotdPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const puzzle = await getTodaysPotd(user?.id)

  const today     = new Date()
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* POTD header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/25">
              <Flame className="w-4 h-4" /> Puzzle of the Day
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {puzzle ? puzzle.title : 'Coming soon'}
          </h1>
          <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
            <Calendar className="w-3.5 h-3.5" /> {dateLabel}
          </p>
        </div>

        {/* Bonus XP callout */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs text-amber-400 font-semibold">2× XP bonus</p>
            <p className="text-xs text-slate-600">Counts toward daily streak</p>
          </div>
        </div>
      </div>

      {!puzzle ? (
        <div className="text-center py-24">
          <Flame className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No puzzle scheduled yet
          </h2>
          <p className="text-slate-600 text-sm">Check back later — today&rsquo;s puzzle is being prepared.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 xl:gap-8">
          <div>
            {puzzle.difficulty && (
              <div className="mb-4">
                <DifficultyBadge difficulty={puzzle.difficulty} />
              </div>
            )}
            <PuzzleSolver puzzle={puzzle} userId={user?.id} isPotd={true} />
          </div>
          <div>
            <PuzzleSidebar puzzle={puzzle} userId={user?.id} hasAttempted={puzzle.user_has_attempted} />
          </div>
        </div>
      )}
    </div>
  )
}
