/**
 * Media Upload Actions
 * Actions for uploading general media (images and videos)
 */

'use server'

import { auth } from '@sms-editor/lib/auth/auth.server'
import { type MediaActor, mayDeleteMedia, mayUploadMedia } from '@sms-editor/lib/media/permissions'
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

async function loadActor(userId: string): Promise<MediaActor | null> {
	try {
		return await pb.collection('user').getOne<MediaActor>(userId, { fields: 'id,admin,banned', requestKey: null })
	} catch {
		return null
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

		if (!mayUploadMedia(await loadActor(user.id))) {
			return { success: false, error: 'Your account does not have permission to upload media.' }
		}

		// Check upload limits
		const limitsCheck = await checkUploadLimits(user.id)
		if (!limitsCheck.allowed) {
			return { success: false, error: limitsCheck.error || 'Upload limit reached.' }
		}

		// Upload to PocketBase
		const imageService = new ImageService()
		const record = await imageService.uploadImage(file, alt || file.name, user.id)
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

		try {
			const record = await pb.collection('images').getOne<{ id: string; uploader?: string }>(recordId, {
				requestKey: null,
			})

			if (!mayDeleteMedia(await loadActor(user.id), user.id, record)) {
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
