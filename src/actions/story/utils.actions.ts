/**
 * Story Utility Actions
 * Helper actions for stories (slug checking, etc.)
 */

'use server'

import { sanitizeSlug } from '@smseditor/lib/sanitization'
import { getAuthenticatedPB } from '../utils/action-utils'

// ============================================================================
// SLUG UTILITIES
// ============================================================================

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
			.getFirstListItem(`slug="${sanitized}"`, { requestKey: null })
			.catch(() => null)

		return existing === null
	} catch {
		return false
	}
}
