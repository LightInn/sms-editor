/**
 * Image Service
 * Handles image uploads to PocketBase
 */

import { applyScreening } from '@sms-editor/lib/media-screening'
import { pb } from '@/lib/pocketbase'

export interface ImageRecord {
	id: string
	image: string
	alt: string
	uploader?: string
	created: string
	updated: string
}

export class ImageService {
	private collectionName = 'images'

	/**
	 * Upload an image to PocketBase
	 */
	/** `uploaderId` comes from the caller's session: server-side `pb` is authenticated as the superuser. */
	async uploadImage(file: File, alt?: string, uploaderId?: string): Promise<ImageRecord> {
		const formData = new FormData()
		formData.append('image', file)
		formData.append('alt', alt || file.name)

		if (uploaderId) {
			formData.append('uploader', uploaderId)
		}

		// Screened before the record exists, not after (M5-T2). Nothing reaches the
		// `images` collection without a review state.
		await applyScreening(formData, file)

		const record = await pb.collection(this.collectionName).create<ImageRecord>(formData)

		return record
	}

	/**
	 * Get an image record by ID
	 */
	async getImage(id: string): Promise<ImageRecord> {
		return await pb.collection(this.collectionName).getOne<ImageRecord>(id)
	}

	/**
	 * Delete an image
	 */
	async deleteImage(id: string): Promise<boolean> {
		await pb.collection(this.collectionName).delete(id)
		return true
	}

	/**
	 * Get the URL for an image
	 */
	getImageUrl(record: ImageRecord, thumb?: '100x100' | '300x300' | '600x600'): string {
		const pbRecord = {
			id: record.id,
			collectionId: this.collectionName,
			collectionName: this.collectionName,
		}
		if (thumb) {
			return pb.files.getURL(pbRecord, record.image, { thumb })
		}
		return pb.files.getURL(pbRecord, record.image)
	}

	/**
	 * Get image URL directly from record ID and filename
	 */
	getImageUrlById(recordId: string, filename: string, thumb?: '100x100' | '300x300' | '600x600'): string {
		const record = { id: recordId, collectionId: this.collectionName, collectionName: this.collectionName }
		if (thumb) {
			return pb.files.getURL(record, filename, { thumb })
		}
		return pb.files.getURL(record, filename)
	}

	/**
	 * Upload an image and return just the URL
	 */
	async uploadAndGetUrl(file: File, alt?: string, thumb?: '100x100' | '300x300' | '600x600'): Promise<string> {
		const record = await this.uploadImage(file, alt)
		return this.getImageUrl(record, thumb)
	}

	/**
	 * Get user's uploaded images
	 */
	async getUserImages(userId?: string, page = 1, perPage = 20): Promise<ImageRecord[]> {
		const authModel = pb.authStore.model
		const targetUserId = userId || authModel?.id

		if (!targetUserId) {
			throw new Error('User ID required')
		}

		const records = await pb.collection(this.collectionName).getList<ImageRecord>(page, perPage, {
			filter: `uploader="${targetUserId}"`,
			sort: '-created',
		})

		return records.items
	}
}
