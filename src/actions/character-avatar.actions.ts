/**
 * Server Actions for Character Avatar Upload
 * Handles secure avatar uploads with authentication and validation
 *
 * Security layers:
 * 1. Session verification (Better Auth)
 * 2. File validation (type, size)
 * 3. Server-side upload to PocketBase
 */

'use server'

import { ImageService } from '@sms-editor/services/imageService'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth.server'

// ============================================================================
// TYPES
// ============================================================================

export interface UploadAvatarResult {
	success: boolean
	url?: string
	recordId?: string
	error?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB (same as frontend validation)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB for videos

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
 * Validate avatar file type and size
 */
function validateAvatarFile(file: File): { valid: boolean; error?: string } {
	// Check file type
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed: JPG, PNG, WebP, GIF`,
		}
	}

	// Check file size (5MB max for avatars)
	if (file.size > MAX_IMAGE_SIZE) {
		return {
			valid: false,
			error: `Avatar must be less than 5MB`,
		}
	}

	return { valid: true }
}

/**
 * Validate message media file (image or video) type and size
 */
function validateMediaFile(file: File): { valid: boolean; error?: string } {
	const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
	const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

	// Check file type
	if (!isImage && !isVideo) {
		return {
			valid: false,
			error: `Invalid file type. Allowed images: JPG, PNG, WebP, GIF. Allowed videos: MP4, WebM, OGG, MOV`,
		}
	}

	// Check file size
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `${isVideo ? 'Video' : 'Image'} must be less than ${isVideo ? '50MB' : '5MB'}`,
		}
	}

	return { valid: true }
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Upload character avatar to PocketBase
 * This action runs on the server with proper authentication
 */
export async function uploadCharacterAvatar(formData: FormData): Promise<UploadAvatarResult> {
	try {
		// 1. Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return {
				success: false,
				error: 'Authentication required. Please sign in to upload avatars.',
			}
		}

		// 2. Extract file from FormData
		const file = formData.get('file') as File | null
		const firstName = formData.get('firstName') as string | null
		const lastName = formData.get('lastName') as string | null

		if (!file) {
			return {
				success: false,
				error: 'No file provided',
			}
		}

		// 3. Validate file
		const validation = validateAvatarFile(file)
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			}
		}

		// 4. Create alt text for accessibility
		const alt = `${firstName || 'Character'} ${lastName || ''} avatar`.trim()

		// 5. Upload to PocketBase (server-side with proper permissions)
		const imageService = new ImageService()
		const record = await imageService.uploadImage(file, alt)

		// 6. Get the URL with thumbnail (300x300 for character avatars)
		const url = imageService.getImageUrl(record, '300x300')

		return {
			success: true,
			url,
			recordId: record.id,
		}
	} catch (error) {
		console.error('Avatar upload error:', error)

		// Provide more specific error messages
		if (error instanceof Error) {
			// Check for PocketBase specific errors
			if (error.message.includes('unauthorized') || error.message.includes('403')) {
				return {
					success: false,
					error: 'Unauthorized. Please make sure you are logged in and have the proper permissions.',
				}
			}
		}

		// Don't expose internal errors to client
		return {
			success: false,
			error: 'Failed to upload avatar. Please try again.',
		}
	}
}

/**
 * Upload message media (image or video) to PocketBase
 * This action runs on the server with proper authentication
 */
export async function uploadMessageMedia(formData: FormData): Promise<UploadAvatarResult> {
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
		const mediaType = formData.get('mediaType') as string | null

		if (!file) {
			return {
				success: false,
				error: 'No file provided',
			}
		}

		// 3. Validate file
		const validation = validateMediaFile(file)
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			}
		}

		// 4. Create alt text for accessibility
		const alt = `Message ${mediaType || 'media'}`

		// 5. Upload to PocketBase (server-side with proper permissions)
		const imageService = new ImageService()
		const record = await imageService.uploadImage(file, alt)

		// 6. Get the URL (no thumbnail for message media to preserve quality)
		const url = imageService.getImageUrl(record)

		return {
			success: true,
			url,
			recordId: record.id,
		}
	} catch (error) {
		console.error('Media upload error:', error)

		// Provide more specific error messages
		if (error instanceof Error) {
			// Check for PocketBase specific errors
			if (error.message.includes('unauthorized') || error.message.includes('403')) {
				return {
					success: false,
					error: 'Unauthorized. Please make sure you are logged in and have the proper permissions.',
				}
			}
		}

		// Don't expose internal errors to client
		return {
			success: false,
			error: 'Failed to upload media. Please try again.',
		}
	}
}
