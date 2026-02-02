'use server'

/**
 * Public Chapter Actions
 * Server actions for fetching public chapter data (accessible to readers)
 */

import { creatorBlockService } from 'sms-editor/services'
import type { BlockWithExpand } from 'sms-editor/types'
import '@/lib/pocketbase'

/**
 * Get blocks for a public chapter
 * No authentication required - used by readers
 */
export async function getPublicChapterBlocks(chapterId: string): Promise<BlockWithExpand[]> {
	try {
		const blocks = await creatorBlockService.getChapterBlocks(chapterId)
		return blocks
	} catch (error) {
		console.error('Failed to fetch chapter blocks:', error)
		return []
	}
}
