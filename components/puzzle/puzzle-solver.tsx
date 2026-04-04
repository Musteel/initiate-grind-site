// components/puzzle/puzzle-solver.tsx
'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Zap, Flame, TrendingUp, ChevronRight, RotateCcw } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { Button } from '@/components/ui/button'
import { DifficultyBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { recordPuzzleAttempt } from '@/lib/actions/xp'
import type { PuzzleWithDetails } from '@/lib/supabase'

type SolvePhase =
  | 'watching'     // intro clip playing
  | 'deciding'     // paused — question shown, awaiting choice
  | 'revealing'    // outcome video playing
  | 'result'       // final result + XP screen

interface AttemptResult {
  xpEarned: number
  newStreak: number
  levelUp: boolean
  newLevel: number
}

interface PuzzleSolverProps {
  puzzle: PuzzleWithDetails
  userId?: string
  isPotd?: boolean
}

export function PuzzleSolver({ puzzle, userId, isPotd = false }: PuzzleSolverProps) {
  const [phase, setPhase]           = useState<SolvePhase>('watching')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]         = useState<AttemptResult | null>(null)

  const selectedOption = puzzle.options.find((o) => o.id === selectedId)
  const isCorrect      = selectedOption?.is_correct ?? false

  // Outcome video: per-option override → puzzle-level fallback
  const outcomeVideoType = selectedOption?.outcome_video_type ?? puzzle.outcome_video_type
  const outcomeVideoRef  = selectedOption?.outcome_video_ref  ?? puzzle.outcome_video_ref

  // ── Phase handlers ─────────────────────────────────────────

  const handlePauseReached = useCallback(() => {
    setPhase('deciding')
  }, [])

  const handleSelectOption = useCallback(async (optionId: string) => {
    if (phase !== 'deciding' || submitting) return
    setSelectedId(optionId)
    setSubmitting(true)

    if (userId) {
      const res = await recordPuzzleAttempt({
        puzzleId:         puzzle.id,
        selectedOptionId: optionId,
        isCorrect:        puzzle.options.find((o) => o.id === optionId)?.is_correct ?? false,
        isPotd,
      })
      if (res.success) setResult(res.result)
    }

    setSubmitting(false)

    // Move to revealing — play outcome video if available
    if (outcomeVideoType && outcomeVideoRef) {
      setPhase('revealing')
    } else {
      setPhase('result')
    }
  }, [phase, submitting, userId, puzzle.id, puzzle.options, isPotd, outcomeVideoType, outcomeVideoRef])

  const handleOutcomeEnded = useCallback(() => {
    setPhase('result')
  }, [])

  const handleRetry = useCallback(() => {
    setPhase('watching')
    setSelectedId(null)
    setResult(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Video area ─────────────────────────────────────── */}
      <div className="relative">
        {/* Intro clip */}
        {(phase === 'watching' || phase === 'deciding') && (
          <VideoPlayer
            sourceType={puzzle.intro_video_type}
            sourceRef={puzzle.intro_video_ref}
            pauseAt={puzzle.intro_pause_at}
            onPause={handlePauseReached}
            autoplay={false}
          />
        )}

        {/* Outcome clip */}
        {(phase === 'revealing' || phase === 'result') && outcomeVideoType && outcomeVideoRef && (
          <VideoPlayer
            sourceType={outcomeVideoType}
            sourceRef={outcomeVideoRef}
            autoplay={true}
            onEnded={handleOutcomeEnded}
          />
        )}

        {/* "Decision point" overlay on video */}
        {phase === 'deciding' && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-semibold animate-pulse-brand">
              <Zap className="w-3 h-3" strokeWidth={2.5} />
              Decision point
            </span>
          </div>
        )}
      </div>

      {/* ── Question + options (deciding phase) ────────────── */}
      {phase === 'deciding' && (
        <div className="animate-slide-up space-y-4">
          <div className="rounded-xl bg-[#0f1114] border border-amber-500/20 p-5">
            <p className="text-sm text-amber-400 font-medium mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              What would you do?
            </p>
            <p className="text-lg text-slate-100 font-medium leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
              {puzzle.question_text}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {puzzle.options
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((option) => (
                <OptionButton
                  key={option.id}
                  label={option.label}
                  selected={selectedId === option.id}
                  disabled={submitting}
                  onClick={() => handleSelectOption(option.id)}
                />
              ))}
          </div>

          {submitting && (
            <p className="text-xs text-slate-600 text-center animate-fade-in-fast">Recording your decision…</p>
          )}
        </div>
      )}

      {/* ── "Watch the outcome" prompt (revealing phase) ───── */}
      {phase === 'revealing' && selectedOption && (
        <div className={cn(
          'rounded-xl border p-4 flex items-center gap-3 animate-fade-in-fast',
          isCorrect
            ? 'bg-emerald-500/8 border-emerald-500/20'
            : 'bg-red-500/8 border-red-500/20'
        )}>
          {isCorrect
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          }
          <div>
            <p className={cn('text-sm font-medium', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
              {isCorrect ? 'Correct!' : 'Not quite.'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Watch the outcome to see why.</p>
          </div>
          <button
            onClick={handleOutcomeEnded}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            Skip
          </button>
        </div>
      )}

      {/* ── Result screen (result phase) ───────────────────── */}
      {phase === 'result' && selectedOption && (
        <div className="animate-slide-up space-y-4">

          {/* Verdict banner */}
          <div className={cn(
            'rounded-xl border p-5',
            isCorrect
              ? 'bg-emerald-500/8 border-emerald-500/25'
              : 'bg-red-500/8 border-red-500/25'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg shrink-0',
                isCorrect ? 'bg-emerald-500/15' : 'bg-red-500/15'
              )}>
                {isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-semibold mb-1',
                  isCorrect ? 'text-emerald-400' : 'text-red-400'
                )} style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                  {isCorrect ? 'Great read!' : 'Not the best play.'}
                </h3>
                <p className="text-sm text-slate-400">
                  You chose: <span className="text-slate-200 font-medium">{selectedOption.label}</span>
                </p>
                {!isCorrect && (
                  <p className="text-sm text-slate-400 mt-1">
                    Best answer: <span className="text-emerald-400 font-medium">
                      {puzzle.options.find((o) => o.is_correct)?.label}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Per-option explanation */}
            {selectedOption.explanation && (
              <div className="mt-4 pt-4 border-t border-white/6">
                <p className="text-sm text-slate-400 leading-relaxed">
                  {selectedOption.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Creator explanation */}
          {puzzle.explanation && (
            <div className="rounded-xl bg-[#0f1114] border border-white/8 p-5">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-2">
                Creator&apos;s take
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{puzzle.explanation}</p>
            </div>
          )}

          {/* XP earned */}
          {result && result.xpEarned > 0 && userId && (
            <XpEarnedCard result={result} />
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRetry}
              className="flex-1"
            >
              Watch again
            </Button>
            <a href="/puzzles" className="flex-1">
              <Button
                variant="brand"
                size="sm"
                iconRight={<ChevronRight className="w-4 h-4" />}
                className="w-full"
              >
                Next puzzle
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150',
        'hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-white',
        'active:scale-[0.99]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
          : 'bg-[#0f1114] border-white/8 text-slate-300'
      )}
    >
      {label}
    </button>
  )
}

function XpEarnedCard({ result }: { result: AttemptResult }) {
  return (
    <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4 flex items-center gap-4 animate-scale-in">
      <div className="p-2.5 rounded-lg bg-amber-500/15">
        <Zap className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <p className="text-amber-400 font-semibold text-sm">
          +{result.xpEarned} XP earned
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600">
          {result.newStreak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              {result.newStreak}-day streak
            </span>
          )}
          {result.levelUp && (
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Level {result.newLevel}!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}