/**
 * Media Upload Actions
 * Actions for uploading general media (images and videos)
 */

'use server'

import { auth } from '@sms-editor/lib/auth/auth.server'
import { checkRateLimit } from '@sms-editor/lib/rate-limit'
import { ImageService } from '@sms-editor/services/imageService'
import { headers } from 'next/headers'
import { pb } from '@/lib/pocketbase'
import { validateMediaFile } from './validation'

// ============================================================================
// TYPES
// ============================================================================

export interface UploadMediaResult {
	success: boolean
	url?: string
	recordId?: string
	error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authenticated user
 */
async function getAuthenticatedUser() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	return session?.user ?? null
}

/**
 * Check user trust level
 * Users can upload media if:
 * - They are admin
 * - They have email verified (emailVerified is true)
 * - Default: allow all authenticated users for now
 */
async function checkUserTrustLevel(userId: string): Promise<boolean> {
	try {
		const user = await pb.collection('user').getOne<{ id: string; admin?: boolean; emailVerified?: boolean }>(userId, {
			requestKey: null,
		})

		// Admins always have access
		if (user.admin) return true

		// For now, allow all authenticated users
		// TODO: Add stricter trust requirements when needed (e.g., emailVerified, account age)
		return true
	} catch {
		// If we can't fetch user, deny access
		return false
	}
}

/**
 * Check upload rate limits.
 *
 * Async since M0-T9 made the limiter durable — the count now lives in
 * PocketBase, so it survives a deploy and is shared between instances.
 */
async function checkUploadLimits(userId: string): Promise<{ allowed: boolean; error?: string }> {
	return checkRateLimit(userId)
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Upload media (image or video) to PocketBase
 */
export async function uploadMediaAction(formData: FormData): Promise<UploadMediaResult> {
	try {
		// Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return { success: false, error: 'Authentication required. Please sign in to upload media.' }
		}

		// Extract file from FormData
		const file = formData.get('file') as File | null
		const alt = formData.get('alt') as string | null

		if (!file) {
			return { success: false, error: 'No file provided' }
		}

		// Validate file
		const validation = validateMediaFile(file)
		if (!validation.valid) {
			return { success: false, error: validation.error }
		}

		// Check user trust level
		const isTrusted = await checkUserTrustLevel(user.id)
		if (!isTrusted) {
			return { success: false, error: 'Your account does not have permission to upload media.' }
		}

		// Check upload limits
		const limitsCheck = await checkUploadLimits(user.id)
		if (!limitsCheck.allowed) {
			return { success: false, error: limitsCheck.error || 'Upload limit reached.' }
		}

		// Upload to PocketBase
		const imageService = new ImageService()
		const record = await imageService.uploadImage(file, alt || file.name)
		const url = imageService.getImageUrl(record)

		return { success: true, url, recordId: record.id }
	} catch (error) {
		console.error('Media upload error:', error)
		return { success: false, error: 'Failed to upload media. Please try again.' }
	}
}

/**
 * Delete media from PocketBase
 */
export async function deleteMediaAction(recordId: string): Promise<UploadMediaResult> {
	try {
		// Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return { success: false, error: 'Authentication required' }
		}

		// Verify user owns this media
		try {
			const record = await pb.collection('images').getOne<{ id: string; uploadedBy?: string }>(recordId, {
				requestKey: null,
			})

			// Check if the record has an uploadedBy field and if it matches the user
			// If no uploadedBy field exists (legacy data), allow deletion for now
			if (record.uploadedBy && record.uploadedBy !== user.id) {
				return { success: false, error: 'You do not have permission to delete this media.' }
			}
		} catch {
			return { success: false, error: 'Media not found.' }
		}

		// Delete from PocketBase
		const imageService = new ImageService()

		await imageService.deleteImage(recordId)

		return { success: true }
	} catch (error) {
		console.error('Media deletion error:', error)
		return { success: false, error: 'Failed to delete media' }
	}
}
