/**
 * Export Service
 * Handles story export preview and data preparation
 */

import type {
	BlockWithExpand,
	ChapterWithExpand,
	CreatorStory,
	Participant,
	RichTextContent,
	SMSContent,
} from '../types/creator-stories'
import { creatorBlockService } from './creatorBlockService'
import { creatorChapterService } from './creatorChapterService'
import { creatorStoryService } from './creatorStoryService'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportPreviewData {
	success: true
	story: {
		id: string
		title: string
		description: string
		slug: string
		isPublished: boolean
		isCompleted: boolean
		nsfw: boolean
		categories: string[]
		coverImage: string | null
		author: string
		created: string
		updated: string
		characters: CreatorStory['characters']
	}
	chapters: Array<{
		id: string
		title: string
		order: number
		isPublished: boolean
		programed: string | null
		blocksCount: number
	}>
	blocks: Array<{
		id: string
		type: string
		title: string | null
		order: number
		chapter: string
		appTarget: string | null
		conversationTitle: string | null
		participantsCount: number
		participants?: Participant[]
		messagesCount?: number
		totalPages: number
	}>
	totalBlocks: number
	totalImages: number
	exportImageUrls: string[]
	timestamp: string
}

export interface ExportError {
	success: false
	error: string
	status: number
}

export type ExportPreviewResult = ExportPreviewData | ExportError

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple message pagination for page count estimation
 * (You should import the actual pagination logic from your utils)
 */
function estimateMessagePages(messages: unknown[]): number {
	const MESSAGES_PER_PAGE = 10
	return Math.max(1, Math.ceil(messages.length / MESSAGES_PER_PAGE))
}

/**
 * Simple text pagination for page count estimation
 */
function estimateTextPages(text: string): number {
	const CHARS_PER_PAGE = 2000
	return Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE))
}

/**
 * Calculate total pages for a block
 */
function calculateBlockPages(block: BlockWithExpand): number {
	switch (block.type) {
		case 'sms_conversation': {
			const content = block.content as SMSContent
			const messages = content?.messages || []
			return estimateMessagePages(messages)
		}
		case 'rich_text_content': {
			const content = block.content as RichTextContent
			const text = content?.plateJson || ''
			const textContent = typeof text === 'string' ? text : JSON.stringify(text)
			return estimateTextPages(textContent)
		}
		case 'media_content':
			return 1
		default:
			return 1
	}
}

/**
 * Extract image URLs from blocks
 */
function extractImageUrls(blocks: BlockWithExpand[]): string[] {
	const urls: string[] = []

	for (const block of blocks) {
		if (block.type === 'media_content' && block.media) {
			if (Array.isArray(block.media)) {
				for (const media of block.media) {
					if (media.type === 'image' && media.url) {
						urls.push(media.url)
					}
				}
			}
		}

		// Check for images in SMS messages
		if (block.type === 'sms_conversation') {
			const content = block.content as SMSContent
			const messages = content?.messages || []
			for (const msg of messages) {
				if (msg.type === 'image' && msg.content) {
					urls.push(msg.content)
				}
			}
		}
	}

	return urls
}

// ============================================================================
// SERVICE
// ============================================================================

export class ExportService {
	/**
	 * Get export preview data for a story
	 */
	async getExportPreview(storyId: string, userId: string): Promise<ExportPreviewResult> {
		try {
			// Get story
			let story: CreatorStory
			try {
				story = await creatorStoryService.getStory(storyId)
			} catch (error) {
				console.log('[ExportService] Story not found:', error)
				return { success: false, error: 'Story not found', status: 404 }
			}

			// Check ownership
			if (story.author !== userId) {
				console.log(`[ExportService] Forbidden - user ${userId} does not own story`)
				return { success: false, error: 'You do not have access to this story', status: 403 }
			}

			// Get chapters with blocks
			let chapters: ChapterWithExpand[]
			try {
				chapters = await creatorChapterService.getStoryChapters(storyId, true)
				console.log(`[ExportService] Fetched ${chapters.length} chapters`)
			} catch (error) {
				console.error('[ExportService] Failed to fetch chapters', error)
				return { success: false, error: 'Failed to fetch chapters', status: 500 }
			}

			// Get all blocks from all chapters
			const allBlocks: BlockWithExpand[] = []

			for (const chapter of chapters) {
				if (chapter.expand?.blocks && chapter.expand.blocks.length > 0) {
					allBlocks.push(...chapter.expand.blocks)
				} else {
					try {
						const chapterBlocks = await creatorBlockService.getChapterBlocks(chapter.id)
						allBlocks.push(...chapterBlocks)
					} catch (error) {
						console.log(`[ExportService] Chapter ${chapter.id}: failed to fetch blocks`, error)
					}
				}
			}

			console.log(`[ExportService] Total blocks: ${allBlocks.length}`)

			if (allBlocks.length === 0) {
				return { success: false, error: 'No blocks found', status: 404 }
			}

			// Extract image URLs
			const exportImageUrls = extractImageUrls(allBlocks)

			// Prepare response data
			const responseData: ExportPreviewData = {
				success: true,
				story: {
					id: story.id,
					title: story.title,
					description: story.description || '',
					slug: story.slug,
					isPublished: story.isPublished,
					isCompleted: story.isCompleted,
					nsfw: story.nsfw,
					categories: story.categories || [],
					coverImage: story.coverImage || null,
					author: story.author,
					created: story.created,
					updated: story.updated,
					characters: story.characters || [],
				},
				chapters: chapters.map(ch => ({
					id: ch.id,
					title: ch.title,
					order: ch.order,
					isPublished: ch.isPublished,
					programed: ch.programed,
					blocksCount: allBlocks.filter(b => b.chapter === ch.id).length,
				})),
				blocks: allBlocks.map(block => {
					const content = block.content as SMSContent | RichTextContent
					const participants = block.participants || []
					const messages = (content as SMSContent)?.messages || []

					return {
						id: block.id,
						type: block.type,
						title: block.title,
						order: block.order,
						chapter: block.chapter,
						appTarget: block.appTarget,
						conversationTitle: block.conversationTitle,
						participantsCount: participants.length,
						participants: block.type === 'sms_conversation' ? participants : undefined,
						messagesCount: block.type === 'sms_conversation' ? messages.length : undefined,
						totalPages: calculateBlockPages(block),
					}
				}),
				totalBlocks: allBlocks.length,
				totalImages: exportImageUrls.length,
				exportImageUrls,
				timestamp: new Date().toISOString(),
			}

			return responseData
		} catch (error) {
			console.error('[ExportService] Export preview error:', error)
			return { success: false, error: 'Failed to generate export preview', status: 500 }
		}
	}
}

// Export singleton instance
export const exportService = new ExportService()
