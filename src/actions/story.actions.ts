/**
 * Server Actions for Creator Stories
 * Handles secure story creation with triple verification:
 * 1. Session verification (Better Auth)
 * 2. Data validation & sanitization
 * 3. PocketBase permissions
 */

'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Character, CreatorStory } from 'sms-editor/types'
import * as v from 'valibot'
import { auth } from '@/lib/auth/auth.server'
import { pb } from '@/lib/pocketbase'
import {
	sanitizeCategories,
	sanitizeCharacters,
	sanitizeDescription,
	sanitizeSlug,
	sanitizeText,
} from '@/lib/sanitization'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStoryState {
	error?: string
	errors?: Record<string, string[]>
	success?: boolean
	storyId?: string
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createStoryFormSchema = v.object({
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Title required'),
		v.maxLength(200, 'Title must be less than 200 characters')
	),
	description: v.optional(v.pipe(v.string(), v.maxLength(5000, 'Description too long'))),
	slug: v.pipe(
		v.string(),
		v.minLength(1, 'Slug required'),
		v.maxLength(200, 'Slug too long'),
		v.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
	),
	categories: v.optional(v.string()), // JSON string
	characters: v.optional(v.string()), // JSON string
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authenticated PocketBase instance
 * Authenticates PocketBase with the current user's session
 */
async function getAuthenticatedPB() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user) {
		return null
	}

	// PocketBase is already authenticated via the adapter
	// The pb instance shares the same auth store as Better Auth
	return { pb, userId: session.user.id }
}

/**
 * Parse and sanitize categories from JSON string
 */
function parseCategoriesFromFormData(categoriesJson?: string): string[] {
	if (!categoriesJson) return []

	try {
		const parsed = JSON.parse(categoriesJson)
		if (!Array.isArray(parsed)) return []
		return sanitizeCategories(parsed)
	} catch {
		return []
	}
}

/**
 * Parse and sanitize characters from JSON string
 */
function parseCharactersFromFormData(charactersJson?: string): Character[] {
	if (!charactersJson) return []

	try {
		const parsed = JSON.parse(charactersJson)
		if (!Array.isArray(parsed)) return []
		return sanitizeCharacters(parsed)
	} catch {
		return []
	}
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Create a new story
 * Triple security verification:
 * 1. Better Auth session verification
 * 2. Data validation and sanitization
 * 3. PocketBase permissions check
 */
export async function createStoryAction(
	_prevState: CreateStoryState | null,
	formData: FormData
): Promise<CreateStoryState> {
	try {
		// ========================================================================
		// STEP 1: VERIFY AUTHENTICATION
		// ========================================================================

		const authPB = await getAuthenticatedPB()

		if (!authPB) {
			return {
				error: 'You must be signed in to create a story. Please sign in and try again.',
			}
		}

		const { pb, userId } = authPB

		// ========================================================================
		// STEP 2: EXTRACT & VALIDATE DATA
		// ========================================================================

		const rawData = {
			title: formData.get('title'),
			description: formData.get('description'),
			slug: formData.get('slug'),
			categories: formData.get('categories'),
			characters: formData.get('characters'),
		}

		// Validate with Valibot
		const validationResult = v.safeParse(createStoryFormSchema, rawData)

		if (!validationResult.success) {
			const fieldErrors: Record<string, string[]> = {}

			for (const issue of validationResult.issues) {
				const field = issue.path?.[0]?.key as string
				if (field) {
					if (!fieldErrors[field]) {
						fieldErrors[field] = []
					}
					fieldErrors[field].push(issue.message)
				}
			}

			return {
				error: 'Please fix the validation errors',
				errors: fieldErrors,
			}
		}

		const validated = validationResult.output

		// ========================================================================
		// STEP 3: SANITIZE DATA
		// ========================================================================

		const sanitizedTitle = sanitizeText(validated.title)
		const sanitizedDescription = validated.description ? sanitizeDescription(validated.description) : ''
		const sanitizedSlug = sanitizeSlug(validated.slug)
		const sanitizedCategories = parseCategoriesFromFormData(validated.categories)
		const sanitizedCharacters = parseCharactersFromFormData(validated.characters)

		// Additional validation after sanitization
		if (!sanitizedTitle || sanitizedTitle.length === 0) {
			return {
				error: 'Invalid title after sanitization',
			}
		}

		if (!sanitizedSlug || sanitizedSlug.length === 0) {
			return {
				error: 'Invalid slug after sanitization',
			}
		}

		// ========================================================================
		// STEP 4: CHECK SLUG AVAILABILITY
		// ========================================================================

		const existingStory = await pb
			.collection('c_stories')
			.getFirstListItem(`slug="${sanitizedSlug}"`, {
				requestKey: null, // Disable auto-cancellation
			})
			.catch(() => null)

		if (existingStory) {
			return {
				error: 'This URL slug is already taken. Please choose another one.',
				errors: {
					slug: ['Slug already taken'],
				},
			}
		}

		// ========================================================================
		// STEP 5: CREATE STORY IN POCKETBASE
		// ========================================================================

		const storyData = {
			title: sanitizedTitle,
			description: sanitizedDescription,
			slug: sanitizedSlug,
			author: userId,
			categories: sanitizedCategories,
			characters: sanitizedCharacters,
			isPublished: false,
			isCompleted: false,
			likes: 0,
			chapters: [], // Empty initially
		}

		const story = await pb.collection('c_stories').create(storyData, {
			requestKey: null,
		})

		// ========================================================================
		// STEP 6: SUCCESS - REDIRECT
		// ========================================================================

		// Note: redirect throws an error to stop execution
		// This is the expected behavior in Next.js Server Actions
		redirect(`/editor/${story.id}/edit`)
	} catch (error) {
		// Handle redirect (it throws NEXT_REDIRECT)
		if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
			throw error
		}

		console.error('Failed to create story:', error)

		// Return user-friendly error
		if (error instanceof Error) {
			return {
				error: error.message || 'Failed to create story. Please try again.',
			}
		}

		return {
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

/**
 * Check if a slug is available
 * Used for real-time validation in forms
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
	try {
		const authPB = await getAuthenticatedPB()
		if (!authPB) return false

		const sanitized = sanitizeSlug(slug)
		if (!sanitized) return false

		const existing = await authPB.pb
			.collection('c_stories')
			.getFirstListItem(`slug="${sanitized}"`, {
				requestKey: null,
			})
			.catch(() => null)

		return existing === null
	} catch {
		return false
	}
}

/**
 * Update an existing story
 * Triple security verification:
 * 1. Better Auth session verification
 * 2. Ownership verification
 * 3. Data validation and sanitization
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
	}
): Promise<{ success: boolean; error?: string; story?: CreatorStory }> {
	try {
		// ========================================================================
		// STEP 1: VERIFY AUTHENTICATION
		// ========================================================================

		const authPB = await getAuthenticatedPB()

		if (!authPB) {
			return {
				success: false,
				error: 'You must be signed in to update a story. Please sign in and try again.',
			}
		}

		const { pb, userId } = authPB

		// ========================================================================
		// STEP 2: VERIFY STORY EXISTS AND OWNERSHIP
		// ========================================================================

		let existingStory: { author: string; slug: string } | null = null
		try {
			existingStory = await pb.collection('c_stories').getOne(storyId, {
				requestKey: null,
			})
		} catch (error) {
			console.error('Story not found:', error)
			return {
				success: false,
				error: 'Story not found. It may have been deleted.',
			}
		}

		// Check ownership
		if (existingStory.author !== userId) {
			return {
				success: false,
				error: 'You do not have permission to edit this story.',
			}
		}

		// ========================================================================
		// STEP 3: SANITIZE AND VALIDATE DATA
		// ========================================================================

		const updateData: Record<string, string | boolean | string[] | Character[]> = {}

		if (data.title !== undefined) {
			const sanitized = sanitizeText(data.title)
			if (!sanitized || sanitized.length < 1 || sanitized.length > 200) {
				return {
					success: false,
					error: 'Title must be between 1 and 200 characters',
				}
			}
			updateData.title = sanitized
		}

		if (data.description !== undefined) {
			const sanitized = sanitizeDescription(data.description)
			if (sanitized.length > 5000) {
				return {
					success: false,
					error: 'Description must be less than 5000 characters',
				}
			}
			updateData.description = sanitized
		}

		if (data.slug !== undefined) {
			const sanitized = sanitizeSlug(data.slug)
			if (!sanitized || sanitized.length < 1 || sanitized.length > 200) {
				return {
					success: false,
					error: 'Slug must be between 1 and 200 characters',
				}
			}

			// Check slug availability if changing
			if (sanitized !== existingStory.slug) {
				const existing = await pb
					.collection('c_stories')
					.getFirstListItem(`slug="${sanitized}" && id!="${storyId}"`, {
						requestKey: null,
					})
					.catch(() => null)

				if (existing) {
					return {
						success: false,
						error: 'This slug is already taken. Please choose a different one.',
					}
				}
			}

			updateData.slug = sanitized
		}

		if (data.categories !== undefined) {
			const sanitized = sanitizeCategories(data.categories)
			updateData.categories = sanitized
		}

		if (data.characters !== undefined) {
			const sanitized = sanitizeCharacters(data.characters)
			updateData.characters = sanitized
		}

		if (data.isCompleted !== undefined) {
			updateData.isCompleted = data.isCompleted
		}

		if (data.isPublished !== undefined) {
			updateData.isPublished = data.isPublished
		}

		// ========================================================================
		// STEP 4: UPDATE STORY IN POCKETBASE
		// ========================================================================

		const updatedStory = await pb.collection('c_stories').update<CreatorStory>(storyId, updateData, {
			requestKey: null,
		})

		return {
			success: true,
			story: updatedStory,
		}
	} catch (error) {
		console.error('Failed to update story:', error)

		// Provide specific error messages
		if (error instanceof Error) {
			if (error.message.includes('unauthorized') || error.message.includes('403')) {
				return {
					success: false,
					error: 'Unauthorized. Please make sure you are logged in.',
				}
			}

			if (error.message.includes('404') || error.message.includes('not found')) {
				return {
					success: false,
					error: 'Story not found. It may have been deleted.',
				}
			}
		}

		return {
			success: false,
			error: 'Failed to update story. Please try again.',
		}
	}
}
