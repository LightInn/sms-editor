/**
 * Service for managing creator stories (user-generated stories)
 * Handles CRUD operations for the c_stories collection
 * NOTE: This service should only be used on the server side
 */

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
		formData.append('nsfw', (data.nsfw ?? true).toString()) // Default to true for this project
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
				.getFirstListItem<StoryWithExpand>(`slug="${slug}" && nsfw=${process.env.IS_NSFW}`, {
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
			filter: `author="${targetUserId}" && nsfw=${process.env.IS_NSFW}`,
			sort: '-created',
			expand: 'author,coverImage',
		})

		// Manually fetch chapters for each story since the relation is inverse (chapter -> story)
		const storiesWithChapters = await Promise.all(
			records.items.map(async story => {
				const chapterRecords = await pb.collection('c_chapters').getFullList({
					filter: `story="${story.id}"`,
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

				return {
					...story,
					expand: {
						...story.expand,
						chapters,
					},
				}
			})
		)

		return storiesWithChapters
	}

	/**
	 * Get all published stories (public)
	 */
	async getPublishedStories(page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `isPublished=true  && nsfw=${process.env.IS_NSFW}`,
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
			filter: `isPublished=true  && nsfw=${process.env.IS_NSFW}`,
			sort: '-created', // Temporary sort, will be overridden by chapter-based sorting
			expand: 'author,coverImage',
		})

		// Sort stories by their most recent chapter's updated date
		const storiesWithLatestChapter = await Promise.all(
			records.items.map(async story => {
				try {
					const chapterRecords = await pb.collection('c_chapters').getList(1, 1, {
						filter: `story="${story.id}"`,
						sort: '-updated',
					})

					// Use the latest chapter's updated date, or fall back to story creation date
					const latestChapterDate = chapterRecords.items[0]?.updated || story.created
					return { story, latestDate: latestChapterDate }
				} catch (error) {
					// If chapter query fails, fall back to story creation date
					console.warn(`Failed to fetch chapters for story ${story.id}:`, error)
					return { story, latestDate: story.created }
				}
			})
		)

		// Sort by latest chapter date (most recent first)
		storiesWithLatestChapter.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())

		// Return only the requested number of stories
		return storiesWithLatestChapter.slice(0, safeLimit).map(item => item.story)
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
				? `slug="${slug}" && id!="${excludeId}" && nsfw=${process.env.IS_NSFW}`
				: `slug="${slug}" && nsfw=${process.env.IS_NSFW}`

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
			filter: `author="${targetUserId}" && nsfw=${process.env.IS_NSFW}`,
		})

		return result.totalItems
	}

	/**
	 * Search stories by title
	 */
	async searchStories(query: string, page = 1, perPage = 20): Promise<StoryWithExpand[]> {
		const records = await pb.collection(this.collectionName).getList<StoryWithExpand>(page, perPage, {
			filter: `title~"${query}" && isPublished=true && nsfw=${process.env.IS_NSFW}`,
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
			filter: `categories~"${category}" && isPublished=true && nsfw=${process.env.IS_NSFW}`,
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
		return pb.files.getURL(pbRecord, filename)
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
			return `${pb.baseUrl}/api/files/images/${imageRecord.id}/${imageRecord.image}`
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
			filter: `isPublished=true && nsfw=${process.env.IS_NSFW}`,
		})
	}

	/**
	 * Get categories with their story counts
	 */
	async getCategoriesWithCounts(): Promise<{ name: string; count: number }[]> {
		try {
			const records = await pb.collection(this.collectionName).getList(1, 1000, {
				filter: `isPublished=true && nsfw=${process.env.IS_NSFW}`,
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
