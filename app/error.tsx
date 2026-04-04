// app/error.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorProps {
  error:  Error & { digest?: string }
  reset:  () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to your error-tracking service here (e.g. Sentry)
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 space-y-5 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Something went wrong
          </h1>
          <p className="text-slate-500 text-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-700 mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium text-sm border border-white/8 hover:bg-white/8 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}