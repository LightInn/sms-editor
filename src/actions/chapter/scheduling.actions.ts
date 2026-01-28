/**
 * Chapter Scheduling Actions
 * Actions for managing chapter publication schedules
 */

'use server'

import { pb } from 'sms-editor/lib/pocketbase'
import type { CreatorChapter } from '../../types/creator-stories'
import {
	getAuthenticatedPB,
	handleActionError,
	isValidDateOrEmpty,
	unauthorizedResult,
	verifyChapterOwnership,
	verifyMultipleChaptersOwnership,
} from '../utils/action-utils'

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleUpdateResult {
	success: boolean
	error?: string
	chapter?: CreatorChapter
}

interface BatchScheduleUpdateResult {
	success: boolean
	error?: string
	updatedCount?: number
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Update a chapter's programed date
 */
export async function updateChapterProgrammedAction(
	chapterId: string,
	programed: string | null
): Promise<ScheduleUpdateResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) return unauthorizedResult()

		// Verify ownership
		const ownership = await verifyChapterOwnership(authPB, chapterId)
		if ('error' in ownership) {
			return { success: false, error: ownership.error }
		}

		// Validate date
		if (!isValidDateOrEmpty(programed)) {
			return { success: false, error: 'Invalid date format.' }
		}

		// Update chapter
		const updatedChapter = await pb
			.collection('c_chapters')
			.update<CreatorChapter>(chapterId, { programed: programed || null }, { requestKey: null })

		return { success: true, chapter: updatedChapter }
	} catch (error) {
		return handleActionError(error, 'Failed to update chapter.')
	}
}

/**
 * Batch update multiple chapters' programed dates and/or isPublished status
 */
export async function batchUpdateChaptersProgrammedAction(
	updates: Array<{ chapterId: string; programed: string | null; isPublished?: boolean }>
): Promise<BatchScheduleUpdateResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) return unauthorizedResult()

		// Verify ownership of all chapters
		const chapterIds = updates.map(u => u.chapterId)
		const ownership = await verifyMultipleChaptersOwnership(authPB, chapterIds)
		if ('error' in ownership) {
			return { success: false, error: ownership.error }
		}

		// Update all chapters
		const updatePromises = updates.map(update => {
			const updateData: { programed: string | null; isPublished?: boolean } = {
				programed: update.programed || null,
			}

			if (update.isPublished !== undefined) {
				updateData.isPublished = update.isPublished
			}

			return pb.collection('c_chapters').update<CreatorChapter>(update.chapterId, updateData, {
				requestKey: null,
			})
		})

		await Promise.all(updatePromises)

		return { success: true, updatedCount: updates.length }
	} catch (error) {
		return handleActionError(error, 'Failed to batch update chapters.')
	}
}
