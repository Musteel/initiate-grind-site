import type { Metadata } from 'next'
import { Trophy, Flame, Zap, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar, LevelBadge } from '@/components/ui/badge'
import { formatXp } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Leaderboard' }

interface Player {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  streak: number
}

async function getLeaderboard() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, xp, level, streak')
    .is('banned_at', null)
    .order('xp', { ascending: false })
    .limit(50)
  return data ?? []
}

async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

export default async function LeaderboardPage() {
  const [players, userId] = await Promise.all([getLeaderboard(), getCurrentUserId()])

  const top3   = players.slice(0, 3)
  const rest   = players.slice(3)

  const rankColors = [
    'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
    'text-slate-400 bg-slate-400/10 border-slate-400/25',
    'text-orange-400 bg-orange-400/10 border-orange-400/25',
  ]
  const rankIcons = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <Trophy className="w-7 h-7 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Leaderboard
        </h1>
        <p className="text-slate-500">Top Deadlock Trainer players ranked by XP</p>
      </div>

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8 items-end">
          {/* 2nd */}
          <PodiumCard player={top3[1]} rank={2} colorClass={rankColors[1]} rankIcon={rankIcons[1]} userId={userId} />
          {/* 1st */}
          <PodiumCard player={top3[0]} rank={1} colorClass={rankColors[0]} rankIcon={rankIcons[0]} userId={userId} tall />
          {/* 3rd */}
          <PodiumCard player={top3[2]} rank={3} colorClass={rankColors[2]} rankIcon={rankIcons[2]} userId={userId} />
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="rounded-xl bg-[#0f1114] border border-white/8 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/6 text-xs text-slate-600 uppercase tracking-wider font-medium">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">XP</span>
            <span className="text-right">Streak</span>
          </div>

          <div className="divide-y divide-white/4">
            {rest.map((player, i) => {
              const rank    = i + 4
              const isMe    = player.id === userId

              return (
                <Link
                  key={player.id}
                  href={`/profile/${player.username}`}
                  className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors hover:bg-white/3 ${isMe ? 'bg-amber-500/5' : ''}`}
                >
                  <span className="text-sm text-slate-600 font-mono w-7 text-right">{rank}</span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={player.avatar_url} name={player.display_name ?? player.username} size="sm" />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-amber-400' : 'text-slate-200'}`}>
                        {player.display_name ?? player.username}
                        {isMe && <span className="ml-1.5 text-xs text-amber-500">(you)</span>}
                      </p>
                      <LevelBadge level={player.level} />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-200 font-mono">{formatXp(player.xp)}</span>
                    <p className="text-xs text-slate-600">XP</p>
                  </div>

                  <div className="text-right w-16">
                    {player.streak > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <Flame className="w-3 h-3" /> {player.streak}d
                      </span>
                    ) : (
                      <span className="text-xs text-slate-700">—</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-20">
          <Medal className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No players yet — be the first!</p>
        </div>
      )}
    </div>
  )
}

function PodiumCard({
  player,
 // rank,
  colorClass,
  rankIcon,
  userId,
  tall = false,
}: {
  player: Player
  rank: number
  colorClass: string
  rankIcon: string
  userId?: string
  tall?: boolean
}) {
  const isMe = player.id === userId
  return (
    <Link
      href={`/profile/${player.username}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${
        tall ? 'bg-amber-500/6 border-amber-500/20 pb-6 pt-6' : 'bg-[#0f1114] border-white/8 py-4'
      } ${isMe ? 'ring-1 ring-amber-500/30' : ''}`}
    >
      <span className="text-2xl">{rankIcon}</span>
      <Avatar
        src={player.avatar_url}
        name={player.display_name ?? player.username}
        size={tall ? 'lg' : 'md'}
      />
      <div className="text-center min-w-0 w-full">
        <p className="text-xs font-medium text-slate-200 truncate">
          {player.display_name ?? player.username}
        </p>
        <LevelBadge level={player.level} />
      </div>
      <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border ${colorClass}`}>
        <Zap className="w-3 h-3" />
        {formatXp(player.xp)}
      </div>
      {player.streak > 0 && (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500" />{player.streak}d
        </span>
      )}
    </Link>
  )
}
