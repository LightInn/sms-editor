/**
 * Export Data Fetcher
 * Handles authentication, data validation, and fetching for export route
 */

import { creatorBlockService, creatorChapterService, creatorStoryService } from '@sms-editor/services'
import type { BlockWithExpand, ChapterWithExpand, CreatorStory } from '@sms-editor/types/creator-stories'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportDataResult {
	success: true
	story: CreatorStory
	allBlocks: BlockWithExpand[]
}

export interface ExportDataError {
	success: false
	error: string
	status: 401 | 403 | 404 | 500
}

export type FetchExportDataResult = ExportDataResult | ExportDataError

// ============================================================================
// MAIN FETCHER
// ============================================================================

/**
 * Fetches and validates all data needed for export
 * Handles authentication, authorization, and data loading
 */
export async function fetchExportData(userId: string, storyId: string): Promise<FetchExportDataResult> {
	console.log(`[Export] Fetching data for story: ${storyId}`)
	// Authenticate user
	if (!userId) {
		console.log('[Export] Unauthorized - no user ID')
		return { success: false, error: 'Unauthorized', status: 401 }
	}

	// Get story
	const storyService = creatorStoryService
	let story: CreatorStory

	try {
		story = await storyService.getStory(storyId)
		console.log(`[Export] Story found: ${story.title}`)
	} catch (error) {
		console.log('[Export] Story not found:', error)
		return { success: false, error: 'Story not found', status: 404 }
	}

	// Check ownership
	if (story.author !== userId) {
		console.log(`[Export] Forbidden - user ${userId} does not own story`)
		return { success: false, error: 'You do not have access to this story', status: 403 }
	}

	// Get chapters with blocks
	const chapterService = creatorChapterService
	let chapters: ChapterWithExpand[]

	try {
		chapters = await chapterService.getStoryChapters(storyId, true)
		console.log(`[Export] Fetched ${chapters.length} chapters`)
	} catch (error) {
		console.error('[Export] Failed to fetch chapters', error)
		return { success: false, error: 'Failed to fetch chapters', status: 500 }
	}

	// Get all blocks from all chapters
	const allBlocks: BlockWithExpand[] = []
	const blockService = creatorBlockService

	for (const chapter of chapters) {
		if (chapter.expand?.blocks && chapter.expand.blocks.length > 0) {
			allBlocks.push(...chapter.expand.blocks)
		} else {
			try {
				const chapterBlocks = await blockService.getChapterBlocks(chapter.id)
				allBlocks.push(...chapterBlocks)
			} catch (error) {
				console.log(`[Export] Chapter ${chapter.id}: failed to fetch blocks`, error)
			}
		}
	}

	console.log(`[Export] Total blocks: ${allBlocks.length}`)

	if (allBlocks.length === 0) {
		return { success: false, error: 'No blocks found', status: 404 }
	}

	return { success: true, story, allBlocks }
}

/**
 * Validates block index and returns the block
 */
export function validateBlockIndex(
	allBlocks: BlockWithExpand[],
	blockIndex: number
): { valid: true; block: BlockWithExpand } | { valid: false; error: string } {
	if (blockIndex < 0 || blockIndex >= allBlocks.length) {
		return {
			valid: false,
			error: `Invalid block index. Must be 0-${allBlocks.length - 1}`,
		}
	}
	return { valid: true, block: allBlocks[blockIndex] }
}
