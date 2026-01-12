/**
 * Constants for the Creator Stories system
 * Centralized location for all shared constants
 */

import type { AppTarget, BlockType, ConversationType, MessageType } from '../types/creator-stories'

// ============================================================================
// MESSAGE & BLOCK TYPES
// ============================================================================

export const MESSAGE_TYPES: MessageType[] = ['text', 'image', 'video', 'audio', 'location', 'sticker', 'gif']

export const BLOCK_TYPES: BlockType[] = ['sms_conversation', 'rich_text_content', 'media_content']

export const CONVERSATION_TYPES: ConversationType[] = ['duo', 'group']

// ============================================================================
// APP TARGETS
// ============================================================================

export const APP_TARGETS: AppTarget[] = [
	'imessage',
	'whatsapp',
	'instagram',
	'snapchat',
	'google_messages',
	'facebook_messenger',
]

// Alias for easier imports
export const appTargets = APP_TARGETS

// ============================================================================
// APP TEMPLATE STYLES
// ============================================================================

export interface AppStyles {
	bubbleLeft: string // Tailwind classes
	bubbleRight: string
	background: string
	font: string
	headerBg?: string
	headerText?: string
}

export const appTemplates: Record<AppTarget, AppStyles> = {
	imessage: {
		bubbleLeft: 'bg-gray-200 text-black',
		bubbleRight: 'bg-blue-500 text-white',
		background: 'bg-white',
		font: 'font-sans',
		headerBg: 'bg-gray-100',
		headerText: 'text-black',
	},
	whatsapp: {
		bubbleLeft: 'bg-white text-black border border-gray-200',
		bubbleRight: 'bg-green-500 text-white',
		background: 'bg-[#ECE5DD]',
		font: 'font-sans',
		headerBg: 'bg-[#075E54]',
		headerText: 'text-white',
	},
	instagram: {
		bubbleLeft: 'bg-gray-100 text-black',
		bubbleRight: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
		background: 'bg-white',
		font: 'font-sans',
		headerBg: 'bg-gradient-to-r from-purple-600 to-pink-600',
		headerText: 'text-white',
	},
	snapchat: {
		bubbleLeft: 'bg-white text-black',
		bubbleRight: 'bg-purple-500 text-white',
		background: 'bg-yellow-50',
		font: 'font-sans',
		headerBg: 'bg-yellow-400',
		headerText: 'text-black',
	},
	google_messages: {
		bubbleLeft: 'bg-gray-200 text-black',
		bubbleRight: 'bg-blue-600 text-white',
		background: 'bg-white',
		font: 'font-sans',
		headerBg: 'bg-blue-600',
		headerText: 'text-white',
	},
	facebook_messenger: {
		bubbleLeft: 'bg-gray-200 text-black',
		bubbleRight: 'bg-blue-500 text-white',
		background: 'bg-white',
		font: 'font-sans',
		headerBg: 'bg-blue-600',
		headerText: 'text-white',
	},
}

// ============================================================================
// AVATAR COLORS
// ============================================================================

// Predefined color palette for avatars (matching CharacterAvatar component)
export const AVATAR_COLORS = [
	'#FF6B6B', // Red
	'#4ECDC4', // Teal
	'#45B7D1', // Blue
	'#FFA07A', // Light Salmon
	'#98D8C8', // Mint
	'#F7DC6F', // Yellow
	'#BB8FCE', // Purple
	'#85C1E2', // Sky Blue
	'#F8B739', // Orange
	'#52BE80', // Green
	'#EC7063', // Coral
	'#5DADE2', // Light Blue
]

/**
 * Get a consistent color from an ID (for avatar backgrounds)
 */
export function getColorFromId(id: string): string {
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
		hash = hash & hash // Convert to 32-bit integer
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length
	return AVATAR_COLORS[index]
}

// ============================================================================
// EXPORT CONSTANTS
// ============================================================================

export const EXPORT_IMG_WIDTH = 430
export const EXPORT_IMG_HEIGHT = 760
