/**
 * Export Block Renderers
 * Functions that render different block types as ImageResponse
 */

import { EXPORT_IMG_WIDTH } from '@sms-editor/constants/creator-stories'
import { getColorFromClass } from '@sms-editor/lib/color-utils'
import { IMG_HEIGHT, paginateMessages } from '@sms-editor/lib/export-pagination'
import { fetchImageAsBase64, fetchVideoThumbnailAsBase64, generateInitialsAvatar } from '@sms-editor/lib/image-utils'
import type {
	BlockWithExpand,
	Character,
	MediaContent,
	RichTextContent,
	SMSContent,
} from '@sms-editor/types/creator-stories'
import { appTemplates, getConversationTitle } from '@sms-editor/types/creator-stories'
import { ImageResponse } from 'next/og'
import { pb } from '@/lib/pocketbase'
import { MessageBubble, renderStatusBar } from './components'
import { paginateHtml, parseHtmlToSatori } from './html-to-satori'

// ============================================================================
// CONSTANTS
// ============================================================================

const IMG_WIDTH = EXPORT_IMG_WIDTH

// Dark theme colors (from globals.css)
const DARK_THEME = {
	bg: '#12242e',
	card: '#1c2e38',
	border: '#3d5a6e',
	muted: '#24272b',
	primary: '#f4d06f',
	text: '#f8e8e8',
	textMuted: '#d99393',
}

// ============================================================================
// SMS BLOCK RENDERER
// ============================================================================

export async function renderSMSBlock(
	block: BlockWithExpand,
	pageIndex = 0,
	characters: Character[] = []
): Promise<ImageResponse> {
	const content = block.content as SMSContent
	const messages = content?.messages || []
	const participants = block.participants || []

	const appTarget = block.appTarget || 'imessage'
	const styles = appTemplates[appTarget] || appTemplates.imessage
	const bg = getColorFromClass(styles.background || 'bg-white')

	// Pagination
	const messagePages = paginateMessages(messages)
	const pageMessages = messagePages[pageIndex] || []

	console.log(`[Export] SMS pagination: page ${pageIndex + 1}/${messagePages.length}, ${pageMessages.length} messages`)

	// Pre-fetch images
	const imageMap: Record<string, string> = {}
	for (const message of pageMessages) {
		if ((message.type === 'image' || message.type === 'video') && message.content) {
			const isVideo = message.type === 'video'
			const base64 = isVideo
				? await fetchVideoThumbnailAsBase64(message.content)
				: await fetchImageAsBase64(message.content)
			if (base64) imageMap[message.id] = base64
		}
	}

	// Resolve avatar with fallback chain:
	// 1. Custom conversation avatar (from expand)
	// 2. Recipient's character avatar (left position = person being messaged)
	// 3. Generated initials avatar
	let avatarSrc: string | null = null

	// Try custom conversation avatar first
	if (block.expand?.conversationAvatar) {
		const avatarRecord = block.expand.conversationAvatar as { id: string; image: string }
		const pbRecord = { id: avatarRecord.id, collectionId: 'images', collectionName: 'images' }
		const avatarUrl = pb.files.getURL(pbRecord, avatarRecord.image, { thumb: '100x100' })
		avatarSrc = await fetchImageAsBase64(avatarUrl)
	}

	// Fallback to recipient's character avatar
	// In SMS conversations, participants[0] is the owner and participants[1] is the receiver
	if (!avatarSrc && participants.length >= 2 && characters.length > 0) {
		const receiver = participants[1] // Second participant = the person being messaged
		if (receiver) {
			const receiverCharacter = characters.find(c => c.id === receiver.characterId)
			if (receiverCharacter?.avatar) {
				avatarSrc = await fetchImageAsBase64(receiverCharacter.avatar)
			}
			// If we have a character but no avatar loaded, generate initials
			if (!avatarSrc && receiverCharacter) {
				avatarSrc = generateInitialsAvatar(
					receiverCharacter.firstName?.[0] || '?',
					receiverCharacter.lastName?.[0] || ''
				)
			}
		}
	}

	// Final fallback to generic initials
	if (!avatarSrc && participants.length >= 2) {
		avatarSrc = generateInitialsAvatar('?', '?')
	}

	return new ImageResponse(
		<div
			style={{
				width: IMG_WIDTH,
				height: IMG_HEIGHT,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: bg,
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			{/* Status Bar */}
			<div style={{ display: 'flex', backgroundColor: '#172933' }}>
				{renderStatusBar('#f8e8e8', '#172933', '#d99393')}
			</div>

			{/* App Header */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: '8px',
					padding: '12px 16px',
					backgroundColor: '#f3f4f6',
				}}
			>
				<div
					style={{
						width: '32px',
						height: '32px',
						borderRadius: '16px',
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: '#e5e7eb',
					}}
				>
					{avatarSrc ? (
						// biome-ignore lint/performance/noImgElement: <we are in imageResponse, satori, so it's ok to use that>
						<img
							src={avatarSrc}
							alt="Avatar"
							width={32}
							height={32}
							style={{ display: 'flex', width: 32, height: 32, objectFit: 'cover' }}
						/>
					) : (
						<div style={{ display: 'flex', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>?</div>
					)}
				</div>
				<div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: '#1f2937' }}>
					{block.conversationTitle || getConversationTitle(participants, characters) || 'Conversation'}
				</div>
			</div>

			{/* Messages */}
			<div style={{ display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: '8px', flex: 1 }}>
				{pageMessages.map(message => {
					const isMe = message.position === 'right'
					const bubbleClass = isMe ? styles.bubbleRight : styles.bubbleLeft
					const bubbleBg = getColorFromClass(bubbleClass)
					const textColor = bubbleClass.includes('text-white') ? '#ffffff' : '#000000'

					return (
						<MessageBubble
							key={message.id}
							message={message}
							characters={characters}
							participants={participants}
							isMe={isMe}
							bubbleBg={bubbleBg}
							textColor={textColor}
							imageSrc={imageMap[message.id]}
						/>
					)
				})}
			</div>
		</div>,
		{ width: IMG_WIDTH, height: IMG_HEIGHT }
	)
}

// ============================================================================
// CONTEXT BLOCK RENDERER (Rich Text)
// ============================================================================

export function renderContextBlock(block: BlockWithExpand, pageIndex = 0): ImageResponse {
	const content = block.content as RichTextContent
	const html = content.plateJson || ''

	// Paginate HTML at block boundaries (paragraphs, blockquotes, etc.)
	const { pageHtml, totalPages } = paginateHtml(html, pageIndex)

	console.log(`[Export] Context pagination: page ${pageIndex + 1}/${totalPages}`)

	// Parse the page HTML to Satori-compatible JSX
	const styledContent = parseHtmlToSatori(pageHtml)

	return new ImageResponse(
		<div
			style={{
				width: IMG_WIDTH,
				height: IMG_HEIGHT,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: DARK_THEME.bg,
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: '8px',
					backgroundColor: DARK_THEME.card,
					padding: '16px 20px',
				}}
			>
				<div
					style={{
						width: '32px',
						height: '32px',
						borderRadius: '16px',
						backgroundColor: DARK_THEME.muted,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						justifyContent: 'center',
						paddingLeft: '8px',
						paddingRight: '8px',
						gap: '3px',
					}}
				>
					<div
						style={{
							display: 'flex',
							height: '2px',
							width: '16px',
							backgroundColor: DARK_THEME.primary,
							borderRadius: '9999px',
						}}
					/>
					<div
						style={{
							display: 'flex',
							height: '2px',
							width: '12px',
							backgroundColor: DARK_THEME.textMuted,
							borderRadius: '9999px',
						}}
					/>
					<div
						style={{
							display: 'flex',
							height: '2px',
							width: '14px',
							backgroundColor: DARK_THEME.textMuted,
							borderRadius: '9999px',
						}}
					/>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: DARK_THEME.text }}>
						{block.title || 'Context'}
					</div>
				</div>
			</div>

			{/* Content */}
			<div
				style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', backgroundColor: DARK_THEME.bg }}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						backgroundColor: DARK_THEME.card,
						borderRadius: '16px',
						padding: '16px 20px',
						border: `1px solid ${DARK_THEME.border}`,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							fontSize: 15,
							lineHeight: 1.7,
							color: DARK_THEME.text,
						}}
					>
						{styledContent}
					</div>
				</div>
			</div>
		</div>,
		{ width: IMG_WIDTH, height: IMG_HEIGHT }
	)
}

// ============================================================================
// MEDIA BLOCK RENDERER
// ============================================================================

export async function renderMediaBlock(block: BlockWithExpand): Promise<ImageResponse> {
	const content = block.content as MediaContent
	const title = block.title || 'Image'

	let mediaUrl: string | undefined
	if (block.expand?.media) {
		const mediaRecord = block.expand.media as { id: string; image: string }
		const pbRecord = { id: mediaRecord.id, collectionId: 'images', collectionName: 'images' }
		mediaUrl = pb.files.getURL(pbRecord, mediaRecord.image)
	} else {
		mediaUrl = content.mediaUrl
	}

	let imageBase64: string | null = null
	if (mediaUrl) {
		const isVideo = content.mediaType === 'video'
		imageBase64 = isVideo ? await fetchVideoThumbnailAsBase64(mediaUrl) : await fetchImageAsBase64(mediaUrl)
	}

	return new ImageResponse(
		<div
			style={{
				width: IMG_WIDTH,
				height: IMG_HEIGHT,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: DARK_THEME.bg,
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: '8px',
					backgroundColor: DARK_THEME.card,
					borderBottom: `1px solid ${DARK_THEME.border}`,
					padding: '16px 20px',
				}}
			>
				<div
					style={{
						width: '32px',
						height: '32px',
						borderRadius: '16px',
						backgroundColor: DARK_THEME.muted,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke={DARK_THEME.primary}
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
						<circle cx="9" cy="9" r="2" />
						<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
					</svg>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: DARK_THEME.text }}>{title}</div>
				</div>
			</div>

			{/* Content */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					padding: '16px',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
				}}
			>
				{imageBase64 ? (
					// biome-ignore lint/performance/noImgElement: <we are in imageResponse, satori, so it's ok to use that>
					<img
						src={imageBase64}
						alt={content.mediaAlt || 'Media'}
						width={398}
						style={{ display: 'flex', width: 398, objectFit: 'contain', borderRadius: 8 }}
					/>
				) : (
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '12px',
							flex: 1,
						}}
					>
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke={DARK_THEME.textMuted}
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
							<circle cx="9" cy="9" r="2" />
							<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
						</svg>
						<span style={{ display: 'flex', fontSize: 14, color: DARK_THEME.textMuted }}>No image available</span>
					</div>
				)}
			</div>
		</div>,
		{ width: IMG_WIDTH, height: IMG_HEIGHT }
	)
}

// ============================================================================
// PLACEHOLDER BLOCK RENDERER
// ============================================================================

export function renderPlaceholderBlock(block: BlockWithExpand): ImageResponse {
	return new ImageResponse(
		<div
			style={{
				width: IMG_WIDTH,
				height: IMG_HEIGHT,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f3f4f6',
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			<span style={{ fontSize: 24, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>
				{block.title || 'Untitled Block'}
			</span>
			<span style={{ fontSize: 16, color: '#6b7280' }}>Type: {block.type}</span>
		</div>,
		{ width: IMG_WIDTH, height: IMG_HEIGHT }
	)
}
