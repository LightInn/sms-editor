/**
 * Media Validation Utilities
 * Centralized validation logic for media uploads
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface FileValidationResult {
	valid: boolean
	error?: string
	isImage?: boolean
	isVideo?: boolean
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate general media file (image or video)
 */
export function validateMediaFile(file: File, maxImageSize = MAX_IMAGE_SIZE): FileValidationResult {
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
	const maxSize = isVideo ? MAX_VIDEO_SIZE : maxImageSize
	if (file.size > maxSize) {
		const maxSizeMB = maxSize / (1024 * 1024)
		return {
			valid: false,
			error: `File too large. Maximum size: ${maxSizeMB}MB`,
		}
	}

	return { valid: true, isImage, isVideo }
}

/**
 * Validate avatar file (images only, smaller size limit)
 */
export function validateAvatarFile(file: File): FileValidationResult {
	// Check file type
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF',
		}
	}

	// Check file size (5MB max for avatars)
	if (file.size > MAX_AVATAR_SIZE) {
		return {
			valid: false,
			error: 'Avatar must be less than 5MB',
		}
	}

	return { valid: true, isImage: true }
}
