// components/submit/step-options.tsx
'use client'

import { useState } from 'react'
import {
  Plus, Trash2, CheckCircle2, Circle,
  ChevronDown, ChevronUp, GripVertical,
} from 'lucide-react'
import { VideoSourcePicker } from './video-source-picker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditor, makeOption } from './editor-context'
import type { VideoSourceType } from '@/types'

export function StepOptions() {
  const { state, dispatch, goToStep, isStep3Valid } = useEditor()
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  const correctCount = state.options.filter((o) => o.is_correct).length

  function addOption() {
    dispatch({ type: 'ADD_OPTION' })
  }

  function removeOption(id: string) {
    dispatch({ type: 'REMOVE_OPTION', payload: id })
    if (expandedOption === id) setExpandedOption(null)
  }

  function updateOption(id: string, field: any, value: any) {
    dispatch({ type: 'UPDATE_OPTION', payload: { id, field, value } })
  }

  function toggleCorrect(id: string) {
    // Only one option can be correct — unset others first
    state.options.forEach((o) => {
      if (o.id !== id && o.is_correct) {
        dispatch({ type: 'UPDATE_OPTION', payload: { id: o.id, field: 'is_correct', value: false } })
      }
    })
    dispatch({ type: 'UPDATE_OPTION', payload: { id, field: 'is_correct', value: true } })
  }

  return (
    <div className="space-y-5">

      {/* Header hint */}
      <div className="rounded-xl bg-[#0a0b0d] border border-white/8 p-4 text-sm text-slate-500 space-y-1">
        <p>• Add 2–4 answer options. Exactly one must be marked as correct.</p>
        <p>• Each option can optionally have its own outcome video and explanation.</p>
        <p>• Write options as actions, not descriptions — e.g. "Push the lane" not "Pushing the lane is correct".</p>
      </div>

      {/* Validation state */}
      {state.options.length >= 2 && correctCount === 0 && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
          Mark one option as correct before continuing.
        </p>
      )}

      {/* Option list */}
      <div className="space-y-3">
        {state.options.map((option, index) => {
          const isExpanded = expandedOption === option.id
          const hasExtras  = !!option.explanation || !!option.outcome_video_ref

          return (
            <div
              key={option.id}
              className={cn(
                'rounded-xl border transition-all duration-150 overflow-hidden',
                option.is_correct
                  ? 'border-emerald-500/30 bg-emerald-500/4'
                  : 'border-white/8 bg-[#0f1114]'
              )}
            >
              {/* Option row */}
              <div className="flex items-center gap-3 p-3.5">
                {/* Correct toggle */}
                <button
                  type="button"
                  onClick={() => toggleCorrect(option.id)}
                  title={option.is_correct ? 'Marked as correct' : 'Mark as correct'}
                  className="shrink-0 transition-colors"
                >
                  {option.is_correct
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                  }
                </button>

                {/* Label input */}
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(option.id, 'label', e.target.value)}
                  placeholder={`Option ${index + 1} — e.g. "Rotate to mid"`}
                  maxLength={200}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
                />

                {/* Expand/collapse extras */}
                <button
                  type="button"
                  onClick={() => setExpandedOption(isExpanded ? null : option.id)}
                  className={cn(
                    'shrink-0 p-1.5 rounded-lg transition-colors text-slate-600 hover:text-slate-400',
                    hasExtras && 'text-sky-500'
                  )}
                  title="Add explanation or per-option video"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  disabled={state.options.length <= 2}
                  className="shrink-0 p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded extras */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/6 space-y-4 animate-fade-in-fast">
                  {/* Per-option explanation */}
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">
                      Explanation for this option (optional)
                    </label>
                    <textarea
                      value={option.explanation}
                      onChange={(e) => updateOption(option.id, 'explanation', e.target.value)}
                      placeholder="Why is this a good or bad choice in this situation?"
                      maxLength={500}
                      rows={3}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-slate-900 border border-white/8 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  {/* Per-option outcome video */}
                  <VideoSourcePicker
                    label="Outcome video for this option (optional)"
                    sourceType={option.outcome_video_type ?? ''}
                    sourceRef={option.outcome_video_ref ?? ''}
                    onSourceChange={(type: VideoSourceType, ref: string) => {
                      updateOption(option.id, 'outcome_video_type', type)
                      updateOption(option.id, 'outcome_video_ref', ref)
                    }}
                    onClear={() => {
                      updateOption(option.id, 'outcome_video_type', undefined)
                      updateOption(option.id, 'outcome_video_ref', undefined)
                    }}
                    hint="Overrides the shared outcome video for this specific choice."
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add option button */}
      {state.options.length < 4 && (
        <button
          type="button"
          onClick={addOption}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/10 text-sm text-slate-600 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add option ({state.options.length}/4)
        </button>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => goToStep(2)}>← Back</Button>
        <Button
          variant="brand"
          size="lg"
          disabled={!isStep3Valid}
          onClick={() => goToStep(4)}
        >
          Preview & submit →
        </Button>
      </div>
    </div>
  )
}
