/**
 * Image Service
 * Handles image uploads to PocketBase
 */

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
	async uploadImage(file: File, alt?: string): Promise<ImageRecord> {
		const authModel = pb.authStore.model

		const formData = new FormData()
		formData.append('image', file)
		formData.append('alt', alt || file.name)

		if (authModel?.id) {
			formData.append('uploader', authModel.id)
		}

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
