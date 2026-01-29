/**
 * Shared utilities for Server Actions
 * Authentication, ownership verification, and error handling
 */

import { auth } from '@sms-editor/lib/auth/auth.server'
import { headers } from 'next/headers'
import { pb } from '@/lib/pocketbase'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticatedPB {
	pb: typeof pb
	userId: string
}

export interface ActionResult<T = undefined> {
	success: boolean
	error?: string
	data?: T
}

// Ownership verification result types
export type ChapterOwnershipSuccess = {
	valid: true
	chapter: { id: string; story: string }
	story: { id: string; author: string }
}

export type ChapterOwnershipError = {
	valid: false
	error: string
}

export type ChapterOwnershipResult = ChapterOwnershipSuccess | ChapterOwnershipError

export type MultipleChaptersOwnershipSuccess = {
	valid: true
	chapters: Array<{ id: string; story: string }>
}

export type MultipleChaptersOwnershipError = {
	valid: false
	error: string
}

export type MultipleChaptersOwnershipResult = MultipleChaptersOwnershipSuccess | MultipleChaptersOwnershipError

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get authenticated PocketBase instance
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedPB(): Promise<AuthenticatedPB | null> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user) {
		return null
	}

	return { pb, userId: session.user.id }
}

/**
 * Create an unauthorized error result
 */
export function unauthorizedResult<T>(): ActionResult<T> {
	return {
		success: false,
		error: 'You must be signed in to perform this action.',
	}
}

// ============================================================================
// OWNERSHIP VERIFICATION
// ============================================================================

/**
 * Verify that a chapter exists and belongs to the current user
 * Returns the chapter and story data if valid, or an error result
 */
export async function verifyChapterOwnership(
	authPB: AuthenticatedPB,
	chapterId: string
): Promise<ChapterOwnershipResult> {
	const { pb, userId } = authPB

	// Get chapter
	let chapter: { id: string; story: string }
	try {
		chapter = await pb.collection('c_chapters').getOne(chapterId, {
			requestKey: null,
		})
	} catch {
		return { valid: false, error: 'Chapter not found.' }
	}

	// Get story
	let story: { id: string; author: string }
	try {
		story = await pb.collection('c_stories').getOne(chapter.story, {
			requestKey: null,
		})
	} catch {
		return { valid: false, error: 'Story not found.' }
	}

	// Verify ownership
	if (story.author !== userId) {
		return { valid: false, error: 'You do not have permission to edit this chapter.' }
	}

	return { valid: true, chapter, story }
}

/**
 * Verify that multiple chapters exist and belong to the current user
 */
export async function verifyMultipleChaptersOwnership(
	authPB: AuthenticatedPB,
	chapterIds: string[]
): Promise<MultipleChaptersOwnershipResult> {
	const { pb, userId } = authPB

	// Get all chapters
	const chapters = await Promise.all(
		chapterIds.map(id =>
			pb
				.collection('c_chapters')
				.getOne<{ id: string; story: string }>(id, { requestKey: null })
				.catch(() => null)
		)
	)

	// Check if any chapter is missing
	const validChapters = chapters.filter((ch): ch is { id: string; story: string } => ch !== null)
	if (validChapters.length !== chapters.length) {
		return { valid: false, error: 'One or more chapters not found.' }
	}

	// Get unique story IDs
	const storyIds = [...new Set(validChapters.map(ch => ch.story))]

	// Get all stories and verify ownership
	const stories = await Promise.all(
		storyIds.map(id =>
			pb
				.collection('c_stories')
				.getOne<{ id: string; author: string }>(id, { requestKey: null })
				.catch(() => null)
		)
	)

	// Check if any story is missing or not owned by user
	const validStories = stories.filter((s): s is { id: string; author: string } => s !== null)
	if (validStories.length !== stories.length) {
		return { valid: false, error: 'One or more stories not found.' }
	}

	// Verify all stories belong to the user
	if (validStories.some(s => s.author !== userId)) {
		return { valid: false, error: 'You do not have permission to edit these chapters.' }
	}

	return { valid: true, chapters: validChapters }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle common PocketBase errors and return appropriate error messages
 */
export function handleActionError(error: unknown, defaultMessage: string): ActionResult {
	console.error(defaultMessage, error)

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
				error: 'Resource not found.',
			}
		}
	}

	return {
		success: false,
		error: `${defaultMessage} Please try again.`,
	}
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a date string
 * Returns true if null/empty or valid date, false otherwise
 */
export function isValidDateOrEmpty(dateStr: string | null | undefined): boolean {
	if (dateStr === null || dateStr === undefined || dateStr === '') {
		return true
	}
	const date = new Date(dateStr)
	return !Number.isNaN(date.getTime())
}
