import { createClient } from "@/lib/supabase/client"
import { formatNumber } from "@/lib/utils"

export default async function StatsSection() {
    const supabase = await createClient()
    const [puzzlesRes, attemptsRes, profilesRes] = await Promise.all([
        supabase.from('puzzles').select('id', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('puzzle_attempts').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
    ])
    const stats = {
        puzzles: puzzlesRes.count ?? 0,
        attempts: attemptsRes.count ?? 0,
        players: profilesRes.count ?? 0,
    }
    return (
        <div
            className="flex items-center justify-center gap-8 mt-14 animate-fade-in"
            style={{ animationDelay: '360ms' }}
        >
            {stats.puzzles > 0 && <Stat value={formatNumber(stats.puzzles)} label="puzzles" />}
            {stats.attempts > 0 && <Stat value={formatNumber(stats.attempts)} label="attempts" />}
            {stats.players > 0 && <Stat value={formatNumber(stats.players)} label="players" />}
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