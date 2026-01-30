/**
 * Export Service
 * Handles story export preview and data preparation
 */

import {
	fetchExportData,
	renderContextBlock,
	renderMediaBlock,
	renderPlaceholderBlock,
	renderSMSBlock,
	validateBlockIndex,
} from '@sms-editor/lib/export'
import { paginateMessages, paginateText } from '@sms-editor/lib/export-pagination'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth.server'
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
export interface ExportPreviewResponse {
	success: boolean
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

// Helper to calculate total pages for a block using shared logic
function calculateBlockPages(block: BlockWithExpand): number {
	switch (block.type) {
		case 'sms_conversation': {
			const content = block.content as SMSContent
			const messages = content?.messages || []
			if (messages.length === 0) return 1

			// Use shared balanced pagination logic
			const pages = paginateMessages(messages)
			return Math.max(1, pages.length)
		}
		case 'rich_text_content': {
			const content = block.content as RichTextContent
			const text =
				content?.plateJson
					?.replace(/<[^>]*>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim() || ''

			// Use shared balanced pagination logic
			const pages = paginateText(text)
			return Math.max(1, pages.length)
		}
		default:
			return 1 // Media and placeholder blocks are single page
	}
}

export class ExportService {
	/**
	 * Get export preview data for a story
	 */
	async getExportPreview(storyId: string, userId: string): Promise<ExportPreviewResponse> {
		const timestamp = new Date().toISOString()
		console.log(`[ExportPreview] Starting preview for story: ${storyId}`)

		// Get story
		const storyService = creatorStoryService
		let story: CreatorStory

		try {
			story = await storyService.getStory(storyId)
			console.log(`[ExportPreview] Story found: ${story.title}`)
		} catch (error) {
			console.log('[ExportPreview] Story not found:', error)
			throw console.error(404, 'Story not found')
		}

		// Check ownership
		if (story.author !== userId) {
			console.log(`[ExportPreview] Forbidden - user ${userId} does not own story`)
			throw console.error(403, 'Forbidden: You do not have access to this story')
		}

		// Get chapters with blocks
		const chapterService = creatorChapterService
		let chapters: ChapterWithExpand[]

		try {
			chapters = await chapterService.getStoryChapters(storyId, true)
			console.log(`[ExportPreview] Fetched ${chapters.length} chapters`)
		} catch (error) {
			console.error('[ExportPreview] Failed to fetch chapters', error)
			throw console.error(500, 'Failed to fetch chapters')
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
					console.log(`[ExportPreview] Chapter ${chapter.id}: failed to fetch blocks`, error)
				}
			}
		}

		console.log(`[ExportPreview] Total blocks: ${allBlocks.length}`)

		// Calculate pages for each block and generate all URLs
		const exportImageUrls: string[] = []
		const blocksWithPages = allBlocks.map((block, blockIndex) => {
			const smsContent = block.type === 'sms_conversation' ? (block.content as SMSContent) : null
			const totalPages = calculateBlockPages(block)

			// Generate URLs for all pages of this block
			for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
				exportImageUrls.push(`/api/export/${storyId}?blockIndex=${blockIndex}&pageIndex=${pageIndex}&t=${Date.now()}`)
			}

			return {
				id: block.id,
				type: block.type,
				title: block.title,
				order: block.order,
				chapter: block.chapter,
				appTarget: block.appTarget,
				conversationTitle: block.conversationTitle || null,
				participantsCount: block.participants?.length || 0,
				messagesCount: smsContent?.messages?.length,
				totalPages,
			}
		})

		// Build response
		const response: ExportPreviewResponse = {
			success: true,
			story: {
				id: story.id,
				title: story.title,
				description: story.description,
				slug: story.slug,
				isPublished: story.isPublished,
				isCompleted: story.isCompleted,
				nsfw: story.nsfw,
				categories: story.categories,
				coverImage: story.coverImage,
				author: story.author,
				created: story.created,
				updated: story.updated,
				characters: story.characters,
			},
			chapters: chapters.map(chapter => ({
				id: chapter.id,
				title: chapter.title,
				order: chapter.order,
				isPublished: chapter.isPublished,
				programed: chapter.programed,
				blocksCount: chapter.expand?.blocks?.length || 0,
			})),
			blocks: blocksWithPages,
			totalBlocks: allBlocks.length,
			totalImages: exportImageUrls.length,
			exportImageUrls,
			timestamp,
		}

		console.log(
			`[ExportPreview] Response ready with ${chapters.length} chapters, ${allBlocks.length} blocks, ${exportImageUrls.length} images`
		)
		return response
	}

	async getExport(request: NextRequest, storyId: string) {
		const { searchParams } = new URL(request.url)
		const blockIndex = parseInt(searchParams.get('blockIndex') || '0', 10)
		const pageIndex = parseInt(searchParams.get('pageIndex') || '0', 10)

		console.log(`[Export] Request: story=${storyId}, block=${blockIndex}, page=${pageIndex}`)

		const session = await auth.api.getSession({
			headers: request.headers,
		})

		if (!session?.user) {
			console.log('[Export] Unauthorized - no session')
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Fetch and validate data
		const dataResult = await fetchExportData(session.user.id, storyId)

		if ('error' in dataResult) {
			return NextResponse.json({ error: dataResult.error }, { status: dataResult.status })
		}

		const { allBlocks, story } = dataResult

		// Validate block index
		const blockResult = validateBlockIndex(allBlocks, blockIndex)

		if ('error' in blockResult) {
			return NextResponse.json({ error: blockResult.error, totalBlocks: allBlocks.length }, { status: 400 })
		}

		const block = blockResult.block
		console.log(`[Export] Rendering: ${block.type} - "${block.title}", page ${pageIndex}`)

		// Render based on block type
		try {
			switch (block.type) {
				case 'sms_conversation':
					return await renderSMSBlock(block, pageIndex, story.characters || [])
				case 'rich_text_content':
					return renderContextBlock(block, pageIndex)
				case 'media_content':
					return await renderMediaBlock(block)
				default:
					return renderPlaceholderBlock(block)
			}
		} catch (error) {
			console.error('[Export] Render error:', error)
			return NextResponse.json(
				{ error: `Failed to generate: ${error instanceof Error ? error.message : 'Unknown error'}` },
				{ status: 500 }
			)
		}
	}
}

// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------

// Export singleton instance
export const exportService = new ExportService()
