'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { togglePuzzleVote } from '@/lib/actions/puzzles'

interface VoteButtonProps {
  puzzleId:     string
  initialVoted: boolean
  initialCount: number
  disabled?:    boolean
}

export function VoteButton({
  puzzleId,
  initialVoted,
  initialCount,
  disabled = false,
}: VoteButtonProps) {
  const [voted,   setVoted]   = useState(initialVoted)
  const [count,   setCount]   = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (disabled || loading) return
    setLoading(true)

    // Optimistic update
    const wasVoted = voted
    setVoted(!wasVoted)
    setCount((n) => wasVoted ? Math.max(0, n - 1) : n + 1)

    const res = await togglePuzzleVote(puzzleId)
    if (!res.success) {
      // Revert on failure
      setVoted(wasVoted)
      setCount((n) => wasVoted ? n + 1 : Math.max(0, n - 1))
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <button
        onClick={handleToggle}
        disabled={disabled || loading}
        title={disabled ? 'Sign in to vote' : voted ? 'Remove vote' : 'Upvote this puzzle'}
        className={cn(
          'flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all duration-150',
          'font-semibold text-sm min-w-[60px]',
          voted
            ? 'border-sky-500/60 bg-sky-500/12 text-sky-400'
            : 'border-white/10 bg-transparent text-slate-500 hover:border-sky-500/30 hover:text-sky-400 hover:bg-sky-500/5',
          (disabled || loading) && 'opacity-50 cursor-not-allowed hover:border-white/10 hover:text-slate-500 hover:bg-transparent'
        )}
      >
        <ThumbsUp className={cn('w-5 h-5 transition-transform', voted && 'fill-sky-400', loading && 'animate-spin')} />
        <span className="font-mono">{count}</span>
      </button>
      {disabled && (
        <span className="text-xs text-slate-700">Sign in</span>
      )}
    </div>
  )
}