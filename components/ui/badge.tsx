import * as React from "react";
import { cn } from "@/lib/utils";
import type { DifficultyLevel, GamePhase } from '@/lib/supabase/types';

// ============================================================
// Generic Badge
// ============================================================

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'ghost'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-slate-800 text-slate-300 border border-white/8',
  brand:   'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/25',
  info:    'bg-sky-500/15 text-sky-400 border border-sky-500/25',
  ghost:   'bg-white/5 text-slate-400 border border-white/6',
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// ============================================================
// Difficulty Badge
// ============================================================

const difficultyConfig: Record<DifficultyLevel, { label: string; className: string; dot: string }> = {
  beginner: {
    label: 'Beginner',
    className: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-amber-500/12 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-red-500/12 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
}

export function DifficultyBadge({
  difficulty,
  showDot = true,
}: {
  difficulty: DifficultyLevel
  showDot?: boolean
}) {
  const config = difficultyConfig[difficulty]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md',
        config.className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {config.label}
    </span>
  )
}

// ============================================================
// Game Phase Badge
// ============================================================

const gamePhaseConfig: Record<GamePhase, { label: string; className: string }> = {
  early: { label: 'Early game', className: 'bg-sky-500/12 text-sky-400 border border-sky-500/20' },
  mid:   { label: 'Mid game',   className: 'bg-violet-500/12 text-violet-400 border border-violet-500/20' },
  late:  { label: 'Late game',  className: 'bg-orange-500/12 text-orange-400 border border-orange-500/20' },
}

export function GamePhaseBadge({ phase }: { phase: GamePhase }) {
  const config = gamePhaseConfig[phase]
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md', config.className)}>
      {config.label}
    </span>
  )
}

// ============================================================
// Avatar
// ============================================================

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const fallback = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-slate-800 border border-white/8',
        'font-medium text-slate-300 shrink-0 overflow-hidden',
        avatarSizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </span>
  )
}

// ============================================================
// XP Level Badge
// ============================================================

export function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-mono">
      LVL {level}
    </span>
  )
}