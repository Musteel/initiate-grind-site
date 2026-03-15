import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { DifficultyBadge } from "@/components/ui/badge"
import { Flame, Users, Zap } from "lucide-react"
import { formatNumber } from "@/lib/utils"


export default async function FeaturedPuzzles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('puzzles')
    .select(`
      id, slug, title, difficulty, game_phase,
      solve_count, upvote_count, is_potd,
      profiles!creator_id (username, display_name, avatar_url)
    `)
    .eq('status', 'approved')
    .order('upvote_count', { ascending: false })
    .limit(3)
  return (
    <>{data && data.length > 0 && (
        <section className="py-24 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2
                  className="text-4xl sm:text-5xl font-bold text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Top puzzles
                </h2>
                <p className="text-slate-500">Community favourites — test your game sense.</p>
              </div>
              <Link
                href="/puzzles"
                className="hidden sm:flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.map((puzzle) => (
                <Link
                  key={puzzle.id}
                  href={`/puzzles/${puzzle.slug}`}
                  className="group block rounded-xl bg-[#0f1114] border border-white/6 hover:border-amber-500/25 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <DifficultyBadge difficulty={puzzle.difficulty} />
                      {puzzle.is_potd && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Flame className="w-3 h-3" /> POTD
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors mb-1 leading-snug" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                      {puzzle.title}
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">
                      by {puzzle.profiles?.display_name ?? puzzle.profiles?.username ?? 'Unknown'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {formatNumber(puzzle.solve_count)} solves
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> {formatNumber(puzzle.upvote_count)} likes
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 group-hover:gap-2.5 transition-all duration-150">
                      Solve now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )

}