/**
 * Chapter Settings Actions
 * Actions for managing chapter settings (title, cover, publication status)
 */

'use server'

import { pb } from '@/lib/pocketbase'
import type { ChapterWithExpand, CreatorChapter } from '../../types/creator-stories'
import {
	getAuthenticatedPB,
	handleActionError,
	isValidDateOrEmpty,
	unauthorizedResult,
	verifyChapterOwnership,
} from '../utils/action-utils'

// ============================================================================
// TYPES
// ============================================================================

interface ChapterSettingsData {
	title?: string
	programed?: string | null
	isPublished?: boolean
	coverImage?: string | null
}

interface SettingsUpdateResult {
	success: boolean
	error?: string
	chapter?: ChapterWithExpand
}

interface PublishedUpdateResult {
	success: boolean
	error?: string
	chapter?: CreatorChapter
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Update chapter settings (title, programed, isPublished, coverImage)
 */
export async function updateChapterSettingsAction(
	chapterId: string,
	data: ChapterSettingsData
): Promise<SettingsUpdateResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) return unauthorizedResult()

		// Verify ownership
		const ownership = await verifyChapterOwnership(authPB, chapterId)
		if ('error' in ownership) {
			return { success: false, error: ownership.error }
		}

		// Validate title
		if (data.title !== undefined && !data.title.trim()) {
			return { success: false, error: 'Chapter title cannot be empty.' }
		}

		// Validate date
		if (!isValidDateOrEmpty(data.programed)) {
			return { success: false, error: 'Invalid date format.' }
		}

		// Build update data
		const updateData: Record<string, unknown> = {}
		if (data.title !== undefined) updateData.title = data.title.trim()
		if (data.programed !== undefined) updateData.programed = data.programed || null
		if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
		if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null

		// Update chapter
		await pb.collection('c_chapters').update(chapterId, updateData, {
			requestKey: null,
		})

		// Fetch updated chapter with expand
		const updatedChapter = await pb.collection('c_chapters').getOne<ChapterWithExpand>(chapterId, {
			expand: 'coverImage',
			requestKey: null,
		})

		return { success: true, chapter: updatedChapter }
	} catch (error) {
		return handleActionError(error, 'Failed to update chapter settings.')
	}
}

/**
 * Update a single chapter's isPublished status
 */
export async function updateChapterPublishedAction(
	chapterId: string,
	isPublished: boolean
): Promise<PublishedUpdateResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) return unauthorizedResult()

		// Verify ownership
		const ownership = await verifyChapterOwnership(authPB, chapterId)
		if ('error' in ownership) {
			return { success: false, error: ownership.error }
		}

		// Update chapter
		const updatedChapter = await pb
			.collection('c_chapters')
			.update<CreatorChapter>(chapterId, { isPublished }, { requestKey: null })

		return { success: true, chapter: updatedChapter }
	} catch (error) {
		return handleActionError(error, 'Failed to update chapter.')
	}
}
