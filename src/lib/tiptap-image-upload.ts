/**
 * Tiptap Image Upload Utility
 * Integrates PocketBase ImageService with Tiptap editor
 */

import { ImageService } from '../services/imageService'

/**
 * Upload an image file and return the URL for Tiptap
 */
export async function uploadImageForTiptap(file: File): Promise<{ url: string; alt: string }> {
	try {
		// Validate file type
		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
		if (!validTypes.includes(file.type)) {
			throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
		}

		// Validate file size (5MB max)
		const maxSize = 5 * 1024 * 1024 // 5MB
		if (file.size > maxSize) {
			throw new Error('File size exceeds 5MB limit.')
		}

		// Create image service instance
		const imageService = new ImageService()

		// Upload the image
		const record = await imageService.uploadImage(file, file.name)

		// Get the URL
		const url = imageService.getImageUrl(record)

		return {
			url,
			alt: record.alt || file.name,
		}
	} catch (error) {
		console.error('Error uploading image:', error)
		throw error
	}
}

/**
 * Handle multiple files upload
 */
export async function uploadImagesForTiptap(files: File[]): Promise<Array<{ url: string; alt: string }>> {
	const uploadPromises = files.map(file => uploadImageForTiptap(file))
	return await Promise.all(uploadPromises)
}

/**
 * Validate if a file is an image
 */
export function isImageFile(file: File): boolean {
	return file.type.startsWith('image/')
}

/**
 * Filter image files from a list of files
 */
export function filterImageFiles(files: File[]): File[] {
	return files.filter(isImageFile)
}
