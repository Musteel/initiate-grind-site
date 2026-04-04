'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PuzzleCreateInput } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PuzzleActionResult =
    | { success: true; puzzleId: string; slug?: string }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// Create a new draft puzzle
// ─────────────────────────────────────────────────────────────

export async function createDraftPuzzle(
    input: PuzzleCreateInput
): Promise<PuzzleActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const admin = createAdminClient()

        // Verify user is not banned
        const { data: profile } = await admin
            .from('profiles')
            .select('id, banned_at')
            .eq('id', user.id)
            .single()
        if (!profile || profile.banned_at) return { success: false, error: 'Account suspended' }

        // Insert the puzzle
        const { data: puzzle, error: puzzleError } = await admin
            .from('puzzles')
            .insert({
                title: input.title,
                description: input.description ?? null,
                creator_id: user.id,
                status: 'draft',
                difficulty: input.difficulty,
                game_phase: input.game_phase ?? null,
                intro_video_type: input.intro_video_type,
                intro_video_ref: input.intro_video_ref,
                intro_pause_at: input.intro_pause_at ?? null,
                outcome_video_type: input.outcome_video_type ?? null,
                outcome_video_ref: input.outcome_video_ref ?? null,
                question_text: input.question_text,
                explanation: input.explanation ?? null,
            })
            .select('id, slug')
            .single()

        if (puzzleError || !puzzle) {
            return { success: false, error: puzzleError?.message ?? 'Failed to create puzzle' }
        }

        // Insert options
        if (input.options.length > 0) {
            const { error: optionsError } = await admin
                .from('puzzle_options')
                .insert(
                    input.options.map((o, i) => ({
                        puzzle_id: puzzle.id,
                        label: o.label,
                        is_correct: o.is_correct,
                        explanation: o.explanation ?? null,
                        outcome_video_type: o.outcome_video_type ?? null,
                        outcome_video_ref: o.outcome_video_ref ?? null,
                        sort_order: o.sort_order ?? i,
                    }))
                )
            if (optionsError) {
                // Rollback puzzle
                await admin.from('puzzles').delete().eq('id', puzzle.id)
                return { success: false, error: optionsError.message }
            }
        }

        // Insert tags
        const tags = [
            ...input.hero_tags.map((v) => ({ puzzle_id: puzzle.id, tag_type: 'hero' as const, tag_value: v })),
            ...input.mechanic_tags.map((v) => ({ puzzle_id: puzzle.id, tag_type: 'mechanic' as const, tag_value: v })),
        ]
        if (tags.length > 0) {
            const { error: tagsError } = await admin.from('puzzle_tags').insert(tags)
            if (tagsError) {
                // Rollback puzzle
                await admin.from('puzzles').delete().eq('id', puzzle.id)
                return { success: false, error: tagsError.message }
            }
        }

        revalidatePath('/submissions')
        return { success: true, puzzleId: puzzle.id, slug: puzzle.slug ?? undefined }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Unknown error' }
    }
}

// ─────────────────────────────────────────────────────────────
// Update an existing draft/rejected puzzle
// ─────────────────────────────────────────────────────────────

export async function updatePuzzle(
    puzzleId: string,
    input: Partial<PuzzleCreateInput>
): Promise<PuzzleActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const admin = createAdminClient()

        // Update puzzle fields with guarded write (checks ownership and status in one operation)
        const { data: updated, error: updateError } = await admin
            .from('puzzles')
            .update({
                ...(input.title !== undefined && { title: input.title }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
                ...(input.game_phase !== undefined && { game_phase: input.game_phase }),
                ...(input.intro_video_type !== undefined && { intro_video_type: input.intro_video_type }),
                ...(input.intro_video_ref !== undefined && { intro_video_ref: input.intro_video_ref }),
                ...(input.intro_pause_at !== undefined && { intro_pause_at: input.intro_pause_at }),
                ...(input.outcome_video_type !== undefined && { outcome_video_type: input.outcome_video_type }),
                ...(input.outcome_video_ref !== undefined && { outcome_video_ref: input.outcome_video_ref }),
                ...(input.question_text !== undefined && { question_text: input.question_text }),
                ...(input.explanation !== undefined && { explanation: input.explanation }),
            })
            .eq('id', puzzleId)
            .eq('creator_id', user.id)
            .in('status', ['draft', 'rejected'])
            .select('id')

        if (updateError) return { success: false, error: updateError.message }
        if (!updated || updated.length === 0) {
            return { success: false, error: 'Puzzle not found, not owned by you, or cannot be edited in its current state' }
        }

        // Replace options if provided
        if (input.options) {
            // Delete old options first, then insert new ones with error handling
            const { error: deleteError } = await admin.from('puzzle_options').delete().eq('puzzle_id', puzzleId)
            if (deleteError) {
                return { success: false, error: deleteError.message }
            }

            const { error: insertError } = await admin.from('puzzle_options').insert(
                input.options.map((o, i) => ({
                    puzzle_id: puzzleId,
                    label: o.label,
                    is_correct: o.is_correct,
                    explanation: o.explanation ?? null,
                    outcome_video_type: o.outcome_video_type ?? null,
                    outcome_video_ref: o.outcome_video_ref ?? null,
                    sort_order: o.sort_order ?? i,
                }))
            )
            if (insertError) {
                return { success: false, error: insertError.message }
            }
        }

        // Replace tags if provided (only replace the specific tag type that's being updated)
        if (input.hero_tags !== undefined) {
            // Delete only hero tags
            const { error: deleteHeroTagsError } = await admin
                .from('puzzle_tags')
                .delete()
                .eq('puzzle_id', puzzleId)
                .eq('tag_type', 'hero')
            if (deleteHeroTagsError) {
                return { success: false, error: deleteHeroTagsError.message }
            }

            // Insert new hero tags
            if (input.hero_tags.length > 0) {
                const heroTags = input.hero_tags.map((v) => ({ puzzle_id: puzzleId, tag_type: 'hero' as const, tag_value: v }))
                const { error: insertHeroTagsError } = await admin.from('puzzle_tags').insert(heroTags)
                if (insertHeroTagsError) {
                    return { success: false, error: insertHeroTagsError.message }
                }
            }
        }

        if (input.mechanic_tags !== undefined) {
            // Delete only mechanic tags
            const { error: deleteMechanicTagsError } = await admin
                .from('puzzle_tags')
                .delete()
                .eq('puzzle_id', puzzleId)
                .eq('tag_type', 'mechanic')
            if (deleteMechanicTagsError) {
                return { success: false, error: deleteMechanicTagsError.message }
            }

            // Insert new mechanic tags
            if (input.mechanic_tags.length > 0) {
                const mechanicTags = input.mechanic_tags.map((v) => ({ puzzle_id: puzzleId, tag_type: 'mechanic' as const, tag_value: v }))
                const { error: insertMechanicTagsError } = await admin.from('puzzle_tags').insert(mechanicTags)
                if (insertMechanicTagsError) {
                    return { success: false, error: insertMechanicTagsError.message }
                }
            }
        }

        revalidatePath(`/submissions`)
        return { success: true, puzzleId }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Unknown error' }
    }
}

// ─────────────────────────────────────────────────────────────
// Submit a draft puzzle for community voting (or straight to review for Trusted Creators)
// ─────────────────────────────────────────────────────────────

export async function submitPuzzleForReview(
    puzzleId: string
): Promise<PuzzleActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const admin = createAdminClient()

        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Fetch puzzle with options for validation (read-only, not for ownership check)
        const { data: puzzle } = await admin
            .from('puzzles')
            .select('id, options:puzzle_options(id, is_correct)')
            .eq('id', puzzleId)
            .single()

        if (!puzzle) return { success: false, error: 'Puzzle not found' }

        // Validate: must have at least one correct option
        const options = (puzzle as any).options ?? []
        if (options.length < 2) return { success: false, error: 'Puzzle must have at least 2 options' }
        if (!options.some((o: any) => o.is_correct)) {
            return { success: false, error: 'At least one option must be marked correct' }
        }

        // Trusted creators and above go straight to pending_review
        const isTrusted = ['trusted_creator', 'moderator', 'admin'].includes(profile?.role ?? '')
        const newStatus = isTrusted ? 'pending_review' : 'pending_vote'

        // Guarded write: only update if owned by user and in draft/rejected status
        const { data: updated, error: updateError } = await admin
            .from('puzzles')
            .update({ status: newStatus, rejection_reason: null })
            .eq('id', puzzleId)
            .eq('creator_id', user.id)
            .in('status', ['draft', 'rejected'])
            .select('id')

        if (updateError) {
            console.error(`[submitPuzzleForReview] Failed to update puzzle ${puzzleId} to status ${newStatus}:`, updateError)
            return { success: false, error: updateError.message }
        }
        if (!updated || updated.length === 0) {
            return { success: false, error: 'Puzzle not found, not owned by you, or already submitted' }
        }

        revalidatePath('/submissions')
        revalidatePath('/admin/submissions')
        return { success: true, puzzleId }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Unknown error' }
    }
}

// ─────────────────────────────────────────────────────────────
// Delete a draft puzzle (creator only)
// ─────────────────────────────────────────────────────────────

export async function deleteDraftPuzzle(
    puzzleId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const admin = createAdminClient()

        // Guarded delete: only delete if owned by user and in draft status
        const { data: deleted, error: deleteError } = await admin
            .from('puzzles')
            .delete()
            .eq('id', puzzleId)
            .eq('creator_id', user.id)
            .eq('status', 'draft')
            .select('id')

        if (deleteError) {
            console.error(`[deleteDraftPuzzle] Failed to delete puzzle ${puzzleId}:`, deleteError)
            return { success: false, error: deleteError.message }
        }
        if (!deleted || deleted.length === 0) {
            return { success: false, error: 'Puzzle not found, not owned by you, or only drafts can be deleted' }
        }

        revalidatePath('/submissions')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Unknown error' }
    }
}

// ─────────────────────────────────────────────────────────────
// Community vote on a pending_vote puzzle
// ─────────────────────────────────────────────────────────────

export async function togglePuzzleVote(
    puzzleId: string
): Promise<{ success: boolean; voted: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, voted: false, error: 'Not authenticated' }

        // Verify puzzle status
        const { data: puzzle } = await supabase
            .from('puzzles')
            .select('status')
            .eq('id', puzzleId)
            .maybeSingle()

        if (!puzzle || puzzle.status !== 'pending_vote') {
            return { success: false, voted: false, error: 'Puzzle is not available for voting' }
        }

        // Try to insert vote first (optimistic approach)
        const { error: insertError } = await supabase
            .from('puzzle_votes')
            .insert({ puzzle_id: puzzleId, user_id: user.id })

        if (insertError) {
            // Check if it's a unique constraint violation (user already voted)
            if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
                // Already voted, so remove the vote instead
                const { error: deleteError } = await supabase
                    .from('puzzle_votes')
                    .delete()
                    .eq('puzzle_id', puzzleId)
                    .eq('user_id', user.id)
                if (deleteError) {
                    console.error(`[togglePuzzleVote] Failed to delete vote for puzzle ${puzzleId}:`, deleteError)
                    return { success: false, voted: true, error: deleteError.message }
                }
                revalidatePath('/submissions')
                return { success: true, voted: false }
            }
            // Other error
            console.error(`[togglePuzzleVote] Failed to insert vote for puzzle ${puzzleId}:`, insertError)
            return { success: false, voted: false, error: insertError.message }
        }

        // Successfully inserted vote
        revalidatePath('/submissions')
        return { success: true, voted: true }
    } catch (err: any) {
        return { success: false, voted: false, error: err?.message ?? 'Unknown error' }
    }
}