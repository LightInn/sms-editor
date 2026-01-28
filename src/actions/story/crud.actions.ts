/**
 * Story CRUD Actions
 * Actions for creating, updating, and deleting stories
 */

'use server'

import { redirect } from 'next/navigation'
import { sanitizeCategories, sanitizeCharacters, sanitizeDescription } from 'sms-editor/lib/sanitization'
import * as v from 'valibot'
import type { Character, CreatorStory } from '../../types/creator-stories'
import { getAuthenticatedPB, handleActionError, unauthorizedResult } from '../utils/action-utils'
import {
	createStoryFormSchema,
	parseCategoriesFromFormData,
	parseCharactersFromFormData,
	validateDescription,
	validateSlug,
	validateTitle,
} from './validation'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStoryState {
	error?: string
	errors?: Record<string, string[]>
	success?: boolean
	storyId?: string
}

interface UpdateStoryResult {
	success: boolean
	error?: string
	story?: CreatorStory
}

interface DeleteStoryResult {
	success: boolean
	error?: string
}

// ============================================================================
// CREATE STORY
// ============================================================================

/**
 * Create a new story
 */
export async function createStoryAction(
	_prevState: CreateStoryState | null,
	formData: FormData
): Promise<CreateStoryState> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) {
			return { error: 'You must be signed in to create a story. Please sign in and try again.' }
		}

		const { pb, userId } = authPB

		// Extract & validate data
		const rawData = {
			title: formData.get('title'),
			description: formData.get('description'),
			slug: formData.get('slug'),
			categories: formData.get('categories'),
			characters: formData.get('characters'),
		}

		const validationResult = v.safeParse(createStoryFormSchema, rawData)

		if (!validationResult.success) {
			const fieldErrors: Record<string, string[]> = {}
			for (const issue of validationResult.issues) {
				const field = issue.path?.[0]?.key as string
				if (field) {
					if (!fieldErrors[field]) fieldErrors[field] = []
					fieldErrors[field].push(issue.message)
				}
			}
			return { error: 'Please fix the validation errors', errors: fieldErrors }
		}

		const validated = validationResult.output

		// Sanitize data
		const titleResult = validateTitle(validated.title)
		if ('error' in titleResult) return { error: titleResult.error }

		const slugResult = validateSlug(validated.slug)
		if ('error' in slugResult) return { error: slugResult.error }

		const sanitizedDescription = validated.description ? sanitizeDescription(validated.description) : ''
		const sanitizedCategories = parseCategoriesFromFormData(validated.categories)
		const sanitizedCharacters = parseCharactersFromFormData(validated.characters)

		// Check slug availability
		const existingStory = await pb
			.collection('c_stories')
			.getFirstListItem(`slug="${slugResult.sanitized}"`, { requestKey: null })
			.catch(() => null)

		if (existingStory) {
			return {
				error: 'This URL slug is already taken. Please choose another one.',
				errors: { slug: ['Slug already taken'] },
			}
		}

		// Create story
		const storyData = {
			title: titleResult.sanitized,
			description: sanitizedDescription,
			slug: slugResult.sanitized,
			author: userId,
			categories: sanitizedCategories,
			characters: sanitizedCharacters,
			isPublished: false,
			isCompleted: false,
			nsfw: true,
			likes: 0,
			chapters: [],
		}

		const story = await pb.collection('c_stories').create(storyData, { requestKey: null })

		redirect(`/editor/${story.id}/edit`)
	} catch (error) {
		// Handle redirect (it throws NEXT_REDIRECT)
		if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
			throw error
		}

		console.error('Failed to create story:', error)
		if (error instanceof Error) {
			return { error: error.message || 'Failed to create story. Please try again.' }
		}
		return { error: 'An unexpected error occurred. Please try again.' }
	}
}

// ============================================================================
// UPDATE STORY
// ============================================================================

/**
 * Update an existing story
 */
export async function updateStoryAction(
	storyId: string,
	data: {
		title?: string
		description?: string
		slug?: string
		categories?: string[]
		characters?: Character[]
		isCompleted?: boolean
		isPublished?: boolean
		nsfw?: boolean
		coverImage?: string
	}
): Promise<UpdateStoryResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) {
			return { success: false, error: 'You must be signed in to update a story.' }
		}

		const { pb, userId } = authPB

		// Verify story exists and ownership
		let existingStory: { author: string; slug: string } | null = null
		try {
			existingStory = await pb.collection('c_stories').getOne(storyId, { requestKey: null })
		} catch {
			return { success: false, error: 'Story not found. It may have been deleted.' }
		}

		if (existingStory.author !== userId) {
			return { success: false, error: 'You do not have permission to edit this story.' }
		}

		// Build update data with validation
		const updateData: Record<string, string | boolean | string[] | Character[]> = {}

		if (data.title !== undefined) {
			const result = validateTitle(data.title)
			if ('error' in result) return { success: false, error: result.error }
			updateData.title = result.sanitized
		}

		if (data.description !== undefined) {
			const result = validateDescription(data.description)
			if ('error' in result) return { success: false, error: result.error }
			updateData.description = result.sanitized
		}

		if (data.slug !== undefined) {
			const result = validateSlug(data.slug)
			if ('error' in result) return { success: false, error: result.error }

			// Check slug availability if changing
			if (result.sanitized !== existingStory.slug) {
				const existing = await pb
					.collection('c_stories')
					.getFirstListItem(`slug="${result.sanitized}" && id!="${storyId}"`, { requestKey: null })
					.catch(() => null)

				if (existing) {
					return { success: false, error: 'This slug is already taken. Please choose a different one.' }
				}
			}
			updateData.slug = result.sanitized
		}

		if (data.categories !== undefined) updateData.categories = sanitizeCategories(data.categories)
		if (data.characters !== undefined) updateData.characters = sanitizeCharacters(data.characters)
		if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted
		if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
		if (data.nsfw !== undefined) updateData.nsfw = data.nsfw
		if (data.coverImage !== undefined) updateData.coverImage = data.coverImage

		// Update story
		const updatedStory = await pb.collection('c_stories').update<CreatorStory>(storyId, updateData, {
			requestKey: null,
		})

		return { success: true, story: updatedStory }
	} catch (error) {
		return handleActionError(error, 'Failed to update story.')
	}
}

// ============================================================================
// DELETE STORY
// ============================================================================

/**
 * Delete a story and all its chapters/blocks
 */
export async function deleteStoryAction(storyId: string): Promise<DeleteStoryResult> {
	try {
		// Verify authentication
		const authPB = await getAuthenticatedPB()
		if (!authPB) return unauthorizedResult()

		const { pb, userId } = authPB

		// Verify ownership
		let existingStory: { author: string }
		try {
			existingStory = await pb.collection('c_stories').getOne(storyId, { requestKey: null })
		} catch {
			return { success: false, error: 'Story not found.' }
		}

		if (existingStory.author !== userId) {
			return { success: false, error: 'You do not have permission to delete this story.' }
		}

		// Delete story
		await pb.collection('c_stories').delete(storyId, { requestKey: null })

		return { success: true }
	} catch (error) {
		return handleActionError(error, 'Failed to delete story.')
	}
}
