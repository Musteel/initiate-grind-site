import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Flame, Zap, TrendingUp, Target,
  BookOpen, CheckCircle2, Clock, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar, DifficultyBadge, LevelBadge } from '@/components/ui/badge'
import { formatXp, xpProgressInLevel, xpToNextLevel, formatRelativeTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [profileRes, attemptsRes, recentRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('puzzle_attempts')
      .select('is_correct', { count: 'exact' })
      .eq('user_id', userId),
    supabase.from('puzzle_attempts')
      .select(`
        id, is_correct, xp_earned, attempted_at,
        puzzle:puzzles!puzzle_id (id, slug, title, difficulty)
      `)
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false })
      .limit(8),
  ])

  const profile  = profileRes.data
  const attempts = attemptsRes.data ?? []
  const recent   = recentRes.data   ?? []

  const totalAttempts  = attemptsRes.count ?? 0
  const correctAttempts = attempts.filter((a) => a.is_correct).length
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  return { profile, totalAttempts, correctAttempts, accuracy, recent }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard')

  const { profile, totalAttempts, correctAttempts, accuracy, recent } =
    await getDashboardData(user.id)

  if (!profile) redirect('/')

  const xpProgress   = xpProgressInLevel(profile.xp)
  const xpRemaining  = xpToNextLevel(profile.xp)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* ── Profile header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name ?? profile.username}
          size="xl"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {profile.display_name ?? profile.username}
            </h1>
            <LevelBadge level={profile.level} />
          </div>
          <p className="text-slate-500 text-sm mb-3">@{profile.username}</p>

          {/* XP progress bar */}
          <div className="max-w-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>{formatXp(profile.xp)} XP</span>
              <span>{formatXp(xpRemaining)} to level {profile.level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
                style={{ width: `${Math.min(100, xpProgress * 100).toFixed(1)}%` }}
              />
            </div>
          </div>
        </div>

        {profile.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 shrink-0">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-amber-400 leading-none">{profile.streak}</p>
              <p className="text-xs text-slate-600">day streak</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<BookOpen className="w-5 h-5 text-sky-400" />}   value={totalAttempts}   label="Puzzles attempted" color="sky" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} value={correctAttempts} label="Correct answers" color="emerald" />
        <StatCard icon={<Target className="w-5 h-5 text-violet-400" />}  value={`${accuracy}%`} label="Accuracy" color="violet" />
        <StatCard icon={<Zap className="w-5 h-5 text-amber-400" />}      value={formatXp(profile.xp)} label="Total XP" color="amber" />
      </div>

      {/* ── Recent activity ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Recent activity
          </h2>
          <Link href="/puzzles" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Solve more <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl bg-[#0f1114] border border-white/8 p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No puzzles solved yet.</p>
            <Link href="/puzzles" className="inline-block mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors">
              Start with your first puzzle →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl bg-[#0f1114] border border-white/8 overflow-hidden divide-y divide-white/4">
            {recent.map((attempt: any) => (
              <Link
                key={attempt.id}
                href={`/puzzles/${attempt.puzzle?.slug}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  attempt.is_correct ? 'bg-emerald-500/15' : 'bg-red-500/15'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${attempt.is_correct ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium">
                    {attempt.puzzle?.title ?? 'Unknown puzzle'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {attempt.puzzle?.difficulty && (
                      <DifficultyBadge difficulty={attempt.puzzle.difficulty} showDot={false} />
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(attempt.attempted_at)}
                    </span>
                  </div>
                </div>

                {attempt.xp_earned > 0 && (
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1 shrink-0">
                    <Zap className="w-3 h-3" /> +{attempt.xp_earned}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/puzzle-of-the-day" icon={<Flame className="w-4 h-4 text-amber-400" />} label="Today's puzzle" desc="Earn 2× XP + streak" />
        <QuickLink href="/puzzles"            icon={<BookOpen className="w-4 h-4 text-sky-400" />} label="Browse puzzles" desc={`${totalAttempts} solved so far`} />
        <QuickLink href="/submit"             icon={<TrendingUp className="w-4 h-4 text-violet-400" />} label="Submit a puzzle" desc="Earn 200 XP on approval" />
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className={`rounded-xl bg-[#0f1114] border border-white/8 p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white font-mono" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-xs text-slate-600 mt-0.5">{label}</p>
    </div>
  )
}

function QuickLink({ href, icon, label, desc }: {
  href: string; icon: React.ReactNode; label: string; desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-[#0f1114] border border-white/8 hover:border-white/14 hover:bg-white/3 transition-all group"
    >
      <div className="p-2 rounded-lg bg-white/4 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-slate-600">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 ml-auto shrink-0 transition-colors" />
    </Link>
  )
}
