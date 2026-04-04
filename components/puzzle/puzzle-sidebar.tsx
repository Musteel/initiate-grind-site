// components/puzzle/puzzle-sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Flag, Star, Users, Eye,
  Clock, Share2, ChevronDown, ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, DifficultyBadge, GamePhaseBadge, LevelBadge, Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils'
import type { PuzzleWithDetails } from '@/lib/supabase'

interface PuzzleSidebarProps {
  puzzle: PuzzleWithDetails
  userId?: string
  hasAttempted?: boolean
}

export function PuzzleSidebar({ puzzle, userId, hasAttempted: initialHasAttempted }: PuzzleSidebarProps) {
  const [liked, setLiked]         = useState(puzzle.user_has_liked ?? false)
  const [likeCount, setLikeCount] = useState(puzzle.upvote_count)
  const [likePending, setLikePending] = useState(false)
  const [ratingOpen, setRatingOpen]   = useState(false)
  const [reportOpen, setReportOpen]   = useState(false)
  const [hasAttempted] = useState(initialHasAttempted ?? puzzle.user_has_attempted ?? false)

  const supabase = createClient()

  const heroTags     = puzzle.tags.filter((t) => t.tag_type === 'hero')
  const mechanicTags = puzzle.tags.filter((t) => t.tag_type === 'mechanic')

  async function handleLike() {
    if (!userId || likePending) return
    setLikePending(true)
    if (liked) {
      await supabase.from('puzzle_likes').delete()
        .eq('puzzle_id', puzzle.id).eq('user_id', userId)
      setLiked(false)
      setLikeCount((n) => Math.max(0, n - 1))
    } else {
      await supabase.from('puzzle_likes').insert({ puzzle_id: puzzle.id, user_id: userId })
      setLiked(true)
      setLikeCount((n) => n + 1)
    }
    setLikePending(false)
  }

  return (
    <div className="space-y-4">

      {/* ── Meta card ─────────────────────────────────────── */}
      <div className="rounded-xl bg-[#0f1114] border border-white/8 p-5 space-y-4">

        {/* Creator */}
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Creator</p>
          <Link
            href={`/profile/${puzzle.creator.username}`}
            className="flex items-center gap-2.5 group"
          >
            <Avatar
              src={puzzle.creator.avatar_url}
              name={puzzle.creator.display_name ?? puzzle.creator.username}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                {puzzle.creator.display_name ?? puzzle.creator.username}
              </p>
              <LevelBadge level={puzzle.creator.level} />
            </div>
          </Link>
        </div>

        <hr className="border-white/6" />

        {/* Classification */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Difficulty</span>
            <DifficultyBadge difficulty={puzzle.difficulty} />
          </div>
          {puzzle.game_phase && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Game phase</span>
              <GamePhaseBadge phase={puzzle.game_phase} />
            </div>
          )}
          {puzzle.avg_difficulty && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Community rating</span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {puzzle.avg_difficulty.toFixed(1)}/3
              </span>
            </div>
          )}
        </div>

        <hr className="border-white/6" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem icon={<Users className="w-3.5 h-3.5" />} value={formatNumber(puzzle.solve_count)} label="solves" />
          <StatItem icon={<Eye className="w-3.5 h-3.5" />}   value={formatNumber(puzzle.view_count)}  label="views" />
          <StatItem icon={<Heart className="w-3.5 h-3.5" />} value={formatNumber(likeCount)}           label="likes" />
          <StatItem icon={<Clock className="w-3.5 h-3.5" />} value={formatRelativeTime(puzzle.created_at)} label="" />
        </div>
      </div>

      {/* ── Tags ─────────────────────────────────────────── */}
      {(heroTags.length > 0 || mechanicTags.length > 0) && (
        <div className="rounded-xl bg-[#0f1114] border border-white/8 p-4 space-y-3">
          {heroTags.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Heroes</p>
              <div className="flex flex-wrap gap-1.5">
                {heroTags.map((tag) => (
                  <Link key={tag.id} href={`/puzzles?hero=${tag.tag_value}`}>
                    <Badge variant="ghost" size="sm" className="hover:border-amber-500/30 hover:text-amber-400 cursor-pointer transition-colors">
                      {tag.tag_value}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {mechanicTags.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Mechanics</p>
              <div className="flex flex-wrap gap-1.5">
                {mechanicTags.map((tag) => (
                  <Link key={tag.id} href={`/puzzles?mechanic=${tag.tag_value}`}>
                    <Badge variant="ghost" size="sm" className="hover:border-sky-500/30 hover:text-sky-400 cursor-pointer transition-colors">
                      {tag.tag_value}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="rounded-xl bg-[#0f1114] border border-white/8 p-4 space-y-2">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!userId || likePending}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            liked
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15'
              : 'bg-white/4 text-slate-400 border border-white/6 hover:bg-white/6 hover:text-slate-200',
            (!userId) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Heart className={cn('w-4 h-4', liked && 'fill-red-400')} />
          {liked ? 'Liked' : 'Like this puzzle'}
          <span className="ml-auto text-xs text-slate-600">{formatNumber(likeCount)}</span>
        </button>

        {/* Rate difficulty (only after attempting) */}
        {hasAttempted && userId && (
          <DifficultyRater puzzleId={puzzle.id} userId={userId} />
        )}

        {/* Share */}
        <button
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 bg-white/4 border border-white/6 hover:bg-white/6 hover:text-slate-200 transition-all duration-150"
        >
          <Share2 className="w-4 h-4" />
          Share puzzle
        </button>

        {/* Report */}
        {userId && (
          <button
            onClick={() => setReportOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Flag className="w-4 h-4" />
            Report
          </button>
        )}

        {!userId && (
          <Link href="/login">
            <button className="w-full text-xs text-slate-600 text-center py-1 hover:text-slate-400 transition-colors">
              Sign in to interact with puzzles
            </button>
          </Link>
        )}
      </div>

    </div>
  )
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="text-slate-600">{icon}</span>
      <span className="text-slate-300 font-medium">{value}</span>
      {label && <span>{label}</span>}
    </div>
  )
}

function DifficultyRater({ puzzleId, userId }: { puzzleId: string; userId: string }) {
  const [rating, setRating]     = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [open, setOpen]           = useState(false)
  const supabase = createClient()

  async function submit(r: number) {
    setRating(r)
    setSubmitted(true)
    setOpen(false)
    await supabase.from('difficulty_ratings').upsert({
      puzzle_id: puzzleId,
      user_id: userId,
      rating: r,
    })
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-emerald-400">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        Thanks for rating!
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 bg-white/4 border border-white/6 hover:bg-white/6 hover:text-slate-200 transition-all duration-150"
      >
        <Star className="w-4 h-4" />
        Rate difficulty
        {open ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
      </button>
      {open && (
        <div className="flex gap-2 mt-2 px-1 animate-fade-in-fast">
          {[
            { value: 1, label: 'Easy',   color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
            { value: 2, label: 'Medium', color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' },
            { value: 3, label: 'Hard',   color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => submit(value)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                'bg-transparent',
                color
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}