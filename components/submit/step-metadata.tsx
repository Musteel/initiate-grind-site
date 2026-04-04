// components/submit/step-metadata.tsx
'use client'

import { X } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditor } from './editor-context'
import type { DifficultyLevel, GamePhase } from '@/lib/supabase'

interface StepMetadataProps {
  heroes:    { name: string; slug: string }[]
  mechanics: { name: string; slug: string }[]
}

const DIFFICULTIES: { value: DifficultyLevel; label: string; desc: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Fundamental decisions, clear signals', color: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Requires game knowledge and context',  color: 'border-amber-500/40 bg-amber-500/8 text-amber-400' },
  { value: 'advanced',     label: 'Advanced',     desc: 'Pro-level reads and nuanced calls',    color: 'border-red-500/40 bg-red-500/8 text-red-400' },
]

const GAME_PHASES: { value: GamePhase; label: string; desc: string }[] = [
  { value: 'early', label: 'Early game', desc: 'Laning phase, first objectives' },
  { value: 'mid',   label: 'Mid game',   desc: 'Rotations, skirmishes, picks' },
  { value: 'late',  label: 'Late game',  desc: 'Team fights, final pushes' },
]

export function StepMetadata({ heroes, mechanics }: StepMetadataProps) {
  const { state, dispatch, setField, isStep1Valid, goToStep } = useEditor()

  function toggleHero(slug: string) {
    const next = state.hero_tags.includes(slug)
      ? state.hero_tags.filter((s) => s !== slug)
      : [...state.hero_tags, slug]
    dispatch({ type: 'SET_HERO_TAGS', payload: next })
  }

  function toggleMechanic(slug: string) {
    const next = state.mechanic_tags.includes(slug)
      ? state.mechanic_tags.filter((s) => s !== slug)
      : [...state.mechanic_tags, slug]
    dispatch({ type: 'SET_MECHANIC_TAGS', payload: next })
  }

  return (
    <div className="space-y-7">
      {/* Title */}
      <Input
        label="Puzzle title *"
        value={state.title}
        onChange={(e) => setField('title', e.target.value)}
        placeholder="e.g. Should you push T2 or take jungle?"
        maxLength={120}
        hint={`${state.title.length}/120 — be specific and descriptive`}
      />

      {/* Description */}
      <Textarea
        label="Description (optional)"
        value={state.description}
        onChange={(e) => setField('description', e.target.value)}
        placeholder="Brief context about what makes this situation interesting…"
        maxLength={400}
        hint={`${state.description.length}/400`}
        className="min-h-[80px]"
      />

      {/* Difficulty */}
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">
          Difficulty *
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {DIFFICULTIES.map((d) => {
            const selected = state.difficulty === d.value
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setField('difficulty', d.value)}
                className={cn(
                  'text-left p-3.5 rounded-xl border-2 transition-all duration-150',
                  selected
                    ? d.color
                    : 'border-white/8 bg-transparent text-slate-500 hover:border-white/15 hover:text-slate-300'
                )}
              >
                <p className="text-sm font-semibold">{d.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{d.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Game phase */}
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">
          Game phase <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {GAME_PHASES.map((p) => {
            const selected = state.game_phase === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setField('game_phase', selected ? '' : p.value)}
                className={cn(
                  'text-left p-3 rounded-xl border transition-all duration-150',
                  selected
                    ? 'border-sky-500/40 bg-sky-500/8 text-sky-400'
                    : 'border-white/8 bg-transparent text-slate-500 hover:border-white/15 hover:text-slate-300'
                )}
              >
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{p.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hero tags */}
      {heroes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Heroes featured <span className="text-slate-600 font-normal">(select all that apply)</span>
          </label>
          {state.hero_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {state.hero_tags.map((slug) => {
                const hero = heroes.find((h) => h.slug === slug)
                return (
                  <span key={slug} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/12 text-amber-400 border border-amber-500/25">
                    {hero?.name ?? slug}
                    <button type="button" onClick={() => toggleHero(slug)} className="hover:text-amber-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {heroes.map((h) => {
              const selected = state.hero_tags.includes(h.slug)
              if (selected) return null
              return (
                <button
                  key={h.slug}
                  type="button"
                  onClick={() => toggleHero(h.slug)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#0a0b0d] border border-white/8 text-slate-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                >
                  {h.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mechanic tags */}
      {mechanics.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Mechanics covered <span className="text-slate-600 font-normal">(select all that apply)</span>
          </label>
          {state.mechanic_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {state.mechanic_tags.map((slug) => {
                const mech = mechanics.find((m) => m.slug === slug)
                return (
                  <span key={slug} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-500/12 text-sky-400 border border-sky-500/25">
                    {mech?.name ?? slug}
                    <button type="button" onClick={() => toggleMechanic(slug)} className="hover:text-sky-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {mechanics.map((m) => {
              const selected = state.mechanic_tags.includes(m.slug)
              if (selected) return null
              return (
                <button
                  key={m.slug}
                  type="button"
                  onClick={() => toggleMechanic(m.slug)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#0a0b0d] border border-white/8 text-slate-500 hover:border-sky-500/30 hover:text-sky-400 transition-colors"
                >
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Next */}
      <div className="pt-2 flex justify-end">
        <Button
          variant="brand"
          size="lg"
          disabled={!isStep1Valid}
          onClick={() => goToStep(2)}
        >
          Continue to video →
        </Button>
      </div>
    </div>
  )
}
