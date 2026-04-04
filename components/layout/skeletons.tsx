// components/layout/skeletons.tsx
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Base skeleton primitive
// ─────────────────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

// ─────────────────────────────────────────────────────────────
// Puzzle card skeleton — matches PuzzleCard layout
// ─────────────────────────────────────────────────────────────

export function PuzzleCardSkeleton() {
  return (
    <div className="rounded-xl bg-[#0f1114] border border-white/6 p-5 space-y-3">
      {/* Badge row */}
      <div className="flex gap-2">
        <Bone className="h-6 w-20" />
        <Bone className="h-6 w-16" />
      </div>
      {/* Title */}
      <Bone className="h-5 w-4/5" />
      <Bone className="h-4 w-3/5" />
      {/* Creator */}
      <Bone className="h-3.5 w-28" />
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Bone className="h-3.5 w-16" />
          <Bone className="h-3.5 w-16" />
        </div>
        <Bone className="h-3.5 w-14" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Puzzle grid skeleton — 6 cards
// ─────────────────────────────────────────────────────────────

export function PuzzleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PuzzleCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Leaderboard skeleton
// ─────────────────────────────────────────────────────────────

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {[68, 84, 68].map((h, i) => (
          <div key={i} className={`rounded-xl bg-[#0f1114] border border-white/6 flex flex-col items-center gap-3 p-4`} style={{ paddingTop: i === 1 ? '1.5rem' : undefined, paddingBottom: i === 1 ? '1.5rem' : undefined }}>
            <Bone className="h-6 w-6 rounded-full" />
            <Bone className="w-10 h-10 rounded-full" />
            <Bone className="h-3.5 w-16" />
            <Bone className="h-5 w-14" />
          </div>
        ))}
      </div>
      {/* Rows */}
      <div className="rounded-xl bg-[#0f1114] border border-white/8 divide-y divide-white/4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5">
            <Bone className="h-4 w-6" />
            <div className="flex items-center gap-2.5">
              <Bone className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-12" />
              </div>
            </div>
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Admin table skeleton
// ─────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  const widths = ['w-48', 'w-20', 'w-24', 'w-16', 'w-20']
  return (
    <div className="rounded-xl bg-[#0f1114] border border-white/8 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/6 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className={`h-3.5 ${widths[i % widths.length]}`} />
        ))}
      </div>
      <div className="divide-y divide-white/4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex gap-6 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Bone key={j} className={`h-4 ${j === 0 ? 'flex-1' : widths[j % widths.length]}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Puzzle solve page skeleton — shown while video loads
// ─────────────────────────────────────────────────────────────

export function PuzzleSolveSkeleton() {
  return (
    <div className="space-y-6">
      {/* Video area */}
      <Bone className="w-full aspect-video rounded-xl" />
      {/* Question area */}
      <div className="rounded-xl bg-[#0f1114] border border-white/8 p-5 space-y-3">
        <Bone className="h-3.5 w-32" />
        <Bone className="h-5 w-4/5" />
      </div>
      {/* Options */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Profile skeleton
// ─────────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#0f1114] border border-white/8 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Bone className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-3">
              <Bone className="h-7 w-40" />
              <Bone className="h-5 w-16" />
            </div>
            <Bone className="h-4 w-24" />
            <Bone className="h-2 w-56 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-[#0f1114] border border-white/8 p-4 space-y-2">
            <Bone className="h-5 w-5" />
            <Bone className="h-7 w-16" />
            <Bone className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
