// app/(app)/submit/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PuzzleEditor } from '@/components/submit/puzzle-editor'

export const metadata: Metadata = { title: 'Submit a puzzle' }

export default async function SubmitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/submit')

  // Fetch taxonomy for the form
  const [heroRes, mechRes] = await Promise.all([
    supabase.from('heroes').select('name, slug').eq('is_active', true).order('name'),
    supabase.from('mechanics').select('name, slug').order('name'),
  ])

  const heroes    = heroRes.data    ?? []
  const mechanics = mechRes.data    ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <Plus className="w-6 h-6 text-amber-400" />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Submit a puzzle
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          Create a video puzzle from a real Deadlock match. Walk players through a decision point and explain the reasoning behind the correct play.
        </p>
      </div>

      <PuzzleEditor heroes={heroes} mechanics={mechanics} />
    </div>
  )
}
