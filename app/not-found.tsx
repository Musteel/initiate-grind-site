import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Zap className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
          </div>
        </div>

        {/* 404 number */}
        <div>
          <p
            className="text-[120px] sm:text-[160px] font-bold leading-none text-gradient-brand select-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            404
          </p>
        </div>

        <div className="space-y-2">
          <h1
            className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Page not found
          </h1>
          <p className="text-slate-500 max-w-sm mx-auto">
            This puzzle doesn&rsquo;t exist — or it may have been removed. Head back to the arena.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            href="/puzzles"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium text-sm border border-white/8 hover:bg-white/8 transition-colors"
          >
            Browse puzzles
          </Link>
        </div>
      </div>
    </div>
  )
}
