'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PuzzleCreateInput } from '@/lib/supabase/types'

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

        // Verify ownership and editable status
        const { data: existing } = await admin
            .from('puzzles')
            .select('id, creator_id, status')
            .eq('id', puzzleId)
            .single()

        if (!existing) return { success: false, error: 'Puzzle not found' }
        if (existing.creator_id !== user.id) return { success: false, error: 'Not your puzzle' }
        if (!['draft', 'rejected'].includes(existing.status)) {
            return { success: false, error: 'Puzzle cannot be edited in its current state' }
        }

        // Update puzzle fields
        const { error: updateError } = await admin
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

        if (updateError) return { success: false, error: updateError.message }

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

        // Replace tags if provided
        if (input.hero_tags !== undefined || input.mechanic_tags !== undefined) {
            await admin.from('puzzle_tags').delete().eq('puzzle_id', puzzleId)
            const tags = [
                ...(input.hero_tags ?? []).map((v) => ({ puzzle_id: puzzleId, tag_type: 'hero' as const, tag_value: v })),
                ...(input.mechanic_tags ?? []).map((v) => ({ puzzle_id: puzzleId, tag_type: 'mechanic' as const, tag_value: v })),
            ]
            if (tags.length > 0) await admin.from('puzzle_tags').insert(tags)
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

        const { data: puzzle } = await admin
            .from('puzzles')
            .select('id, creator_id, status, title, options:puzzle_options(id, is_correct)')
            .eq('id', puzzleId)
            .single()

        if (!puzzle) return { success: false, error: 'Puzzle not found' }
        if ((puzzle as any).creator_id !== user.id) return { success: false, error: 'Not your puzzle' }
        if (!['draft', 'rejected'].includes((puzzle as any).status)) {
            return { success: false, error: 'Puzzle is already submitted' }
        }

        // Validate: must have at least one correct option
        const options = (puzzle as any).options ?? []
        if (options.length < 2) return { success: false, error: 'Puzzle must have at least 2 options' }
        if (!options.some((o: any) => o.is_correct)) {
            return { success: false, error: 'At least one option must be marked correct' }
        }

        // Trusted creators and above go straight to pending_review
        const isTrusted = ['trusted_creator', 'moderator', 'admin'].includes(profile?.role ?? '')
        const newStatus = isTrusted ? 'pending_review' : 'pending_vote'

        await admin
            .from('puzzles')
            .update({ status: newStatus, rejection_reason: null })
            .eq('id', puzzleId)

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
        const { data: puzzle } = await admin
            .from('puzzles')
            .select('creator_id, status')
            .eq('id', puzzleId)
            .single()

        if (!puzzle) return { success: false, error: 'Not found' }
        if (puzzle.creator_id !== user.id) return { success: false, error: 'Not your puzzle' }
        if (puzzle.status !== 'draft') return { success: false, error: 'Only drafts can be deleted' }

        await admin.from('puzzles').delete().eq('id', puzzleId)
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

        // Check existing vote
        const { data: existing } = await supabase
            .from('puzzle_votes')
            .select('puzzle_id')
            .eq('puzzle_id', puzzleId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (existing) {
            await supabase.from('puzzle_votes').delete()
                .eq('puzzle_id', puzzleId).eq('user_id', user.id)
            revalidatePath('/submissions')
            return { success: true, voted: false }
        } else {
            await supabase.from('puzzle_votes').insert({ puzzle_id: puzzleId, user_id: user.id })
            revalidatePath('/submissions')
            return { success: true, voted: true }
        }
    } catch (err: any) {
        return { success: false, voted: false, error: err?.message ?? 'Unknown error' }
    }
}