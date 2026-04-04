// app/(app)/submissions/vote/page.tsx
import type { Metadata } from 'next'
import { BarChart2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge, Avatar } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { VoteButton } from '@/components/submit/vote-button'

export const metadata: Metadata = { title: 'Vote on submissions' }

export default async function VotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pendingPuzzles } = await supabase
    .from('puzzles')
    .select(`
      id, title, description, difficulty, game_phase,
      community_votes, created_at,
      creator:profiles!creator_id (username, display_name, avatar_url)
    `)
    .eq('status', 'pending_vote')
    .order('community_votes', { ascending: false })
    .limit(50)

  // Get current user's votes for these puzzles
  let userVotedIds = new Set<string>()
  if (user && pendingPuzzles?.length) {
    const { data: votes } = await supabase
      .from('puzzle_votes')
      .select('puzzle_id')
      .eq('user_id', user.id)
      .in('puzzle_id', pendingPuzzles.map((p) => p.id))
    votes?.forEach((v) => userVotedIds.add(v.puzzle_id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Vote on submissions
        </h1>
        <p className="text-slate-500 text-sm">
          Help great puzzles reach the platform. Puzzles with 10+ votes go to admin review.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-sky-500/6 border border-sky-500/15 text-sky-400 text-sm">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Voting is anonymous. You can change your vote at any time.
          {!user && ' Sign in to vote on submissions.'}
        </span>
      </div>

      {!pendingPuzzles || pendingPuzzles.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#0f1114] border border-white/6">
          <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No puzzles waiting for votes right now.</p>
          <p className="text-slate-600 text-sm mt-1">
            <a href="/submit" className="text-amber-400 hover:text-amber-300 transition-colors">Submit a puzzle</a> to get the queue started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingPuzzles.map((puzzle: any) => (
            <div
              key={puzzle.id}
              className="rounded-xl bg-[#0f1114] border border-white/8 p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <DifficultyBadge difficulty={puzzle.difficulty} />
                </div>
                <h3 className="font-semibold text-slate-100 leading-snug mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                  {puzzle.title}
                </h3>
                {puzzle.description && (
                  <p className="text-sm text-slate-500 mb-2 line-clamp-2">{puzzle.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Avatar
                    src={puzzle.creator?.avatar_url}
                    name={puzzle.creator?.display_name ?? puzzle.creator?.username}
                    size="xs"
                  />
                  <span>by {puzzle.creator?.display_name ?? puzzle.creator?.username}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(puzzle.created_at)}</span>
                </div>

                {/* Vote progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                    <span>{puzzle.community_votes} / 10 votes to reach review</span>
                    <span>{Math.round((puzzle.community_votes / 10) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all"
                      style={{ width: `${Math.min(100, (puzzle.community_votes / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Vote button */}
              <VoteButton
                puzzleId={puzzle.id}
                initialVoted={userVotedIds.has(puzzle.id)}
                initialCount={puzzle.community_votes}
                disabled={!user}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
