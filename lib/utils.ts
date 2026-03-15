import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DifficultyLevel, GamePhase } from "./supabase/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// XP & Level calculations
// ============================================================

/** Total XP required to reach a given level */
export function xpForLevel(level: number): number {
  return level * level * 100
}

/** Level derived from total XP */
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)))
}

/** XP progress within the current level (0–1) */
export function xpProgressInLevel(xp: number): number {
  const level = levelForXp(xp)
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return (xp - current) / (next - current)
}

/** XP remaining until next level */
export function xpToNextLevel(xp: number): number {
  const level = levelForXp(xp)
  return xpForLevel(level + 1) - xp
}

// ============================================================
// Formatting
// ============================================================

export function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toString()
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return formatDate(date)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ============================================================
// Video helpers
// ============================================================

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/clip\/([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function parseTwitchClipUrl(url: string): string | null {
  const match = url.match(/(?:twitch\.tv\/\w+\/clip\/|clips\.twitch\.tv\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export function getYouTubeEmbedUrl(videoId: string, opts?: {
  start?: number
  autoplay?: boolean
  muted?: boolean
}): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1',
    ...(opts?.autoplay ? { autoplay: '1' } : {}),
    ...(opts?.muted ? { mute: '1' } : {}),
    ...(opts?.start ? { start: String(Math.floor(opts.start)) } : {}),
  })
  return `https://www.youtube.com/embed/${videoId}?${params}`
}

export function getTwitchClipEmbedUrl(slug: string): string {
  const parent = process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, '') ?? 'localhost'
  return `https://clips.twitch.tv/embed?clip=${slug}&parent=${parent}&autoplay=false`
}

// ============================================================
// Difficulty helpers
// ============================================================

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  advanced:     'text-red-400 bg-red-400/10 border-red-400/20',
}

export const DIFFICULTY_DOT_COLORS: Record<DifficultyLevel, string> = {
  beginner:     'bg-emerald-400',
  intermediate: 'bg-amber-400',
  advanced:     'bg-red-400',
}

export const GAME_PHASE_COLORS: Record<GamePhase, string> = {
  early: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  mid:   'text-violet-400 bg-violet-400/10 border-violet-400/20',
  late:  'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

// ============================================================
// Slug generation (mirrors DB function, used for previews)
// ============================================================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ============================================================
// Auth helpers
// ============================================================

export function getAvatarFallback(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ============================================================
// Pagination
// ============================================================

export const PAGE_SIZE = 20

export function getPaginationRange(page: number, pageSize = PAGE_SIZE) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}
