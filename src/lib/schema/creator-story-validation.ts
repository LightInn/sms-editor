/**
 * Validation schemas for creator stories using Valibot
 * (Following the project's existing use of Valibot instead of Zod)
 */

import * as v from 'valibot'
import type { ChapterType, ConversationType, MessageType } from '../../types/creator-stories'

// ============================================================================
// CHARACTER SCHEMA
// ============================================================================

export const characterSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1, 'Character ID required')),
	firstName: v.pipe(
		v.string(),
		v.minLength(2, 'First name must be at least 2 characters'),
		v.maxLength(100, 'First name must be less than 100 characters'),
		v.regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'First name contains invalid characters')
	),
	lastName: v.pipe(
		v.string(),
		v.minLength(2, 'Last name must be at least 2 characters'),
		v.maxLength(100, 'Last name must be less than 100 characters'),
		v.regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Last name contains invalid characters')
	),
	avatar: v.nullable(v.pipe(v.string(), v.maxLength(2048, 'Avatar URL too long'))),
})

export type CharacterSchema = v.InferOutput<typeof characterSchema>

// ============================================================================
// STORY SCHEMAS
// ============================================================================

export const createStorySchema = v.object({
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Title required'),
		v.maxLength(200, 'Title must be less than 200 characters'),
		v.regex(/^[^<>]*$/, 'Title contains invalid characters')
	),
	description: v.optional(v.pipe(v.string(), v.maxLength(5000, 'Description must be less than 5000 characters'))),
	categories: v.optional(
		v.pipe(
			v.array(
				v.pipe(
					v.string(),
					v.minLength(2, 'Category must be at least 2 characters'),
					v.maxLength(50, 'Category must be less than 50 characters'),
					v.regex(/^[a-z0-9-]+$/, 'Category must contain only lowercase letters, numbers, and hyphens')
				)
			),
			v.maxLength(20, 'Maximum 20 categories allowed')
		)
	),
	characters: v.optional(v.pipe(v.array(characterSchema), v.maxLength(50, 'Maximum 50 characters allowed'))),
	slug: v.pipe(
		v.string(),
		v.minLength(1, 'Slug required'),
		v.maxLength(200, 'Slug must be less than 200 characters'),
		v.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
		v.regex(/^[^-].*[^-]$|^[^-]$/, 'Slug cannot start or end with a hyphen')
	),
	coverImage: v.optional(v.nullable(v.any())), // File type
})

export type CreateStorySchema = v.InferOutput<typeof createStorySchema>

export const updateStorySchema = v.object({
	title: v.optional(
		v.pipe(v.string(), v.minLength(1, 'Title required'), v.maxLength(200, 'Title must be less than 200 characters'))
	),
	description: v.optional(v.string()),
	categories: v.optional(v.array(v.string())),
	characters: v.optional(v.array(characterSchema)),
	slug: v.optional(
		v.pipe(
			v.string(),
			v.minLength(1, 'Slug required'),
			v.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
		)
	),
	coverImage: v.optional(v.nullable(v.any())),
	isPublished: v.optional(v.boolean()),
	isCompleted: v.optional(v.boolean()),
	nsfw: v.optional(v.boolean()),
})

export type UpdateStorySchema = v.InferOutput<typeof updateStorySchema>

// ============================================================================
// PARTICIPANT SCHEMA
// ============================================================================

export const participantSchema = v.object({
	characterId: v.pipe(v.string(), v.minLength(1, 'Character ID required')),
	customName: v.optional(v.nullable(v.string())),
	position: v.optional(v.picklist(['left', 'right'])),
})

export type ParticipantSchema = v.InferOutput<typeof participantSchema>

// ============================================================================
// MESSAGE SCHEMA
// ============================================================================

const messageTypeOptions: MessageType[] = ['text', 'image', 'video', 'audio', 'location', 'sticker', 'gif']

export const messageSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1, 'Message ID required')),
	senderId: v.pipe(v.string(), v.minLength(1, 'Sender ID required')),
	timestamp: v.pipe(v.string(), v.minLength(1, 'Timestamp required')),
	type: v.picklist(messageTypeOptions, 'Invalid message type'),
	content: v.pipe(v.string(), v.minLength(1, 'Content required')),
	position: v.picklist(['left', 'right']),
	dayBreak: v.boolean(),
	dateLabel: v.optional(v.string()),
})

export type MessageSchema = v.InferOutput<typeof messageSchema>

// ============================================================================
// CHAPTER SCHEMAS
// ============================================================================

const chapterTypeOptions: ChapterType[] = ['sms_conversation', 'rich_text_content', 'media_content']
const conversationTypeOptions: ConversationType[] = ['duo', 'group']

export const smsContentSchema = v.object({
	messages: v.array(messageSchema),
})

export const richTextContentSchema = v.object({
	plateJson: v.string(), // HTML content from Tiptap editor (field name kept for PocketBase compatibility)
})

export const mediaContentSchema = v.object({
	mediaUrl: v.pipe(v.string(), v.minLength(1, 'Media URL required')),
	mediaAlt: v.pipe(v.string(), v.minLength(1, 'Media alt text required')),
	mediaType: v.picklist(['image', 'video'], 'Invalid media type'),
})

export const createSMSChapterSchema = v.object({
	story: v.pipe(v.string(), v.minLength(1, 'Story ID required')),
	type: v.literal('sms_conversation'),
	order: v.pipe(v.number(), v.minValue(0, 'Order must be 0 or greater')),
	title: v.optional(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters'))),
	content: smsContentSchema,
	conversationType: v.picklist(conversationTypeOptions, 'Invalid conversation type'),
	participants: v.pipe(v.array(participantSchema), v.minLength(2, 'At least 2 participants required')),
	appTarget: v.picklist(
		['imessage', 'whatsapp', 'instagram', 'snapchat', 'google_messages', 'facebook_messenger'],
		'Invalid app target'
	),
	groupName: v.optional(v.string()),
})

export type CreateSMSChapterSchema = v.InferOutput<typeof createSMSChapterSchema>

export const createRichTextChapterSchema = v.object({
	story: v.pipe(v.string(), v.minLength(1, 'Story ID required')),
	type: v.literal('rich_text_content'),
	order: v.pipe(v.number(), v.minValue(0, 'Order must be 0 or greater')),
	title: v.optional(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters'))),
	content: richTextContentSchema,
})

export type CreateRichTextChapterSchema = v.InferOutput<typeof createRichTextChapterSchema>

export const createMediaChapterSchema = v.object({
	story: v.pipe(v.string(), v.minLength(1, 'Story ID required')),
	type: v.literal('media_content'),
	order: v.pipe(v.number(), v.minValue(0, 'Order must be 0 or greater')),
	title: v.optional(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters'))),
	content: mediaContentSchema,
})

export type CreateMediaChapterSchema = v.InferOutput<typeof createMediaChapterSchema>

export const updateChapterSchema = v.object({
	type: v.optional(v.picklist(chapterTypeOptions)),
	order: v.optional(v.pipe(v.number(), v.minValue(0, 'Order must be 0 or greater'))),
	title: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters')))),
	content: v.optional(v.union([smsContentSchema, richTextContentSchema, mediaContentSchema])),
	conversationType: v.optional(v.nullable(v.picklist(conversationTypeOptions))),
	participants: v.optional(v.nullable(v.array(participantSchema))),
	appTarget: v.optional(
		v.nullable(v.picklist(['imessage', 'whatsapp', 'instagram', 'snapchat', 'google_messages', 'facebook_messenger']))
	),
	groupName: v.optional(v.nullable(v.string())),
})

export type UpdateChapterSchema = v.InferOutput<typeof updateChapterSchema>

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const characterFormSchema = v.object({
	firstName: v.pipe(
		v.string(),
		v.minLength(2, 'First name must be at least 2 characters'),
		v.maxLength(100, 'First name must be less than 100 characters'),
		v.regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'First name contains invalid characters')
	),
	lastName: v.pipe(
		v.string(),
		v.minLength(2, 'Last name must be at least 2 characters'),
		v.maxLength(100, 'Last name must be less than 100 characters'),
		v.regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Last name contains invalid characters')
	),
	avatar: v.optional(v.nullable(v.any())),
})

export type CharacterFormSchema = v.InferOutput<typeof characterFormSchema>

export const storyFormSchema = v.object({
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Title required'),
		v.maxLength(200, 'Title must be less than 200 characters')
	),
	description: v.optional(v.string()),
	categories: v.array(v.string()),
	characters: v.array(characterSchema),
	slug: v.pipe(
		v.string(),
		v.minLength(1, 'Slug required'),
		v.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
	),
	coverImage: v.optional(v.nullable(v.any())),
})

export type StoryFormSchema = v.InferOutput<typeof storyFormSchema>

export const smsChapterFormSchema = v.object({
	title: v.optional(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters'))),
	conversationType: v.picklist(conversationTypeOptions, 'Conversation type required'),
	participants: v.pipe(v.array(participantSchema), v.minLength(2, 'At least 2 participants required')),
	appTarget: v.picklist(
		['imessage', 'whatsapp', 'instagram', 'snapchat', 'google_messages', 'facebook_messenger'],
		'App target required'
	),
	groupName: v.optional(v.string()),
})

export type SMSChapterFormSchema = v.InferOutput<typeof smsChapterFormSchema>

export const richTextChapterFormSchema = v.object({
	title: v.optional(v.pipe(v.string(), v.maxLength(200, 'Title must be less than 200 characters'))),
})

export type RichTextChapterFormSchema = v.InferOutput<typeof richTextChapterFormSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that all participant character IDs exist in the story characters
 */
export const validateParticipantCharacterIds = (
	participants: ParticipantSchema[],
	storyCharacterIds: string[]
): { valid: boolean; errors: string[] } => {
	const errors: string[] = []

	for (const participant of participants) {
		if (!storyCharacterIds.includes(participant.characterId)) {
			errors.push(`Character ID ${participant.characterId} does not exist in story`)
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Validate slug format and uniqueness
 */
export const validateSlug = (slug: string): { valid: boolean; error?: string } => {
	if (!slug || slug.length === 0) {
		return { valid: false, error: 'Slug is required' }
	}

	if (!/^[a-z0-9-]+$/.test(slug)) {
		return {
			valid: false,
			error: 'Slug must contain only lowercase letters, numbers, and hyphens',
		}
	}

	if (slug.startsWith('-') || slug.endsWith('-')) {
		return {
			valid: false,
			error: 'Slug cannot start or end with a hyphen',
		}
	}

	if (slug.includes('--')) {
		return {
			valid: false,
			error: 'Slug cannot contain consecutive hyphens',
		}
	}

	return { valid: true }
}

/**
 * Safe parse with type inference
 */
export const safeParse = <T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
	schema: T,
	data: unknown
): {
	success: boolean
	data?: v.InferOutput<T>
	errors?: string[]
} => {
	try {
		const result = v.parse(schema, data)
		return {
			success: true,
			data: result,
		}
	} catch (error) {
		if (error instanceof v.ValiError) {
			const errors = error.issues.map(issue => {
				const path = issue.path?.map(p => p.key).join('.') || 'unknown'
				return `${path}: ${issue.message}`
			})
			return {
				success: false,
				errors,
			}
		}
		return {
			success: false,
			errors: ['Unknown validation error'],
		}
	}
}
