/**
 * Media Upload Service
 * Handles image and video uploads with validation
 */

import { applyScreening } from '@sms-editor/lib/media-screening'
import { pbFileUrl } from '@/lib/cover-url'
import { pb } from '@/lib/pocketbase'

// ============================================================================
// TYPES
// ============================================================================

export interface UploadMediaOptions {
	file: File
	alt?: string
	uploader?: string
}

export interface UploadAvatarOptions {
	file: File
	firstName?: string
	lastName?: string
	uploader?: string
}

export interface UploadMediaResult {
	success: true
	url: string
	recordId: string
}

export interface UploadMediaError {
	success: false
	error: string
	details?: unknown
}

export type UploadResult = UploadMediaResult | UploadMediaError

export interface ImageRecord {
	id: string
	image: string
	alt: string
	uploader?: string
	created: string
	updated: string
	collectionId: string
	collectionName: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

// ============================================================================
// SERVICE
// ============================================================================

export class MediaService {
	/**
	 * Validate file type and size for general media
	 */
	validateMediaFile(file: File): { valid: boolean; error?: string } {
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
	 * Validate avatar file (stricter size limit)
	 */
	validateAvatarFile(file: File): { valid: boolean; error?: string } {
		// Check file type
		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
			return {
				valid: false,
				error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF',
			}
		}

		// Check file size
		if (file.size > MAX_AVATAR_SIZE) {
			return {
				valid: false,
				error: 'Avatar must be less than 5MB',
			}
		}

		return { valid: true }
	}

	/**
	 * Upload media file to PocketBase
	 */
	async uploadMedia(options: UploadMediaOptions): Promise<UploadResult> {
		try {
			// Validate file
			const validation = this.validateMediaFile(options.file)
			if (!validation.valid) {
				return {
					success: false,
					error: validation.error || 'Invalid file',
				}
			}

			// Create FormData for PocketBase
			const formData = new FormData()
			formData.append('image', options.file)
			formData.append('alt', options.alt || options.file.name)

			if (options.uploader) {
				formData.append('uploader', options.uploader)
			}

			// Screened before the record exists, not after (M5-T2).
			await applyScreening(formData, options.file)

			// Upload to PocketBase
			const record = await pb.collection('images').create<ImageRecord>(formData)

			// Get URL
			const url = this.getImageUrl(record)

			return {
				success: true,
				url,
				recordId: record.id,
			}
		} catch (error: unknown) {
			const pbError = error as { message?: string; status?: number; response?: unknown; data?: unknown }
			console.error('PocketBase upload error:', pbError)

			return {
				success: false,
				error: pbError?.message || 'Failed to upload to database',
				details: pbError?.response || pbError?.data,
			}
		}
	}

	/**
	 * Upload avatar (with size thumbnail)
	 */
	async uploadAvatar(options: UploadAvatarOptions): Promise<UploadResult> {
		try {
			// Validate file
			const validation = this.validateAvatarFile(options.file)
			if (!validation.valid) {
				return {
					success: false,
					error: validation.error || 'Invalid avatar file',
				}
			}

			// Create alt text
			const alt = `${options.firstName || 'Character'} ${options.lastName || ''} avatar`.trim()

			// Create FormData for PocketBase
			const formData = new FormData()
			formData.append('image', options.file)
			formData.append('alt', alt)

			if (options.uploader) {
				formData.append('uploader', options.uploader)
			}

			// Screened before the record exists, not after (M5-T2).
			await applyScreening(formData, options.file)

			// Upload to PocketBase
			const record = await pb.collection('images').create<ImageRecord>(formData)

			// Get URL with thumbnail (300x300 for avatars)
			const url = this.getImageUrl(record, '300x300')

			return {
				success: true,
				url,
				recordId: record.id,
			}
		} catch (error: unknown) {
			const pbError = error as { message?: string; status?: number; response?: unknown; data?: unknown }
			console.error('PocketBase avatar upload error:', pbError)

			return {
				success: false,
				error: pbError?.message || 'Failed to upload avatar to database',
				details: pbError?.response || pbError?.data,
			}
		}
	}

	/**
	 * Get image URL with optional thumbnail size
	 */
	getImageUrl(record: ImageRecord, thumb?: string): string {
		return pbFileUrl(record, record.image, thumb ? { thumb } : undefined)
	}

	/**
	 * Delete media file from PocketBase
	 */
	async deleteMedia(recordId: string): Promise<boolean> {
		try {
			await pb.collection('images').delete(recordId)
			return true
		} catch (error) {
			console.error('Failed to delete media:', error)
			return false
		}
	}

	/**
	 * Get media record by ID
	 */
	async getMedia(recordId: string): Promise<ImageRecord | null> {
		try {
			const record = await pb.collection('images').getOne<ImageRecord>(recordId)
			return record
		} catch (error) {
			console.error('Failed to get media:', error)
			return null
		}
	}
}

// Export singleton instance
export const mediaService = new MediaService()
