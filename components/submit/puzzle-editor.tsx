'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorProvider, useEditor } from './editor-context'
import { StepMetadata } from './step-metadata'
import { StepVideo } from './step-video'
import { StepOptions } from './step-options'
import { StepPreview } from './step-preview'

interface PuzzleEditorProps {
  heroes:    { name: string; slug: string }[]
  mechanics: { name: string; slug: string }[]
}

const STEPS = [
  { number: 1, label: 'Details'  },
  { number: 2, label: 'Video'    },
  { number: 3, label: 'Options'  },
  { number: 4, label: 'Preview'  },
]

function StepIndicator() {
  const { state, goToStep, isStep1Valid, isStep2Valid, isStep3Valid } = useEditor()

  const isReachable = (n: number) => {
    if (n === 1) return true
    if (n === 2) return isStep1Valid
    if (n === 3) return isStep1Valid && isStep2Valid
    if (n === 4) return isStep1Valid && isStep2Valid && isStep3Valid
    return false
  }

  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const current    = state.step === step.number
        const completed  = state.step > step.number
        const reachable  = isReachable(step.number)

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => reachable && goToStep(step.number as 1 | 2 | 3 | 4)}
              disabled={!reachable}
              className={cn(
                'flex flex-col items-center gap-1.5 group transition-all',
                reachable ? 'cursor-pointer' : 'cursor-not-allowed'
              )}
            >
              {/* Circle */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                current   && 'border-amber-500 bg-amber-500 text-slate-950',
                completed && 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
                !current && !completed && reachable  && 'border-white/15 bg-transparent text-slate-500 group-hover:border-white/30',
                !current && !completed && !reachable && 'border-white/8 bg-transparent text-slate-700',
              )}>
                {completed ? <Check className="w-4 h-4" /> : step.number}
              </div>
              {/* Label */}
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                current   && 'text-amber-400',
                completed && 'text-emerald-400',
                !current && !completed && 'text-slate-600',
              )}>
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors',
                state.step > step.number ? 'bg-emerald-500/40' : 'bg-white/6'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EditorBody({ heroes, mechanics }: PuzzleEditorProps) {
  const { state } = useEditor()

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator />
      <div className="rounded-2xl bg-[#0f1114] border border-white/8 p-6 sm:p-8 shadow-[0_8px_48px_rgba(0,0,0,0.4)]">
        {state.step === 1 && <StepMetadata heroes={heroes} mechanics={mechanics} />}
        {state.step === 2 && <StepVideo />}
        {state.step === 3 && <StepOptions />}
        {state.step === 4 && <StepPreview />}
      </div>
    </div>
  )
}

export function PuzzleEditor({ heroes, mechanics }: PuzzleEditorProps) {
  return (
    <EditorProvider>
      <EditorBody heroes={heroes} mechanics={mechanics} />
    </EditorProvider>
  )
}
