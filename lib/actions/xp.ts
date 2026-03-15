'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { XP_AMOUNTS, XP_REASONS } from '@/lib/supabase'

interface AttemptResult {
  xpEarned: number
  newStreak: number
  levelUp: boolean
  newLevel: number
}

/**
 * Records a puzzle attempt, awards XP, updates streak.
 * Called from the puzzle solve page after a user picks an option.
 */
export async function recordPuzzleAttempt(input: {
  puzzleId: string
  selectedOptionId: string
  isCorrect: boolean
  isPotd: boolean
}): Promise<{ success: true; result: AttemptResult } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const admin = createAdminClient()

    // Get current profile for level-up detection
    const { data: profile } = await admin
      .from('profiles')
      .select('xp, level, streak')
      .eq('id', user.id)
      .single()

    if (!profile) return { success: false, error: 'Profile not found' }

    // Determine if this is first attempt on this puzzle
    const { count: prevAttempts } = await admin
      .from('puzzle_attempts')
      .select('id', { count: 'exact' })
      .eq('puzzle_id', input.puzzleId)
      .eq('user_id', user.id)

    const isFirstAttempt = (prevAttempts ?? 0) === 0

    // Calculate XP
    let xpEarned = 0
    const reasons: { amount: number; reason: string }[] = []

    if (input.isCorrect) {
      const baseXp = isFirstAttempt
        ? XP_AMOUNTS[XP_REASONS.PUZZLE_CORRECT_FIRST]
        : XP_AMOUNTS[XP_REASONS.PUZZLE_CORRECT_RETRY]

      xpEarned += baseXp
      reasons.push({ amount: baseXp, reason: isFirstAttempt ? XP_REASONS.PUZZLE_CORRECT_FIRST : XP_REASONS.PUZZLE_CORRECT_RETRY })

      // POTD bonus
      if (input.isPotd) {
        xpEarned += XP_AMOUNTS[XP_REASONS.POTD_BONUS]
        reasons.push({ amount: XP_AMOUNTS[XP_REASONS.POTD_BONUS], reason: XP_REASONS.POTD_BONUS })
      }
    }

    // Record attempt
    await admin.from('puzzle_attempts').insert({
      puzzle_id:          input.puzzleId,
      user_id:            user.id,
      selected_option_id: input.selectedOptionId,
      is_correct:         input.isCorrect,
      xp_earned:          xpEarned,
      is_potd_attempt:    input.isPotd,
    })

    // Award XP via DB function
    for (const { amount, reason } of reasons) {
      await admin.rpc('award_xp', {
        p_user_id: user.id,
        p_amount:  amount,
        p_reason:  reason,
        p_ref_id:  input.puzzleId,
      })
    }

    // Update streak (returns new streak value)
    const { data: newStreakData } = await admin.rpc('update_streak', {
      p_user_id: user.id,
    })
    const newStreak = newStreakData ?? profile.streak

    // Streak bonuses
    if (newStreak > profile.streak) {
      // Daily streak bonus
      await admin.rpc('award_xp', {
        p_user_id: user.id,
        p_amount:  XP_AMOUNTS[XP_REASONS.STREAK_DAILY_BONUS],
        p_reason:  XP_REASONS.STREAK_DAILY_BONUS,
        p_ref_id:  input.puzzleId,
      })
      xpEarned += XP_AMOUNTS[XP_REASONS.STREAK_DAILY_BONUS]

      // 7-day streak bonus
      if (newStreak % 7 === 0) {
        await admin.rpc('award_xp', {
          p_user_id: user.id,
          p_amount:  XP_AMOUNTS[XP_REASONS.STREAK_7_DAY_BONUS],
          p_reason:  XP_REASONS.STREAK_7_DAY_BONUS,
          p_ref_id:  input.puzzleId,
        })
        xpEarned += XP_AMOUNTS[XP_REASONS.STREAK_7_DAY_BONUS]
      }
    }

    // Check for level up
    const { data: updatedProfile } = await admin
      .from('profiles')
      .select('level')
      .eq('id', user.id)
      .single()

    const newLevel  = updatedProfile?.level ?? profile.level
    const levelUp   = newLevel > profile.level

    return {
      success: true,
      result: { xpEarned, newStreak, levelUp, newLevel },
    }
  } catch (err: any) {
    console.error('[recordPuzzleAttempt]', err)
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

/**
 * Increments the view count on a puzzle (fire-and-forget, no auth required)
 */
export async function incrementPuzzleView(puzzleId: string) {
  try {
    const admin = createAdminClient()
    await admin
      .from('puzzles')
      .update({ view_count: admin.rpc('', {}) }) // Use raw SQL increment
      .eq('id', puzzleId)

    // Simpler: direct SQL
    await admin.rpc('increment_view_count' as any, { p_puzzle_id: puzzleId }).throwOnError()
  } catch {
    // Silently ignore — view count is non-critical
  }
}
