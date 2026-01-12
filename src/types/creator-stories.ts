/**
 * Types for the Creator Stories system
 * This is for user-generated stories via SMS conversations
 * Separate from the Reddit stories (Story/Chapter types in models/index.ts)
 */

// ============================================================================
// CHARACTER TYPES
// ============================================================================

export interface Character {
	id: string // UUID
	firstName: string
	lastName: string
	avatar: string | null // URL or file path
}

// ============================================================================
// STORY TYPES
// ============================================================================

export interface CreatorStory {
	id: string // PocketBase ID
	title: string
	description: string // Rich text HTML
	categories: string[] // Tags/categories
	characters: Character[]
	likes: number
	author: string // User ID (relation)
	chapters: string[] // Chapter IDs (relation)
	coverImage: string | null // Image record ID (relation to images collection)
	isPublished: boolean
	isCompleted: boolean
	nsfw: boolean // NSFW content flag (default: true for this project)
	slug: string // URL-friendly unique identifier
	created: string // ISO 8601
	updated: string // ISO 8601
}

export interface CreateStoryData {
	title: string
	description?: string
	categories?: string[]
	characters?: Character[]
	slug: string
	coverImage?: string | null // Image record ID from images collection (relation)
	nsfw?: boolean // NSFW content flag (default: true)
}

export interface UpdateStoryData {
	title?: string
	description?: string
	categories?: string[]
	characters?: Character[]
	coverImage?: string | null // Image record ID from images collection (relation)
	isPublished?: boolean
	isCompleted?: boolean
	nsfw?: boolean // NSFW content flag
	slug?: string
}

// ============================================================================
// CHAPTER TYPES (Containers)
// ============================================================================

/**
 * Chapter - A container/section that groups multiple blocks
 * Chapters organize content blocks and maintain their order
 */
export interface CreatorChapter {
	id: string // PocketBase ID
	story: string // Story ID (relation to c_stories)
	title: string // Chapter title
	order: number // Display order within story (0-indexed)
	programed: string | null // Scheduled publication date (ISO 8601). Null = publish immediately
	isPublished: boolean // Whether the chapter is published (visible to readers)
	coverImage: string | null // Image record ID (relation to images collection)
	created: string // ISO 8601
	updated: string // ISO 8601
}

export interface CreateChapterData {
	story: string
	title: string
	order: number
	programed?: string | null // Scheduled publication date (ISO 8601)
	isPublished?: boolean // Whether the chapter is published (default: false)
	coverImage?: string | null // Image record ID (relation to images collection)
}

export interface UpdateChapterData {
	title?: string
	order?: number
	programed?: string | null // Scheduled publication date (ISO 8601)
	isPublished?: boolean // Whether the chapter is published
	coverImage?: string | null // Image record ID (relation to images collection)
}

// ============================================================================
// BLOCK TYPES (Content)
// ============================================================================

export type BlockType = 'sms_conversation' | 'rich_text_content' | 'media_content'
export type ConversationType = 'duo' | 'group'
export type AppTarget = 'imessage' | 'whatsapp' | 'instagram' | 'snapchat' | 'google_messages' | 'facebook_messenger'

export interface Participant {
	characterId: string // Reference to Character.id
	customName: string | null // Custom nickname in this conversation
	position?: 'left' | 'right' // For duo conversations only
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker' | 'gif'

export interface Message {
	id: string // UUID
	senderId: string // Character ID
	timestamp: string // ISO 8601
	type: MessageType
	content: string // Text or URL for media
	position: 'left' | 'right'
	dayBreak: boolean // If true, show date separator
	dateLabel?: string // Date label if dayBreak is true
}

export interface SMSContent {
	messages: Message[]
}

export interface RichTextContent {
	plateJson: string // HTML content from Tiptap editor (field name kept for PocketBase compatibility)
}

export interface MediaContent {
	mediaUrl?: string // @deprecated - Use media relation instead. Kept for backward compatibility
	mediaAlt: string // Alt text for image or video title
	mediaType: 'image' | 'video' // Type of media
}

/**
 * Block - A content element within a chapter
 * Blocks contain the actual content (SMS, text, media)
 */
export interface CreatorBlock {
	id: string // PocketBase ID
	chapter: string // Chapter ID (relation to c_chapters)
	type: BlockType
	order: number // Display order within chapter (0-indexed)
	title: string | null
	content: SMSContent | RichTextContent | MediaContent
	conversationType: ConversationType | null // For SMS only
	conversationTitle?: string | null // Custom conversation title for SMS
	conversationAvatar?: string | null // Image record ID (relation to images collection)
	participants: Participant[] | null // For SMS only
	appTarget: AppTarget | null // For SMS only
	media?: string | null // Image record ID (relation to images collection) - For media_content blocks
	messages?: Message[] // Shorthand for (content as SMSContent).messages
	created: string // ISO 8601
	updated: string // ISO 8601
}

export interface CreateBlockData {
	chapter: string
	type: BlockType
	order: number
	title?: string
	content: SMSContent | RichTextContent | MediaContent
	conversationType?: ConversationType
	conversationTitle?: string
	conversationAvatar?: string
	participants?: Participant[]
	appTarget?: AppTarget
	media?: string // Image record ID for media_content blocks
}

export interface UpdateBlockData {
	type?: BlockType
	order?: number
	title?: string
	content?: SMSContent | RichTextContent | MediaContent
	conversationType?: ConversationType
	conversationTitle?: string
	conversationAvatar?: string
	participants?: Participant[]
	appTarget?: AppTarget
	media?: string // Image record ID for media_content blocks
}

// ============================================================================
// AUTO-RECOVERY TYPES
// ============================================================================

/**
 * Data recovered from a previous conversation with the same participants
 */
export interface RecoveredConversationData {
	conversationTitle: string | null
	conversationAvatar: string | null // Image record ID
	conversationAvatarUrl?: string | null // URL for display (from expand)
	sourceBlockId: string // ID of the block this data came from
	sourceBlockTitle: string | null // Title of the source block for display
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface StoryWithExpand extends CreatorStory {
	expand?: {
		author?: {
			id: string
			name: string
			email: string
			emailVerified: boolean
			subscribestar?: string
			[key: string]: unknown
		}
		chapters?: CreatorChapter[]
		coverImage?: {
			id: string
			image: string
			alt: string
			created: string
			updated: string
		}
	}
}

export interface ChapterWithExpand extends CreatorChapter {
	expand?: {
		story?: CreatorStory
		blocks?: CreatorBlock[]
		coverImage?: {
			id: string
			image: string
			alt: string
			created: string
			updated: string
		}
	}
}

export interface BlockWithExpand extends CreatorBlock {
	expand?: {
		chapter?: CreatorChapter
		conversationAvatar?: {
			id: string
			image: string
			alt: string
			created: string
			updated: string
		}
		media?: {
			id: string
			image: string
			alt: string
			created: string
			updated: string
		}
	}
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface CharacterFormData {
	firstName: string
	lastName: string
	avatar: File | null
}

export interface StoryFormData {
	title: string
	description: string
	categories: string[]
	characters: Character[]
	slug: string
	coverImage: File | null
}

export interface ChapterFormData {
	title: string
}

export interface SMSBlockFormData {
	title: string
	conversationType: ConversationType
	participants: Participant[]
	appTarget: AppTarget
	conversationTitle?: string
}

export interface RichTextBlockFormData {
	title: string
}

export interface MediaBlockFormData {
	title: string
	mediaType: 'image' | 'video'
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const isSSMContent = (content: SMSContent | RichTextContent | MediaContent): content is SMSContent => {
	return 'messages' in content
}

export const isRichTextContent = (content: SMSContent | RichTextContent | MediaContent): content is RichTextContent => {
	return 'plateJson' in content
}

export const isMediaContent = (content: SMSContent | RichTextContent | MediaContent): content is MediaContent => {
	return 'mediaUrl' in content && 'mediaType' in content
}

export const isSMSBlock = (block: CreatorBlock): boolean => {
	return block.type === 'sms_conversation'
}

export const isRichTextBlock = (block: CreatorBlock): boolean => {
	return block.type === 'rich_text_content'
}

export const isMediaBlock = (block: CreatorBlock): boolean => {
	return block.type === 'media_content'
}

// ============================================================================
// APP TEMPLATE TYPES & CONSTANTS (re-exported from constants for backwards compatibility)
// ============================================================================

export type { AppStyles } from '../constants/creator-stories'
export {
	APP_TARGETS,
	appTargets,
	appTemplates,
	BLOCK_TYPES,
	CONVERSATION_TYPES,
	MESSAGE_TYPES,
} from '../constants/creator-stories'

// ============================================================================
// COMPATIBILITY ALIASES (for gradual migration)
// ============================================================================

/**
 * @deprecated Use BlockType instead. ChapterType is now BlockType.
 */
export type ChapterType = BlockType

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a slug from a title
 */
export const generateSlug = (title: string): string => {
	return title
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(/[^a-z0-9\s-]/g, '') // Remove special chars
		.trim()
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Remove consecutive hyphens
}

/**
 * Get conversation title from participants
 */
export const getConversationTitle = (
	participants: Participant[],
	characters: Character[],
	conversationTitle?: string | null
): string => {
	if (conversationTitle) return conversationTitle

	const participantNames = participants
		.map(p => {
			const char = characters.find(c => c.id === p.characterId)
			return char ? char.firstName : 'Unknown'
		})
		.join(', ')

	return participantNames || 'Conversation'
}

/**
 * Get character by ID
 */
export const getCharacterById = (characterId: string, characters: Character[]): Character | undefined => {
	return characters.find(c => c.id === characterId)
}

/**
 * Get participant display name
 */
export const getParticipantName = (participant: Participant, characters: Character[]): string => {
	if (participant.customName) return participant.customName
	const char = getCharacterById(participant.characterId, characters)
	return char ? `${char.firstName} ${char.lastName}` : 'Unknown'
}

/**
 * Validate character IDs in participants
 */
export const validateParticipants = (participants: Participant[], characters: Character[]): boolean => {
	const characterIds = characters.map(c => c.id)
	return participants.every(p => characterIds.includes(p.characterId))
}

/**
 * Get a unique key for a group of participants (for matching conversations)
 * The key is stable regardless of the order in which participants are added
 */
export const getParticipantGroupKey = (participants: Participant[]): string => {
	// Sort participant IDs to create a stable key
	const sortedIds = participants
		.map(p => p.characterId)
		.sort()
		.join('|')
	return sortedIds
}
