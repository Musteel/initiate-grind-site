import Link from 'next/link'
import {
  Play, ChevronRight, Flame,
  Zap, Target, Brain, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'
import StatsSection from '@/components/stats-section'
import FeaturedPuzzles from '@/components/featured-puzzle'

const STEPS = [
  {
    number: '01',
    icon: Play,
    title: 'Watch the clip',
    description: 'A real Deadlock match clip establishes the game state — positions, souls, objectives, team compositions.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    number: '02',
    icon: Target,
    title: 'Make your decision',
    description: 'Video pauses at the critical moment. Choose from 2–4 options: push, rotate, contest, or back off.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    number: '03',
    icon: Brain,
    title: 'See the outcome',
    description: "Watch what actually happened and why. Understand the reasoning behind each decision.",
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    number: '04',
    icon: Zap,
    title: 'Earn XP & climb',
    description: 'Correct decisions earn XP. Build streaks, climb the leaderboard, and track your improvement.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
]

export default async function LandingPage() {

  return (
    <div className="relative">

      {/* ================================================================
          Hero Section
          ================================================================ */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 py-24">

        {/* Ambient background */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0b0d]/40 to-[#0a0b0d]" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-sky-500/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-violet-500/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-medium mb-8 animate-fade-in">
            <Flame className="w-3.5 h-3.5" />
            Train smarter. Win more.
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-slide-up"
            style={{ fontFamily: 'var(--font-display)', animationDelay: '80ms' }}
          >
            <span className="text-white">Master</span>
            <br />
            <span className="text-gradient-brand">Deadlock</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: '160ms' }}
          >
            Stop guessing. Start training. Solve video puzzles from real Deadlock matches
            and develop the game sense that separates good players from great ones.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            <Link href="/puzzle-of-the-day">
              <Button
                variant="brand"
                size="lg"
                icon={<Flame className="w-5 h-5" />}
                className="text-base font-semibold px-8"
              >
                Today&apos;s puzzle
              </Button>
            </Link>
            <Link href="/puzzles">
              <Button
                variant="secondary"
                size="lg"
                iconRight={<ChevronRight className="w-5 h-5" />}
                className="text-base"
              >
                Browse all puzzles
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <Suspense fallback={<div className="flex items-center justify-center gap-8 mt-14 animate-pulse"
            style={{ animationDelay: '360ms' }}>
            <Stat value="..." label="puzzles" />
            <Stat value="..." label="attempts" />
            <Stat value="..." label="players" />
          </div>}>
            <StatsSection />
          </Suspense>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        </div>
      </section>

      {/* ================================================================
          How it works
          ================================================================ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              How it works
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Four steps that build real game sense — not just statistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="relative p-6 rounded-xl bg-[#0f1114] border border-white/6 hover:border-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-lg border ${step.bg}`}>
                      <Icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <span
                      className="text-4xl font-bold text-white/4 group-hover:text-white/8 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {step.number}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-semibold text-white mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                  {/* Connector line on larger screens */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-px w-px h-8 bg-gradient-to-b from-white/8 to-transparent" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-center mt-10">
            <Link href="/puzzles">
              <Button variant="outline" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
                Try a puzzle now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          Featured puzzles
          ================================================================ */}
      <Suspense fallback={<div className="text-center text-slate-500 py-20 animate-pulse">Loading featured puzzles...</div>}>
        <FeaturedPuzzles />
      </Suspense>

      {/* ================================================================
          Community CTA
          ================================================================ */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-10 sm:p-14 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 rounded-2xl" />
            <div className="relative z-10">
              <h2
                className="text-4xl sm:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Built by the community
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                Submit your own puzzles, vote on submissions, and help fellow Deadlock players improve.
                Every great puzzle starts with someone who wants to share knowledge.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button variant="brand" size="lg" className="px-8 font-semibold">
                    Join for free
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button variant="ghost" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
                    Submit a puzzle
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-bold text-white"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </span>
      <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>
    </div>
  )
}
