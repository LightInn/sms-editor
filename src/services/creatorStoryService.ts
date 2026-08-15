/**
 * Service for managing creator stories (user-generated stories)
 * Handles CRUD operations for the c_stories collection
 * NOTE: This service should only be used on the server side
 */

import { pbFileUrl } from '@/lib/cover-url'
import { pb } from '@/lib/pocketbase'
import type {
	Character,
	CreateStoryData,
	CreatorChapter,
	CreatorStory,
	StoryWithExpand,
	UpdateStoryData,
} from '../types/creator-stories'

export class CreatorStoryService {
	private collectionName = 'c_stories'

	/**
	 * Create a new story
	 */
	async createStory(data: CreateStoryData): Promise<CreatorStory> {
		const authModel = pb.authStore.model

		if (!authModel?.id) {
			throw new Error('User must be authenticated to create a story')
		}

		const formData = new FormData()
		formData.append('title', data.title)
		formData.append('slug', data.slug)
		formData.append('author', authModel.id)
		formData.append('isPublished', 'false')
		formData.append('isCompleted', 'false')
		formData.append('nsfw', (data.nsfw ?? process.env.NEXT_PUBLIC_IS_NSFW === 'true').toString()) // Default to NEXT_PUBLIC_IS_NSFW env
		formData.append('likes', '0')
		formData.append('views', '0')

		if (data.description) {
			formData.append('description', data.description)
		}

		if (data.categories && data.categories.length > 0) {
			formData.append('categories', JSON.stringify(data.categories))
		} else {
			formData.append('categories', JSON.stringify([]))
		}

		if (data.characters && data.characters.length > 0) {
			formData.append('characters', JSON.stringify(data.characters))
		} else {
			formData.append('characters', JSON.stringify([]))
		}

		if (data.coverImage) {
			// coverImage is now a record ID from images collection (relation)
			// NOT a file upload
			formData.append('coverImage', data.coverImage)
		}

		const record = await pb.collection(this.collectionName).create<CreatorStory>(formData)

		return record
	}

	/**
	 * Update an existing story
	 */
	async updateStory(id: string, data: UpdateStoryData): Promise<CreatorStory> {
		const formData = new FormData()

		if (data.title !== undefined) {
			formData.append('title', data.title)
		}

		if (data.description !== undefined) {
			formData.append('description', data.description)
		}

		if (data.slug !== undefined) {
			formData.append('slug', data.slug)
		}

		if (data.categories !== undefined) {
			formData.append('categories', JSON.stringify(data.categories))
		}

		if (data.characters !== undefined) {
			formData.append('characters', JSON.stringify(data.characters))
		}

		if (data.isPublished !== undefined) {
			formData.append('isPublished', data.isPublished.toString())
		}

		if (data.isCompleted !== undefined) {
			formData.append('isCompleted', data.isCompleted.toString())
		}

		if (data.nsfw !== undefined) {
			formData.append('nsfw', data.nsfw.toString())
		}

		if (data.coverImage !== undefined) {
			// coverImage is now a record ID from images collection (relation)
			// NOT a file upload
			formData.append('coverImage', data.coverImage || '')
		}

		const record = await pb.collection(this.collectionName).update<CreatorStory>(id, formData)

		return record
	}

	/**
	 * Get a story by ID
	 */
	async getStory(id: string, expand = false): Promise<StoryWithExpand> {
		const expandParam = expand ? 'author,coverImage' : ''

		const record = await pb.collection(this.collectionName).getOne<StoryWithExpand>(id, {
			expand: expandParam,
		})

		return record
	}

	/**
	 * Get a story by slug
	 */
	async getStoryBySlug(slug: string, expand = false): Promise<StoryWithExpand | null> {
		try {
			const expandParam = expand ? 'author,coverImage' : ''

			const record = await pb
				.collection(this.collectionName)
				.getFirstListItem<StoryWithExpand>(`slug="${slug}" && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`, {
					expand: expandParam,
				})

			if (expand) {
				// fetch chapters separately since relation is inverse and add to expand
				const chapterRecords = await pb.collection('c_chapters').getFullList({
					filter: `story="${record.id}"`,
					sort: 'order',
				})

				// Convert RecordModel[] to CreatorChapter[]
				const chapters: CreatorChapter[] = chapterRecords.map(chapter => ({
					id: chapter.id,
					story: chapter.story,
					title: chapter.title,
					order: chapter.order,
					programed: chapter.programed,
					isPublished: chapter.isPublished ?? false,
					coverImage: chapter.coverImage ?? null,
					created: chapter.created,
					updated: chapter.updated,
				}))

				record.expand = {
					...record.expand,
					chapters,
				}
			}

			return record
		} catch (_error) {
			// Story not found
			return null
		}
	}

	/**
	 * Get all stories for the current user
	 */
	async getUserStories(userId?: string, page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const authModel = pb.authStore.model
		const targetUserId = userId || authModel?.id

		if (!targetUserId) {
			throw new Error('User ID required')
		}

		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `author="${targetUserId}" && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
			sort: '-created',
			expand: 'author,coverImage',
		})

		// One query for every story's chapters, not one per story (M5-T5). The
		// relation is inverse (chapter -> story), so this cannot be an `expand`;
		// what it can be is a single `id = "a" || id = "b"` filter, which is the
		// difference between 1 round trip and `perPage` of them on a page a
		// creator opens constantly.
		const chaptersByStory = await this.getChaptersByStory(records.items.map(story => story.id))

		return records.items.map(story => ({
			...story,
			expand: {
				...story.expand,
				chapters: chaptersByStory.get(story.id) ?? [],
			},
		}))
	}

	/**
	 * Chapters for several stories at once, grouped by story id.
	 *
	 * Returns an empty map for an empty input rather than issuing a query with an
	 * empty filter — PocketBase would read the whole collection, which is the
	 * opposite of the point.
	 */
	private async getChaptersByStory(storyIds: string[]): Promise<Map<string, CreatorChapter[]>> {
		const grouped = new Map<string, CreatorChapter[]>()

		if (storyIds.length === 0) {
			return grouped
		}

		const filter = storyIds.map(id => pb.filter('story = {:story}', { story: id })).join(' || ')
		const chapterRecords = await pb.collection('c_chapters').getFullList({ filter, sort: 'order' })

		for (const chapter of chapterRecords) {
			const chapters = grouped.get(chapter.story) ?? []

			chapters.push({
				id: chapter.id,
				story: chapter.story,
				title: chapter.title,
				order: chapter.order,
				programed: chapter.programed,
				isPublished: chapter.isPublished ?? false,
				coverImage: chapter.coverImage ?? null,
				created: chapter.created,
				updated: chapter.updated,
			})

			grouped.set(chapter.story, chapters)
		}

		return grouped
	}

	/**
	 * Get all published stories (public)
	 */
	async getPublishedStories(page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `isPublished=true  && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
			sort: '-created',
			expand: 'author,coverImage',
		})

		return records.items
	}

	/**
	 * Get the most recent published stories (limited set for showcases)
	 * Sorted by the most recent chapter date, not story creation date
	 */
	async getLatestOriginalStories(limit = 5, _nsfw = false): Promise<StoryWithExpand[]> {
		const safeLimit = Math.max(1, Math.min(limit, 50)) // Allow fetching more for proper sorting

		// Fetch more stories than needed to ensure we can sort by latest chapter
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(1, safeLimit * 2, {
			filter: `isPublished=true  && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
			sort: '-created', // Temporary sort, will be overridden by chapter-based sorting
			expand: 'author,coverImage',
		})

		// One query for every story's chapters instead of one per story (M5-T5).
		// This runs on the home page, so the old shape meant `limit * 2` sequential
		// round trips on the site's busiest route.
		let latestByStory = new Map<string, string>()

		try {
			latestByStory = await this.getLatestChapterDates(records.items.map(story => story.id))
		} catch (error) {
			// A failed chapter read used to drop the story silently, one at a time.
			// Failing the whole batch the same way keeps the old behaviour — an
			// empty showcase — rather than presenting an arbitrary subset as "latest".
			console.warn('Failed to fetch latest chapter dates:', error)
		}

		// Stories with no chapter are dropped: an empty story in a showcase is a
		// dead link.
		const validStories = records.items.flatMap(story => {
			const latestDate = latestByStory.get(story.id)

			return latestDate ? [{ latestDate, story }] : []
		})

		// Sort by latest chapter date (most recent first)
		validStories.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())

		// Return only the requested number of stories
		return validStories.slice(0, safeLimit).map(item => item.story)
	}

	/**
	 * The most recent chapter `updated` date per story, for stories that have one.
	 *
	 * A story missing from the returned map has no chapters at all — which is the
	 * signal the caller uses to drop it, so absence has to mean exactly that.
	 */
	private async getLatestChapterDates(storyIds: string[]): Promise<Map<string, string>> {
		const latest = new Map<string, string>()

		if (storyIds.length === 0) {
			return latest
		}

		const filter = storyIds.map(id => pb.filter('story = {:story}', { story: id })).join(' || ')
		const chapterRecords = await pb.collection('c_chapters').getFullList({
			fields: 'story,updated',
			filter,
			sort: '-updated',
		})

		// Sorted newest first, so the first sighting of a story is its latest chapter.
		for (const chapter of chapterRecords) {
			if (!latest.has(chapter.story)) {
				latest.set(chapter.story, chapter.updated)
			}
		}

		return latest
	}

	/**
	 * Delete a story
	 */
	async deleteStory(id: string): Promise<boolean> {
		await pb.collection(this.collectionName).delete(id)
		return true
	}

	/**
	 * Publish/unpublish a story
	 */
	async publishStory(id: string, publish: boolean): Promise<CreatorStory> {
		return this.updateStory(id, { isPublished: publish })
	}

	/**
	 * Mark story as completed/incomplete
	 */
	async toggleComplete(id: string, completed: boolean): Promise<CreatorStory> {
		return this.updateStory(id, { isCompleted: completed })
	}

	/**
	 * Add a character to a story
	 */
	async addCharacter(storyId: string, character: Character): Promise<CreatorStory> {
		const story = await this.getStory(storyId)
		const characters = [...(story.characters || []), character]
		return this.updateStory(storyId, { characters })
	}

	/**
	 * Update a character in a story
	 */
	async updateCharacter(storyId: string, characterId: string, data: Partial<Character>): Promise<CreatorStory> {
		const story = await this.getStory(storyId)
		const characters = story.characters.map(char => (char.id === characterId ? { ...char, ...data } : char))
		return this.updateStory(storyId, { characters })
	}

	/**
	 * Remove a character from a story
	 */
	async removeCharacter(storyId: string, characterId: string): Promise<CreatorStory> {
		const story = await this.getStory(storyId)
		const characters = story.characters.filter(char => char.id !== characterId)
		return this.updateStory(storyId, { characters })
	}

	/**
	 * Check if a slug is available
	 */
	async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
		try {
			const filter = excludeId
				? `slug="${slug}" && id!="${excludeId}" && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`
				: `slug="${slug}" && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`

			const result = await pb.collection(this.collectionName).getList(1, 1, {
				filter,
			})

			return result.items.length === 0
		} catch (_error) {
			return true
		}
	}

	/**
	 * Generate a unique slug from a title
	 */
	async generateUniqueSlug(title: string): Promise<string> {
		const baseSlug = title
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')

		let slug = baseSlug
		let counter = 1

		// Keep trying until we find an available slug
		while (!(await this.isSlugAvailable(slug))) {
			slug = `${baseSlug}-${counter}`
			counter++
		}

		return slug
	}

	/**
	 * Get story count for a user
	 */
	async getStoryCount(userId?: string): Promise<number> {
		const authModel = pb.authStore.model
		const targetUserId = userId || authModel?.id

		if (!targetUserId) {
			return 0
		}

		const result = await pb.collection(this.collectionName).getList(1, 1, {
			filter: `author="${targetUserId}" && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
		})

		return result.totalItems
	}

	/**
	 * Search stories by title
	 */
	async searchStories(query: string, page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `title~"${query}" && isPublished=true && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
			sort: '-created',
			expand: 'author,coverImage',
		})

		return records.items
	}

	/**
	 * Get stories by category
	 */
	async getStoriesByCategory(category: string, page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `categories~"${category}" && isPublished=true && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
			sort: '-created',
			expand: 'author,coverImage',
		})

		return records.items
	}

	/**
	 * Get file URL for cover image
	 */
	getFileUrl(story: CreatorStory, filename: string): string {
		const pbRecord = {
			id: story.id,
			collectionId: this.collectionName,
			collectionName: this.collectionName,
		}
		return pbFileUrl(pbRecord, filename)
	}

	/**
	 * Get cover image URL
	 * coverImage is now a record ID from the images collection (relation)
	 * This method constructs the URL from the image record ID
	 */
	getCoverImageUrl(story: CreatorStory | StoryWithExpand): string | null {
		if (!story.coverImage) return null

		// Try to get URL from expand data first (most reliable)
		const storyWithExpand = story as StoryWithExpand
		if (storyWithExpand.expand?.coverImage) {
			const imageRecord = storyWithExpand.expand.coverImage as {
				id: string
				image: string
				alt: string
			}
			// Construct URL from image record
			return pbFileUrl({ id: imageRecord.id, collectionName: 'images' }, imageRecord.image)
		}

		// Fallback: If we only have the record ID without expand
		// We can't reliably construct the URL without the filename
		// Return null and let the caller handle re-fetching with expand
		console.warn(
			'[CreatorStoryService] coverImage ID present but no expand data. Use expand: "coverImage" when fetching.'
		)
		return null
	}

	/**
	 * Get trending stories (sorted by likes)
	 */
	async getTrendingStories(limit = 5): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(1, limit, {
			filter: 'isPublished=true',
			sort: '-likes',
			expand: 'author',
		})
		return records.items
	}

	/**
	 * Get all published stories (for category aggregation)
	 */
	async getAllPublishedStories(): Promise<StoryWithExpand[]> {
		return await pb.collection(this.collectionName).getFullList<StoryWithExpand>({
			filter: `isPublished=true && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
		})
	}

	/**
	 * Get categories with their story counts
	 */
	async getCategoriesWithCounts(): Promise<{ name: string; count: number }[]> {
		try {
			const records = await pb.collection(this.collectionName).getList(1, 1000, {
				filter: `isPublished=true && nsfw=${process.env.NEXT_PUBLIC_IS_NSFW}`,
				fields: 'categories',
			})

			const categoryCount: Record<string, number> = {}
			records.items.forEach(record => {
				if (Array.isArray(record.categories)) {
					record.categories.forEach((cat: string) => {
						categoryCount[cat] = (categoryCount[cat] || 0) + 1
					})
				}
			})

			return Object.entries(categoryCount)
				.map(([name, count]) => ({ name, count }))
				.sort((a, b) => b.count - a.count)
		} catch (error) {
			console.error('Failed to load categories with counts:', error)
			return []
		}
	}
}

// Export a singleton instance
export const creatorStoryService = new CreatorStoryService()
