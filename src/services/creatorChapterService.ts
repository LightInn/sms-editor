/**
 * Service for managing creator chapters (containers)
 * Handles CRUD operations for the c_chapters collection
 * Chapters are now simple containers that group blocks
 */

import { pb } from '@/lib/pocketbase'
import type { ChapterWithExpand, CreateChapterData, CreatorChapter, UpdateChapterData } from '../types/creator-stories'
import { creatorBlockService } from './creatorBlockService'

export class CreatorChapterService {
	private collectionName = 'c_chapters'

	/**
	 * Create a new chapter (container)
	 */
	async createChapter(data: CreateChapterData): Promise<CreatorChapter> {
		const createData: Record<string, unknown> = {
			story: data.story,
			title: data.title,
			order: data.order,
		}

		// Add programed date if provided
		if (data.programed !== undefined) {
			createData.programed = data.programed || null
		}

		// Add coverImage if provided
		if (data.coverImage !== undefined) {
			createData.coverImage = data.coverImage || null
		}

		const record = await pb.collection(this.collectionName).create<CreatorChapter>(createData)

		return record
	}

	/**
	 * Update an existing chapter
	 */
	async updateChapter(id: string, data: UpdateChapterData): Promise<CreatorChapter> {
		const updateData: Partial<Pick<CreatorChapter, 'title' | 'order' | 'programed' | 'isPublished' | 'coverImage'>> = {}

		if (data.title !== undefined) updateData.title = data.title
		if (data.order !== undefined) updateData.order = data.order
		if (data.programed !== undefined) updateData.programed = data.programed
		if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
		if (data.coverImage !== undefined) updateData.coverImage = data.coverImage

		const record = await pb.collection(this.collectionName).update<CreatorChapter>(id, updateData)

		return record
	}

	/**
	 * Get a chapter by ID
	 */
	async getChapter(id: string, expand = false): Promise<ChapterWithExpand> {
		const expandParam = expand ? 'story,coverImage' : ''

		const record = await pb.collection(this.collectionName).getOne<ChapterWithExpand>(id, {
			expand: expandParam,
		})

		// if expand, get blocks separately (reverse relation) and attach to expand
		if (expand) {
			const blocks = await creatorBlockService.getChapterBlocks(id)
			record.expand = {
				...record.expand,
				blocks,
			}
		}

		return record
	}

	/**
	 * Get all chapters for a story
	 */
	async getStoryChapters(storyId: string, expandBlocks = false): Promise<ChapterWithExpand[]> {
		// Always include coverImage in expand for chapter settings panel
		const expandParts = ['coverImage']
		if (expandBlocks) {
			expandParts.push('blocks')
		}

		const records = await pb.collection(this.collectionName).getFullList<ChapterWithExpand>({
			filter: `story="${storyId}"`,
			sort: 'order',
			expand: expandParts.join(','),
		})

		return records
	}

	/**
	 * Delete a chapter (and potentially cascade delete blocks if configured)
	 */
	async deleteChapter(id: string): Promise<boolean> {
		await pb.collection(this.collectionName).delete(id)
		return true
	}

	/**
	 * Reorder chapters
	 */
	async reorderChapters(chapterIds: string[]): Promise<CreatorChapter[]> {
		const updates = chapterIds.map((id, index) => this.updateChapter(id, { order: index }))

		const results = await Promise.all(updates)
		return results
	}

	// ============================================================================
	// HELPER METHODS
	// ============================================================================

	/**
	 * Get the next order number for a new chapter in a story
	 */
	async getNextOrder(storyId: string): Promise<number> {
		const chapters = await this.getStoryChapters(storyId)

		if (chapters.length === 0) return 0

		const maxOrder = Math.max(...chapters.map(ch => ch.order))
		return maxOrder + 1
	}

	/**
	 * Duplicate a chapter (container only, not blocks)
	 */
	async duplicateChapter(chapterId: string): Promise<CreatorChapter> {
		const original = await this.getChapter(chapterId)
		const nextOrder = await this.getNextOrder(original.story)

		const duplicateData: CreateChapterData = {
			story: original.story,
			title: original.title ? `${original.title} (copy)` : 'Untitled Chapter',
			order: nextOrder,
			programed: original.programed, // Copy programed date
			isPublished: false, // Duplicated chapters start as drafts
		}

		return this.createChapter(duplicateData)
	}

	/**
	 * Get chapter count for a story
	 */
	async getChapterCount(storyId: string): Promise<number> {
		const result = await pb.collection(this.collectionName).getList(1, 1, {
			filter: `story="${storyId}"`,
		})

		return result.totalItems
	}

	/**
	 * Move chapter to a different position
	 */
	async moveChapter(chapterId: string, newOrder: number): Promise<CreatorChapter[]> {
		const chapter = await this.getChapter(chapterId)
		const allChapters = await this.getStoryChapters(chapter.story)

		// Remove the chapter from its current position
		const otherChapters = allChapters.filter(ch => ch.id !== chapterId)

		// Insert it at the new position
		otherChapters.splice(newOrder, 0, chapter as CreatorChapter)

		// Update all chapters with new order
		const chapterIds = otherChapters.map(ch => ch.id)
		return this.reorderChapters(chapterIds)
	}

	/**
	 * Validate chapter data before save
	 */
	validateChapter(data: CreateChapterData | UpdateChapterData): {
		valid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		if ('title' in data && !data.title?.trim()) {
			errors.push('Chapter title is required')
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	// ============================================================================
	// PUBLICATION HELPERS
	// ============================================================================

	/**
	 * Check if a chapter is visible to readers
	 * A chapter is visible if:
	 * 1. isPublished is true AND
	 * 2. programed date is null (immediate) or in the past
	 */
	isChapterVisibleToReaders(chapter: CreatorChapter): boolean {
		// Must be marked as published
		if (!chapter.isPublished) return false

		// If no programed date, chapter is immediately visible
		if (!chapter.programed) return true

		// Check if programed date is in the past
		const programedDate = new Date(chapter.programed)
		const now = new Date()

		return programedDate <= now
	}

	/**
	 * Get the publication status of a chapter for display
	 */
	getChapterPublicationStatus(chapter: CreatorChapter): 'draft' | 'published' | 'scheduled' {
		// If not marked as published, it's a draft
		if (!chapter.isPublished) return 'draft'

		// If published but has a future programed date, it's scheduled
		if (chapter.programed) {
			const programedDate = new Date(chapter.programed)
			const now = new Date()
			if (programedDate > now) return 'scheduled'
		}

		// Otherwise, it's published and visible
		return 'published'
	}

	/**
	 * Filter chapters to only include those visible to readers
	 */
	getVisibleChapters(chapters: CreatorChapter[]): CreatorChapter[] {
		return chapters.filter(chapter => this.isChapterVisibleToReaders(chapter))
	}

	/**
	 * Get visible chapters for a story (public view)
	 */
	async getVisibleStoryChapters(storyId: string, expandBlocks = false): Promise<ChapterWithExpand[]> {
		const allChapters = await this.getStoryChapters(storyId, expandBlocks)
		return this.getVisibleChapters(allChapters) as ChapterWithExpand[]
	}

	/**
	 * Publish/unpublish a chapter
	 */
	async publishChapter(id: string, publish: boolean): Promise<CreatorChapter> {
		return this.updateChapter(id, { isPublished: publish })
	}

	/**
	 * Publish all chapters for a story at once
	 */
	async publishAllChapters(storyId: string): Promise<CreatorChapter[]> {
		const chapters = await this.getStoryChapters(storyId)
		const updates = chapters.map(ch => this.updateChapter(ch.id, { isPublished: true }))
		return Promise.all(updates)
	}

	/**
	 * Unpublish all chapters for a story at once
	 */
	async unpublishAllChapters(storyId: string): Promise<CreatorChapter[]> {
		const chapters = await this.getStoryChapters(storyId)
		const updates = chapters.map(ch => this.updateChapter(ch.id, { isPublished: false }))
		return Promise.all(updates)
	}

	// ============================================================================
	// LEGACY METHODS (kept for backward compatibility)
	// ============================================================================

	/**
	 * @deprecated Use isChapterVisibleToReaders instead
	 * Check if a chapter is published (programed date is null or in the past)
	 */
	isChapterPublished(chapter: CreatorChapter): boolean {
		return this.isChapterVisibleToReaders(chapter)
	}

	/**
	 * @deprecated Use getVisibleChapters instead
	 * Filter chapters to only include published ones
	 */
	getPublishedChapters(chapters: CreatorChapter[]): CreatorChapter[] {
		return this.getVisibleChapters(chapters)
	}

	/**
	 * @deprecated Use getVisibleStoryChapters instead
	 * Get published chapters for a story (public view)
	 */
	async getPublishedStoryChapters(storyId: string, expandBlocks = false): Promise<ChapterWithExpand[]> {
		return this.getVisibleStoryChapters(storyId, expandBlocks)
	}
}

// Export a singleton instance
export const creatorChapterService = new CreatorChapterService()
