// app/(app)/submissions/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Clock, CheckCircle2, XCircle, BarChart2,
  /*Trash2*/ Send, Eye, ArrowRight, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { PuzzleStatus } from '@/lib/supabase'
import { SubmissionActions } from '@/components/submit/submission-actions'

export const metadata: Metadata = { title: 'My submissions' }

const STATUS_CONFIG: Record<PuzzleStatus, {
  label:   string
  color:   string
  icon:    React.ReactNode
  desc:    string
}> = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
    icon:  <Clock className="w-3.5 h-3.5" />,
    desc:  'Not yet submitted',
  },
  pending_vote: {
    label: 'Needs votes',
    color: 'bg-sky-500/12 text-sky-400 border border-sky-500/20',
    icon:  <BarChart2 className="w-3.5 h-3.5" />,
    desc:  'Community voting in progress',
  },
  pending_review: {
    label: 'Under review',
    color: 'bg-amber-500/12 text-amber-400 border border-amber-500/20',
    icon:  <Eye className="w-3.5 h-3.5" />,
    desc:  'Awaiting admin approval',
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20',
    icon:  <CheckCircle2 className="w-3.5 h-3.5" />,
    desc:  'Live on the platform',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/12 text-red-400 border border-red-500/20',
    icon:  <XCircle className="w-3.5 h-3.5" />,
    desc:  'See feedback below',
  },
  archived: {
    label: 'Archived',
    color: 'bg-slate-500/12 text-slate-400 border border-slate-500/20',
    icon:  <Clock className="w-3.5 h-3.5" />,
    desc:  'No longer active',
  },
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/submissions')

  const { data: puzzles } = await supabase
    .from('puzzles')
    .select(`
      id, slug, title, status, difficulty, community_votes,
      rejection_reason, created_at, updated_at
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const items = puzzles ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            My submissions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {items.length} puzzle{items.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link href="/submit">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" />
            New puzzle
          </button>
        </Link>
      </div>

      {/* Success banner */}
      {params.submitted && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Puzzle submitted!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              It&rsquo;s now open for community voting. Share the link to get more votes.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[#0f1114] border border-white/6">
          <Send className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No puzzles yet
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Create your first puzzle and share your Deadlock knowledge.
          </p>
          <Link href="/submit">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 transition-colors">
              <Plus className="w-4 h-4" /> Create a puzzle
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((puzzle) => {
            const config = STATUS_CONFIG[puzzle.status as PuzzleStatus]

            return (
              <div
                key={puzzle.id}
                className="rounded-xl bg-[#0f1114] border border-white/8 p-5 hover:border-white/12 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + difficulty */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                      <DifficultyBadge difficulty={puzzle.difficulty as any} />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-slate-100 leading-snug mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                      {puzzle.title}
                    </h3>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>Created {formatRelativeTime(puzzle.created_at)}</span>

                      {puzzle.status === 'pending_vote' && (
                        <span className="text-sky-400">
                          {puzzle.community_votes ?? 0}/10 votes needed
                        </span>
                      )}

                      {puzzle.status === 'approved' && puzzle.slug && (
                        <Link href={`/puzzles/${puzzle.slug}`} className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors">
                          View live <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {puzzle.status === 'rejected' && puzzle.rejection_reason && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-400">
                        <span className="font-medium">Feedback: </span>
                        {puzzle.rejection_reason}
                      </div>
                    )}

                    {/* Vote progress bar */}
                    {puzzle.status === 'pending_vote' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Community votes</span>
                          <span>{puzzle.community_votes ?? 0}/10</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all"
                            style={{ width: `${Math.min(100, ((puzzle.community_votes ?? 0) / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <SubmissionActions
                    puzzleId={puzzle.id}
                    slug={puzzle.slug ?? undefined}
                    status={puzzle.status as PuzzleStatus}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}