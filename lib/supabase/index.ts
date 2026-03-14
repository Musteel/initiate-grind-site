// Convenience types used throughout the application

import type { Database } from './types'

// ============================================================
// Row aliases
// ============================================================

export type Profile       = Database['public']['Tables']['profiles']['Row']
export type Hero          = Database['public']['Tables']['heroes']['Row']
export type Mechanic      = Database['public']['Tables']['mechanics']['Row']
export type Puzzle        = Database['public']['Tables']['puzzles']['Row']
export type PuzzleOption  = Database['public']['Tables']['puzzle_options']['Row']
export type PuzzleTag     = Database['public']['Tables']['puzzle_tags']['Row']
export type PuzzleAttempt = Database['public']['Tables']['puzzle_attempts']['Row']
export type Comment       = Database['public']['Tables']['comments']['Row']
export type Report        = Database['public']['Tables']['reports']['Row']
export type XpLog         = Database['public']['Tables']['xp_log']['Row']

// ============================================================
// Enum re-exports
// ============================================================

export type {
  UserRole,
  PuzzleStatus,
  DifficultyLevel,
  GamePhase,
  VideoSourceType,
  TagType,
  ReportStatus,
} from './types'

// ============================================================
// Enriched / joined types (used in UI)
// ============================================================

export interface PuzzleWithDetails extends Puzzle {
  creator: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>
  options: PuzzleOption[]
  tags: PuzzleTag[]
  user_has_liked?: boolean
  user_has_attempted?: boolean
  user_has_voted?: boolean     // submission vote
}

export interface PuzzleCardData {
  id: string
  slug: string
  title: string
  difficulty: Puzzle['difficulty']
  game_phase: Puzzle['game_phase']
  solve_count: number
  upvote_count: number
  avg_difficulty: number | null
  is_potd: boolean
  potd_date: string | null
  created_at: string
  creator: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
  tags: PuzzleTag[]
  user_has_liked?: boolean
  user_has_attempted?: boolean
}

export interface LeaderboardEntry {
  rank: number
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'xp' | 'level' | 'streak'>
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>
  replies?: CommentWithAuthor[]
}

export interface DashboardStats {
  puzzles_attempted: number
  puzzles_correct: number
  accuracy_percent: number
  current_streak: number
  xp: number
  level: number
  xp_to_next_level: number
  recent_attempts: Array<{
    puzzle: Pick<Puzzle, 'id' | 'slug' | 'title' | 'difficulty'>
    attempt: PuzzleAttempt
  }>
}

// ============================================================
// Form / API input types
// ============================================================

export interface PuzzleCreateInput {
  title: string
  description?: string
  difficulty: Puzzle['difficulty']
  game_phase?: Puzzle['game_phase']
  intro_video_type: Puzzle['intro_video_type']
  intro_video_ref: string
  intro_pause_at?: number
  outcome_video_type?: Puzzle['outcome_video_type']
  outcome_video_ref?: string
  question_text: string
  explanation?: string
  options: {
    label: string
    is_correct: boolean
    explanation?: string
    outcome_video_type?: Puzzle['outcome_video_type']
    outcome_video_ref?: string
    sort_order: number
  }[]
  hero_tags: string[]    // hero slugs
  mechanic_tags: string[] // mechanic slugs
}

export interface PuzzleAttemptInput {
  puzzle_id: string
  selected_option_id: string
  is_potd_attempt?: boolean
}

// ============================================================
// Filter / query param types
// ============================================================

export interface PuzzleFilters {
  difficulty?: Puzzle['difficulty'] | null
  game_phase?: Puzzle['game_phase'] | null
  hero?: string | null         // hero slug
  mechanic?: string | null     // mechanic slug
  search?: string | null
  sort?: 'newest' | 'most_liked' | 'most_solved' | null
  page?: number
}

// ============================================================
// XP award reasons
// ============================================================

export const XP_REASONS = {
  PUZZLE_CORRECT_FIRST:  'puzzle_correct_first',
  PUZZLE_CORRECT_RETRY:  'puzzle_correct_retry',
  STREAK_DAILY_BONUS:    'streak_daily_bonus',
  STREAK_7_DAY_BONUS:    'streak_7_day_bonus',
  POTD_BONUS:            'potd_bonus',
  PUZZLE_APPROVED:       'puzzle_approved',
  PUZZLE_10_UPVOTES:     'puzzle_10_upvotes',
} as const

export const XP_AMOUNTS = {
  [XP_REASONS.PUZZLE_CORRECT_FIRST]:  50,
  [XP_REASONS.PUZZLE_CORRECT_RETRY]:  20,
  [XP_REASONS.STREAK_DAILY_BONUS]:    10,
  [XP_REASONS.STREAK_7_DAY_BONUS]:   100,
  [XP_REASONS.POTD_BONUS]:            50, // bonus on top of base
  [XP_REASONS.PUZZLE_APPROVED]:      200,
  [XP_REASONS.PUZZLE_10_UPVOTES]:     50,
} as const

export const DIFFICULTY_LABELS: Record<Puzzle['difficulty'], string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

export const GAME_PHASE_LABELS: Record<NonNullable<Puzzle['game_phase']>, string> = {
  early: 'Early game',
  mid:   'Mid game',
  late:  'Late game',
}
