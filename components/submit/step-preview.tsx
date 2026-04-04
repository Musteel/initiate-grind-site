// components/submit/step-preview.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Circle, AlertCircle, Zap,
  Edit2, Send
} from 'lucide-react'
import { VideoPlayer } from '@/components/puzzle/video-player'
import { Button } from '@/components/ui/button'
import { DifficultyBadge, GamePhaseBadge, Badge } from '@/components/ui/badge'
import { cn, formatSeconds } from '@/lib/utils'
import { useEditor } from './editor-context'
import { createDraftPuzzle, updatePuzzle, submitPuzzleForReview } from '@/lib/actions/puzzles'
import type { VideoSourceType } from '@/lib/supabase'

export function StepPreview() {
  const { state, dispatch, goToStep } = useEditor()
  const [saving,    setSaving]    = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    setSaving(true)
    setSubmitErr(null)

    try {
      // Build the input object
      const parsedPauseAt = state.intro_pause_at !== '' ? parseFloat(state.intro_pause_at.trim()) : NaN
      const input = {
        title:              state.title,
        description:        state.description || undefined,
        difficulty:         state.difficulty,
        game_phase:         state.game_phase || undefined,
        intro_video_type:   state.intro_video_type as VideoSourceType,
        intro_video_ref:    state.intro_video_ref,
        intro_pause_at:     Number.isFinite(parsedPauseAt) ? parsedPauseAt : undefined,
        outcome_video_type: state.outcome_video_type ? state.outcome_video_type as VideoSourceType : undefined,
        outcome_video_ref:  state.outcome_video_ref  || undefined,
        question_text:      state.question_text,
        explanation:        state.explanation || undefined,
        options:            state.options.map((o, i) => ({
          label:              o.label,
          is_correct:         o.is_correct,
          explanation:        o.explanation || undefined,
          outcome_video_type: o.outcome_video_type,
          outcome_video_ref:  o.outcome_video_ref,
          sort_order:         i,
        })),
        hero_tags:      state.hero_tags,
        mechanic_tags:  state.mechanic_tags,
      }

      let puzzleId = state.savedPuzzleId

      if (!puzzleId) {
        // Create the draft first
        const res = await createDraftPuzzle(input as any)
        if (!res.success) throw new Error(res.error)
        puzzleId = res.puzzleId
        dispatch({ type: 'SET_SAVED_ID', payload: puzzleId })
      } else {
        // Update the existing draft
        const updateRes = await updatePuzzle(puzzleId, input as any)
        if (!updateRes.success) throw new Error(updateRes.error)
      }

      // Then submit for review
      const submitRes = await submitPuzzleForReview(puzzleId)
      if (!submitRes.success) throw new Error(submitRes.error)

      // Done — redirect to submissions
      router.push('/submissions?submitted=1')
    } catch (err: any) {
      setSubmitErr(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="rounded-xl bg-amber-500/6 border border-amber-500/15 p-4">
        <p className="text-sm text-amber-400 font-medium mb-1">Review your puzzle</p>
        <p className="text-xs text-slate-500">
          This is exactly what players will see. Double-check everything before submitting.
        </p>
      </div>

      {/* Title + meta */}
      <div className="rounded-xl bg-[#0f1114] border border-white/8 p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={state.difficulty} />
          {state.game_phase && <GamePhaseBadge phase={state.game_phase as any} />}
        </div>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {state.title}
        </h2>
        {state.description && (
          <p className="text-sm text-slate-500">{state.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {state.hero_tags.map((t) => (
            <Badge key={t} variant="ghost" size="sm">{t}</Badge>
          ))}
          {state.mechanic_tags.map((t) => (
            <Badge key={t} variant="info" size="sm">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Intro video preview */}
      {state.intro_video_ref && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium">Intro clip</p>
          <VideoPlayer
            sourceType={state.intro_video_type as VideoSourceType}
            sourceRef={state.intro_video_ref}
          />
          {state.intro_pause_at !== '' && (
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              Pauses at {formatSeconds(Number(state.intro_pause_at))} — question appears here
            </p>
          )}
        </div>
      )}

      {/* Question */}
      <div className="rounded-xl bg-[#0f1114] border border-amber-500/20 p-4">
        <p className="text-xs text-amber-400 font-medium mb-1.5">Question shown at pause point</p>
        <p className="text-slate-100 font-medium">{state.question_text || <span className="text-slate-600 italic">No question set</span>}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <p className="text-xs text-slate-600 uppercase tracking-wider font-medium">Answer options</p>
        {state.options.map((o, i) => (
          <div
            key={o.id}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border',
              o.is_correct
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-white/8 bg-[#0f1114]'
            )}
          >
            {o.is_correct
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              : <Circle className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', o.is_correct ? 'text-emerald-300' : 'text-slate-300')}>
                {o.label || <span className="italic text-slate-600">Empty option</span>}
              </p>
              {o.explanation && (
                <p className="text-xs text-slate-500 mt-1">{o.explanation}</p>
              )}
              {o.outcome_video_ref && (
                <p className="text-xs text-sky-500 mt-1">Has per-option outcome video</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Outcome video */}
      {state.outcome_video_ref && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium">Shared outcome clip</p>
          <VideoPlayer
            sourceType={state.outcome_video_type as VideoSourceType}
            sourceRef={state.outcome_video_ref}
          />
        </div>
      )}

      {/* Creator explanation */}
      {state.explanation && (
        <div className="rounded-xl bg-[#0f1114] border border-white/8 p-4">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">Your explanation</p>
          <p className="text-sm text-slate-400">{state.explanation}</p>
        </div>
      )}

      {/* Error */}
      {submitErr && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 animate-fade-in-fast">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-sm">{submitErr}</span>
        </div>
      )}

      {/* Info about workflow */}
      <div className="rounded-xl bg-[#0a0b0d] border border-white/6 p-4 text-xs text-slate-600 space-y-1">
        <p>After submitting, your puzzle will be visible to the community for voting.</p>
        <p>Once it reaches 10 upvotes, it moves to admin review. Approval awards you <span className="text-amber-400">200 XP</span>.</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => goToStep(3)}>← Back</Button>
          <Button variant="secondary" icon={<Edit2 className="w-4 h-4" />} onClick={() => goToStep(1)}>
            Edit
          </Button>
        </div>
        <Button
          variant="brand"
          size="lg"
          loading={saving}
          icon={<Send className="w-4 h-4" />}
          onClick={handleSubmit}
        >
          Submit for review
        </Button>
      </div>
    </div>
  )
}