'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Send, Trash2, Eye, AlertCircle } from 'lucide-react'
import { submitPuzzleForReview, deleteDraftPuzzle } from '@/lib/actions/puzzles'
import type { PuzzleStatus } from '@/lib/supabase'

interface SubmissionActionsProps {
  puzzleId: string
  slug?:    string
  status:   PuzzleStatus
}

export function SubmissionActions({ puzzleId, slug, status }: SubmissionActionsProps) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    const res = await submitPuzzleForReview(puzzleId)
    if (!res.success) setError(res.error)
    else router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!showConfirm) { setShowConfirm(true); return }
    setLoading(true)
    const res = await deleteDraftPuzzle(puzzleId)
    if (!res.success) {
      setError(res.error ?? 'Delete failed')
      setLoading(false)
    } else {
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end shrink-0">
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Submit draft */}
      {status === 'draft' && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Submit
        </button>
      )}

      {/* Resubmit rejected */}
      {status === 'rejected' && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Resubmit
        </button>
      )}

      {/* View live */}
      {status === 'approved' && slug && (
        <Link href={`/puzzles/${slug}`}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            View live
          </button>
        </Link>
      )}

      {/* Delete draft */}
      {status === 'draft' && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {showConfirm ? 'Confirm delete' : 'Delete'}
        </button>
      )}
    </div>
  )
}