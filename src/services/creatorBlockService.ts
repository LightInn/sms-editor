/**
 * Service for managing creator blocks
 * Handles CRUD operations for the c_blocks collection
 */

import { pbFileUrl } from '@/lib/cover-url'
import { pb } from '@/lib/pocketbase'
import type {
	BlockWithExpand,
	CreateBlockData,
	CreatorBlock,
	MediaContent,
	Message,
	Participant,
	RecoveredConversationData,
	RichTextContent,
	SMSContent,
	UpdateBlockData,
} from '../types/creator-stories'
import { getParticipantGroupKey } from '../types/creator-stories'

export class CreatorBlockService {
	private collectionName = 'c_blocks'

	/**
	 * Create a new block
	 */
	async createBlock(data: CreateBlockData): Promise<CreatorBlock> {
		const record = await pb.collection(this.collectionName).create<CreatorBlock>({
			chapter: data.chapter,
			type: data.type,
			order: data.order,
			title: data.title || null,
			content: data.content,
			conversationType: data.conversationType || null,
			conversationTitle: data.conversationTitle || null,
			conversationAvatar: data.conversationAvatar || null,
			participants: data.participants || null,
			appTarget: data.appTarget || null,
			media: data.media || null,
		})

		return record
	}

	/**
	 * Update an existing block
	 */
	async updateBlock(id: string, data: UpdateBlockData): Promise<CreatorBlock> {
		const updateData: Record<string, unknown> = {}

		if (data.type !== undefined) updateData.type = data.type
		if (data.order !== undefined) updateData.order = data.order
		if (data.title !== undefined) updateData.title = data.title || null
		if (data.content !== undefined) updateData.content = data.content
		if (data.conversationType !== undefined) updateData.conversationType = data.conversationType || null
		if (data.conversationTitle !== undefined) updateData.conversationTitle = data.conversationTitle || null
		if (data.conversationAvatar !== undefined) updateData.conversationAvatar = data.conversationAvatar || null
		if (data.participants !== undefined) updateData.participants = data.participants || null
		if (data.appTarget !== undefined) updateData.appTarget = data.appTarget || null
		if (data.media !== undefined) updateData.media = data.media || null

		const record = await pb.collection(this.collectionName).update<CreatorBlock>(id, updateData)

		return record
	}

	/**
	 * Get a block by ID
	 */
	async getBlock(id: string, expand = false): Promise<BlockWithExpand> {
		// Always expand conversationAvatar and media, optionally expand chapter
		const expandParam = expand ? 'chapter,conversationAvatar,media' : 'conversationAvatar,media'

		const record = await pb.collection(this.collectionName).getOne<BlockWithExpand>(id, {
			expand: expandParam,
		})

		return record
	}

	/**
	 * Get all blocks for a chapter
	 */
	async getChapterBlocks(chapterId: string): Promise<CreatorBlock[]> {
		const records = await pb.collection(this.collectionName).getFullList<CreatorBlock>({
			filter: `chapter="${chapterId}"`,
			sort: 'order',
			expand: 'conversationAvatar,media', // Load conversation avatar and media images
		})

		return records
	}

	/**
	 * Delete a block
	 */
	async deleteBlock(id: string): Promise<boolean> {
		await pb.collection(this.collectionName).delete(id)
		return true
	}

	/**
	 * Reorder blocks
	 */
	async reorderBlocks(blockIds: string[]): Promise<CreatorBlock[]> {
		const updates = blockIds.map((id, index) => this.updateBlock(id, { order: index }))

		const results = await Promise.all(updates)
		return results
	}

	// ============================================================================
	// SMS BLOCK SPECIFIC METHODS
	// ============================================================================

	/**
	 * Add a message to an SMS block
	 */
	async addMessage(blockId: string, message: Message): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot add message to non-SMS block')
		}

		const content = block.content as SMSContent
		const messages = [...(content.messages || []), message]

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	/**
	 * Update a message in an SMS block
	 */
	async updateMessage(blockId: string, messageId: string, data: Partial<Message>): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot update message in non-SMS block')
		}

		const content = block.content as SMSContent
		const messages = content.messages.map(msg => (msg.id === messageId ? { ...msg, ...data } : msg))

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	/**
	 * Delete a message from an SMS block
	 */
	async deleteMessage(blockId: string, messageId: string): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot delete message from non-SMS block')
		}

		const content = block.content as SMSContent
		const messages = content.messages.filter(msg => msg.id !== messageId)

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	/**
	 * Insert a message at a specific position
	 */
	async insertMessage(blockId: string, message: Message, position: number): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot insert message in non-SMS block')
		}

		const content = block.content as SMSContent
		const messages = [...content.messages]
		messages.splice(position, 0, message)

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	/**
	 * Reorder messages in an SMS block
	 */
	async reorderMessages(blockId: string, messageIds: string[]): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot reorder messages in non-SMS block')
		}

		const content = block.content as SMSContent
		const messages = messageIds
			.map(id => content.messages.find(msg => msg.id === id))
			.filter((msg): msg is Message => msg !== undefined)

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	/**
	 * Bulk update messages
	 */
	async bulkUpdateMessages(blockId: string, messages: Message[]): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'sms_conversation') {
			throw new Error('Cannot update messages in non-SMS block')
		}

		return this.updateBlock(blockId, {
			content: { messages },
		})
	}

	// ============================================================================
	// RICH TEXT BLOCK SPECIFIC METHODS
	// ============================================================================

	/**
	 * Update rich text content
	 */
	async updateRichTextContent(blockId: string, htmlContent: string): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'rich_text_content') {
			throw new Error('Cannot update rich text content for non-rich-text block')
		}

		// Note: PocketBase uses 'plateJson' field name (legacy from Plate.js)
		return this.updateBlock(blockId, {
			content: { plateJson: htmlContent },
		})
	}

	// ============================================================================
	// MEDIA BLOCK SPECIFIC METHODS
	// ============================================================================

	/**
	 * Update media content
	 */
	async updateMediaContent(blockId: string, mediaData: MediaContent): Promise<CreatorBlock> {
		const block = await this.getBlock(blockId)

		if (block.type !== 'media_content') {
			throw new Error('Cannot update media content for non-media block')
		}

		return this.updateBlock(blockId, {
			content: mediaData,
		})
	}

	// ============================================================================
	// CONVERSATION AUTO-RECOVERY METHODS
	// ============================================================================

	/**
	 * Find previous conversation data (title, avatar) for the same participants
	 * Returns data from the most recent conversation with matching participants
	 * Excludes the current block from search
	 */
	async findPreviousConversationData(
		participants: Participant[],
		currentBlockId: string,
		storyId: string
	): Promise<RecoveredConversationData | null> {
		// Need at least 2 participants to match
		if (!participants || participants.length < 2) {
			return null
		}

		try {
			// Get the participant group key for matching
			const participantKey = getParticipantGroupKey(participants)

			// Get all SMS blocks from this story, excluding current block
			// We need to fetch all blocks because PocketBase doesn't support JSON array matching in filters
			const allBlocks = await pb.collection(this.collectionName).getFullList<BlockWithExpand>({
				filter: `type="sms_conversation" && chapter.story="${storyId}" && id!="${currentBlockId}"`,
				sort: '-updated', // Most recent first
				expand: 'conversationAvatar,chapter',
			})

			// Filter blocks with matching participants (client-side)
			const matchingBlocks = allBlocks.filter(block => {
				if (!block.participants || block.participants.length < 2) return false

				// Compare participant group keys
				const blockKey = getParticipantGroupKey(block.participants)
				return blockKey === participantKey
			})

			// If no matching blocks found, return null
			if (matchingBlocks.length === 0) {
				return null
			}

			// Get the most recent matching block (already sorted by -updated)
			const mostRecentBlock = matchingBlocks[0]

			// Only return data if there's actually something to recover
			if (!mostRecentBlock.conversationTitle && !mostRecentBlock.conversationAvatar) {
				return null
			}

			// Extract avatar URL from expand data if available
			let avatarUrl: string | null = null
			if (mostRecentBlock.conversationAvatar && mostRecentBlock.expand?.conversationAvatar) {
				const imageRecord = mostRecentBlock.expand.conversationAvatar
				avatarUrl = pbFileUrl({ id: imageRecord.id, collectionName: 'images' }, imageRecord.image, {
					thumb: '300x300',
				})
			}

			// Return the recovered data
			return {
				conversationTitle: mostRecentBlock.conversationTitle || null,
				conversationAvatar: mostRecentBlock.conversationAvatar || null,
				conversationAvatarUrl: avatarUrl,
				sourceBlockId: mostRecentBlock.id,
				sourceBlockTitle: mostRecentBlock.title,
			}
		} catch (error) {
			console.error('[CreatorBlockService] Error finding previous conversation data:', error)
			return null
		}
	}

	// ============================================================================
	// HELPER METHODS
	// ============================================================================

	/**
	 * Get the next order number for a new block in a chapter
	 */
	async getNextOrder(chapterId: string): Promise<number> {
		const blocks = await this.getChapterBlocks(chapterId)

		if (blocks.length === 0) return 0

		const maxOrder = Math.max(...blocks.map(bl => bl.order))
		return maxOrder + 1
	}

	/**
	 * Duplicate a block
	 */
	async duplicateBlock(blockId: string): Promise<CreatorBlock> {
		const original = await this.getBlock(blockId)
		const nextOrder = await this.getNextOrder(original.chapter)

		const duplicateData: CreateBlockData = {
			chapter: original.chapter,
			type: original.type,
			order: nextOrder,
			title: original.title ? `${original.title} (copy)` : null,
			content: JSON.parse(JSON.stringify(original.content)), // Deep copy
			conversationType: original.conversationType,
			conversationTitle: original.conversationTitle,
			conversationAvatar: original.conversationAvatar,
			participants: original.participants ? [...original.participants] : null,
			appTarget: original.appTarget,
			media: original.media,
		}

		return this.createBlock(duplicateData)
	}

	/**
	 * Get block count for a chapter
	 */
	async getBlockCount(chapterId: string): Promise<number> {
		const result = await pb.collection(this.collectionName).getList(1, 1, {
			filter: `chapter="${chapterId}"`,
		})

		return result.totalItems
	}

	/**
	 * Move block to a different position
	 */
	async moveBlock(blockId: string, newOrder: number): Promise<CreatorBlock[]> {
		const block = await this.getBlock(blockId)
		const allBlocks = await this.getChapterBlocks(block.chapter)

		// Remove the block from its current position
		const otherBlocks = allBlocks.filter(bl => bl.id !== blockId)

		// Insert it at the new position
		otherBlocks.splice(newOrder, 0, block)

		// Update all blocks with new order
		const blockIds = otherBlocks.map(bl => bl.id)
		return this.reorderBlocks(blockIds)
	}

	/**
	 * Get SMS content safely
	 */
	getSMSContent(block: CreatorBlock): SMSContent | null {
		if (block.type !== 'sms_conversation') return null
		return block.content as SMSContent
	}

	/**
	 * Get rich text content safely
	 */
	getRichTextContent(block: CreatorBlock): RichTextContent | null {
		if (block.type !== 'rich_text_content') return null
		return block.content as RichTextContent
	}

	/**
	 * Get media content safely
	 */
	getMediaContent(block: CreatorBlock): MediaContent | null {
		if (block.type !== 'media_content') return null
		return block.content as MediaContent
	}

	/**
	 * Validate block data before save
	 */
	validateBlock(data: CreateBlockData | UpdateBlockData): {
		valid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		// Type-specific validation
		if ('type' in data && data.type === 'sms_conversation') {
			if (!data.conversationType) {
				errors.push('conversationType is required for SMS blocks')
			}
			if (!data.participants || data.participants.length < 2) {
				errors.push('At least 2 participants required for SMS blocks')
			}
			if (!data.appTarget) {
				errors.push('appTarget is required for SMS blocks')
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}
}

// Export a singleton instance
export const creatorBlockService = new CreatorBlockService()
