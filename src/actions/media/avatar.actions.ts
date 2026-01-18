/**
 * Character Avatar Upload Actions
 * Actions for uploading character avatars and message media
 */

'use server'

import { auth } from '@smseditor/lib/auth/auth.server'
import { pb } from '@smseditor/lib/pocketbase'
import { sanitizeName } from '@smseditor/lib/sanitization'
import { createImageService } from '@smseditor/services/imageService'
import { headers } from 'next/headers'
import { validateAvatarFile, validateMediaFile } from './validation'

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
// HELPER
// ============================================================================

async function getAuthenticatedUser() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	return session?.user ?? null
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Upload character avatar to PocketBase
 */
export async function uploadCharacterAvatar(formData: FormData): Promise<UploadAvatarResult> {
	try {
		// Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return { success: false, error: 'Authentication required. Please sign in to upload avatars.' }
		}

		// Extract file from FormData
		const file = formData.get('file') as File | null
		const firstName = formData.get('firstName') as string | null
		const lastName = formData.get('lastName') as string | null

		if (!file) {
			return { success: false, error: 'No file provided' }
		}

		// Validate file
		const validation = validateAvatarFile(file)
		if (!validation.valid) {
			return { success: false, error: validation.error }
		}

		// Sanitize and create alt text
		const sanitizedFirstName = firstName ? sanitizeName(firstName) : 'Character'
		const sanitizedLastName = lastName ? sanitizeName(lastName) : ''
		const alt = `${sanitizedFirstName} ${sanitizedLastName} avatar`.trim()

		// Upload to PocketBase
		const imageService = createImageService(pb)
		const record = await imageService.uploadImage(file, alt)
		const url = imageService.getImageUrl(record, '300x300')

		return { success: true, url, recordId: record.id }
	} catch (error) {
		console.error('Avatar upload error:', error)

		if (error instanceof Error) {
			if (error.message.includes('unauthorized') || error.message.includes('403')) {
				return { success: false, error: 'Unauthorized. Please make sure you are logged in.' }
			}
		}

		return { success: false, error: 'Failed to upload avatar. Please try again.' }
	}
}

/**
 * Upload message media (image or video) to PocketBase
 */
export async function uploadMessageMedia(formData: FormData): Promise<UploadAvatarResult> {
	try {
		// Verify authentication
		const user = await getAuthenticatedUser()
		if (!user) {
			return { success: false, error: 'Authentication required. Please sign in to upload media.' }
		}

		// Extract file from FormData
		const file = formData.get('file') as File | null
		const mediaType = formData.get('mediaType') as string | null

		if (!file) {
			return { success: false, error: 'No file provided' }
		}

		// Validate file
		const validation = validateMediaFile(file)
		if (!validation.valid) {
			return { success: false, error: validation.error }
		}

		// Sanitize and create alt text
		const sanitizedMediaType = mediaType ? sanitizeName(mediaType) : 'media'
		const alt = `Message ${sanitizedMediaType}`

		// Upload to PocketBase
		const imageService = createImageService(pb)
		const record = await imageService.uploadImage(file, alt)
		const url = imageService.getImageUrl(record)

		return { success: true, url, recordId: record.id }
	} catch (error) {
		console.error('Media upload error:', error)

		if (error instanceof Error) {
			if (error.message.includes('unauthorized') || error.message.includes('403')) {
				return { success: false, error: 'Unauthorized. Please make sure you are logged in.' }
			}
		}

		return { success: false, error: 'Failed to upload media. Please try again.' }
	}
}
