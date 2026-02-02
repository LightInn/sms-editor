/**
 * Server Actions for Media Upload
 * Handles secure media uploads with authentication and validation
 *
 * Security layers:
 * 1. Session verification (Better Auth)
 * 2. File validation (type, size)
 * 3. Server-side upload to PocketBase
 *
 * TODO: Add trust level verification
 * TODO: Add upload rate limiting per user
 * TODO: Add daily/monthly upload quota checks
 * TODO: Add content scanning for inappropriate content
 */

'use server'

import { ImageService } from '@sms-editor/services/imageService'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth.server'

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
// CONSTANTS
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authenticated session
 */
async function getAuthenticatedUser() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user) {
		return null
	}

	return session.user
}

/**
 * Validate file type and size
 */
function validateFile(file: File): { valid: boolean; error?: string } {
	const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
	const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

	// Check file type
	if (!isImage && !isVideo) {
		return {
			valid: false,
			error: `Invalid file type. Allowed: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}`,
		}
	}

	// Check file size
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
	if (file.size > maxSize) {
		const maxSizeMB = maxSize / (1024 * 1024)
		return {
			valid: false,
			error: `File too large. Maximum size: ${maxSizeMB}MB`,
		}
	}

	return { valid: true }
}

/**
 * TODO: Check user trust level
 * Implement a trust score based on:
 * - Account age
 * - Number of published stories
 * - User reports
 * - Moderation history
 */
async function checkUserTrustLevel(_userId: string): Promise<boolean> {
	// TODO: Implement trust level logic
	// For now, allow all authenticated users
	return true
}

/**
 * TODO: Check upload rate limits
 * Implement rate limiting based on:
 * - Uploads per hour (e.g., max 20/hour)
 * - Uploads per day (e.g., max 100/day)
 * - Uploads per month (e.g., max 1000/month)
 */
async function checkUploadLimits(_userId: string): Promise<{ allowed: boolean; error?: string }> {
	// TODO: Implement rate limiting
	// Could use Redis or a database table to track upload counts
	// Example structure:
	// - user_uploads table with columns: user_id, upload_date, count
	// - Check hourly, daily, monthly limits

	return { allowed: true }
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Upload media (image or video) to PocketBase
 * This action runs on the server with proper authentication
 */
export async function uploadMediaAction(formData: FormData): Promise<UploadMediaResult> {
	try {
		// 1. Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return {
				success: false,
				error: 'Authentication required. Please sign in to upload media.',
			}
		}

		// 2. Extract file from FormData
		const file = formData.get('file') as File | null
		const alt = formData.get('alt') as string | null

		if (!file) {
			return {
				success: false,
				error: 'No file provided',
			}
		}

		// 3. Validate file
		const validation = validateFile(file)
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			}
		}

		// 4. TODO: Check user trust level
		const isTrusted = await checkUserTrustLevel(user.id)
		if (!isTrusted) {
			return {
				success: false,
				error: 'Your account does not have permission to upload media. Please contact support.',
			}
		}

		// 5. TODO: Check upload limits
		const limitsCheck = await checkUploadLimits(user.id)
		if (!limitsCheck.allowed) {
			return {
				success: false,
				error: limitsCheck.error || 'Upload limit reached. Please try again later.',
			}
		}

		// 6. Upload to PocketBase (server-side with proper permissions)
		const imageService = new ImageService()
		const record = await imageService.uploadImage(file, alt || file.name)

		// 7. Get the URL
		const url = imageService.getImageUrl(record)

		// 8. TODO: Log upload for rate limiting
		// await logUpload(user.id, file.size, file.type)

		return {
			success: true,
			url,
			recordId: record.id,
		}
	} catch (error) {
		console.error('Media upload error:', error)

		// Don't expose internal errors to client
		return {
			success: false,
			error: 'Failed to upload media. Please try again.',
		}
	}
}

/**
 * Delete media from PocketBase
 * TODO: Add ownership verification
 */
export async function deleteMediaAction(recordId: string): Promise<UploadMediaResult> {
	try {
		// 1. Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return {
				success: false,
				error: 'Authentication required',
			}
		}

		// 2. TODO: Verify user owns this media or has permission to delete
		// const media = await imageService.getImage(recordId)
		// if (media.uploader !== user.id) {
		//   return { success: false, error: 'Permission denied' }
		// }

		// 3. Delete from PocketBase
		const imageService = new ImageService()
		await imageService.deleteImage(recordId)

		return {
			success: true,
		}
	} catch (error) {
		console.error('Media deletion error:', error)
		return {
			success: false,
			error: 'Failed to delete media',
		}
	}
}
