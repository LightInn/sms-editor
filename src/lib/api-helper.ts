/**
 * API Helper for Story Editor (Package version)
 * Provides a compatibility layer that uses services directly
 */

import { creatorBlockService } from '../services/creatorBlockService'
import { creatorChapterService } from '../services/creatorChapterService'
import type { CreateBlockData, CreateChapterData, UpdateBlockData } from '../types/creator-stories'

/**
 * Generic request wrapper that mimics the fetch API but uses services directly
 */
export async function request<T>(url: string, options?: RequestInit): Promise<T> {
	const method = options?.method || 'GET'
	const body = options?.body ? JSON.parse(options.body as string) : null

	// Parse URL to extract parameters
	const urlParts = url.split('/')

	// GET /api/creator-stories/chapters/${chapterId}/blocks
	if (method === 'GET' && url.includes('/chapters/') && url.endsWith('/blocks')) {
		const chapterId = urlParts[urlParts.indexOf('chapters') + 1]
		return (await creatorBlockService.getChapterBlocks(chapterId)) as T
	}

	// POST /api/creator-stories/chapters/${chapterId}/blocks
	if (method === 'POST' && url.includes('/chapters/') && url.endsWith('/blocks')) {
		return (await creatorBlockService.createBlock(body as CreateBlockData)) as T
	}

	// POST /api/creator-stories/${storyId}/chapters
	if (method === 'POST' && url.match(/\/api\/creator-stories\/[\w]+\/chapters$/)) {
		return (await creatorChapterService.createChapter(body as CreateChapterData)) as T
	}

	// DELETE /api/creator-stories/chapters/${chapterId}
	if (method === 'DELETE' && url.includes('/chapters/') && !url.includes('/blocks')) {
		const chapterId = urlParts[urlParts.indexOf('chapters') + 1]
		await creatorChapterService.deleteChapter(chapterId)
		return { success: true } as T
	}

	// POST /api/creator-stories/${storyId}/chapters/reorder
	if (method === 'POST' && url.includes('/chapters/reorder')) {
		await creatorChapterService.reorderChapters(body.chapterIds)
		return body.chapterIds as T
	}

	// GET /api/creator-stories/${storyId}/chapters?expand=true
	if (method === 'GET' && url.includes('/chapters') && url.includes('expand=true')) {
		const storyId = urlParts[urlParts.indexOf('creator-stories') + 1]
		return (await creatorChapterService.getStoryChapters(storyId, true)) as T
	}

	// POST /api/creator-stories/chapters/${chapterId}/blocks/reorder
	if (method === 'POST' && url.includes('/blocks/reorder')) {
		await creatorBlockService.reorderBlocks(body.blockIds)
		return { success: true } as T
	}

	// PUT/PATCH /api/creator-stories/blocks/${blockId}
	if ((method === 'PUT' || method === 'PATCH') && url.includes('/blocks/')) {
		const blockId = urlParts[urlParts.indexOf('blocks') + 1]
		return (await creatorBlockService.updateBlock(blockId, body as UpdateBlockData)) as T
	}

	// DELETE /api/creator-stories/blocks/${blockId}
	if (method === 'DELETE' && url.includes('/blocks/')) {
		const blockId = urlParts[urlParts.indexOf('blocks') + 1]
		await creatorBlockService.deleteBlock(blockId)
		return { success: true } as T
	}

	throw new Error(`Unhandled request: ${method} ${url}`)
}
