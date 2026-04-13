'use client'

//import { useState } from 'react'
import { Info, Clock } from 'lucide-react'
import { VideoSourcePicker } from './video-source-picker'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatSeconds } from '@/lib/utils'
import { useEditor } from './editor-context'
import type { VideoSourceType } from '@/lib/supabase'

export function StepVideo() {
  const { state, setField, goToStep, isStep2Valid } = useEditor()
  //const [pauseInputMode, setPauseInputMode] = useState<'slider' | 'text'>('text')

  return (
    <div className="space-y-7">

      {/* Intro video */}
      <VideoSourcePicker
        label="Intro clip *"
        sourceType={state.intro_video_type}
        sourceRef={state.intro_video_ref}
        onSourceChange={(type: VideoSourceType, ref: string) => {
          setField('intro_video_type', type)
          setField('intro_video_ref', ref)
        }}
        onClear={() => {
          setField('intro_video_ref', '')
          setField('intro_video_type', 'youtube')
        }}
        hint="The clip that plays before the decision point. Should set up the situation clearly."
      />

      {/* Pause timestamp */}
      {state.intro_video_ref && (
        <div className="rounded-xl bg-amber-500/6 border border-amber-500/15 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Pause point</p>
              <p className="text-xs text-slate-500 mt-0.5">
                The video will pause here and show the question. Enter the time in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={0.5}
              value={state.intro_pause_at === '' ? '' : state.intro_pause_at}
              onChange={(e) => setField('intro_pause_at', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="e.g. 12.5"
              className="w-32 h-9 rounded-lg px-3 text-sm bg-slate-900 border border-white/8 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
            />
            {state.intro_pause_at !== '' && (
              <span className="text-sm text-slate-500">
                = {formatSeconds(Number(state.intro_pause_at))}
              </span>
            )}
            <span className="text-xs text-slate-600 ml-auto">Leave blank to not pause (full clip plays)</span>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="space-y-1.5">
        <Input
          label="Question *"
          value={state.question_text}
          onChange={(e) => setField('question_text', e.target.value)}
          placeholder="What should you do here?"
          maxLength={200}
          hint="Shown to the player at the pause point. Ask a clear, concrete decision question."
        />
      </div>

      {/* Explanation */}
      <Textarea
        label="Creator explanation (optional)"
        value={state.explanation}
        onChange={(e) => setField('explanation', e.target.value)}
        placeholder="Explain the reasoning behind the correct answer in depth. This is shown after the player makes their choice."
        maxLength={2000}
        hint={`${state.explanation.length}/2000`}
        className="min-h-[30px]"
      />

      {/* Shared outcome video */}
      <div className="border-t border-white/6 pt-6">
        <div className="flex items-start gap-2.5 mb-4">
          <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-300">Shared outcome video (optional)</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Plays after any answer is selected. You can also set per-answer outcome videos in the next step.
            </p>
          </div>
        </div>

        <VideoSourcePicker
          label="Outcome clip"
          sourceType={state.outcome_video_type as VideoSourceType || ''}
          sourceRef={state.outcome_video_ref}
          onSourceChange={(type: VideoSourceType, ref: string) => {
            setField('outcome_video_type', type)
            setField('outcome_video_ref', ref)
          }}
          onClear={() => {
            setField('outcome_video_ref', '')
            setField('outcome_video_type', '')
          }}
          hint="Optional — shows what actually happened after the decision point."
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => goToStep(1)}>
          ← Back
        </Button>
        <Button
          variant="brand"
          size="lg"
          disabled={!isStep2Valid}
          onClick={() => goToStep(3)}
        >
          Continue to options →
        </Button>
      </div>
    </div>
  )
}