/**
 * Export Shared Components
 * Reusable JSX components for ImageResponse rendering
 */

import { getColorFromClass } from '@sms-editor/lib/color-utils'
import type { Character, Message, Participant } from '@sms-editor/types/creator-stories'
import { getParticipantName } from '@sms-editor/types/creator-stories'

// ============================================================================
// TYPES
// ============================================================================

export interface MessageBubbleProps {
	message: Message
	characters: Character[]
	participants: Participant[]
	styles?: { bubbleLeft: string; bubbleRight: string }
	isMe?: boolean
	bubbleBg?: string
	textColor?: string
	imageSrc?: string
	imageBase64?: string
}

// ============================================================================
// STATUS BAR
// ============================================================================

/**
 * Renders a phone status bar with time and icons
 */
export function renderStatusBar(textColor = 'black', backgroundColor?: string, iconColor?: string): React.ReactElement {
	const PINK_ICON = iconColor || '#d99393'

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				width: '100%',
				padding: '0 24px',
				paddingTop: '12px',
				paddingBottom: '12px',
				height: '44px',
				color: textColor,
				fontSize: 14,
				fontFamily: 'SF Pro Text, system-ui',
				fontWeight: 600,
				backgroundColor: backgroundColor || 'transparent',
			}}
		>
			{/* Time */}
			<div style={{ display: 'flex' }}>9:41</div>

			{/* Icons */}
			<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
				{/* Signal Icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke={PINK_ICON}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M2 20h.01" />
					<path d="M7 20v-4" />
					<path d="M12 20v-8" />
					<path d="M17 20V8" />
					<path d="M22 4v16" />
				</svg>
				{/* Wifi Icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke={PINK_ICON}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 20h.01" />
					<path d="M2 8.82a15 15 0 0 1 20 0" />
					<path d="M5 12.859a10 10 0 0 1 14 0" />
					<path d="M8.5 16.429a5 5 0 0 1 7 0" />
				</svg>
				{/* Battery Icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke={PINK_ICON}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M10 10v4" />
					<path d="M14 10v4" />
					<path d="M22 14v-4" />
					<path d="M6 10v4" />
					<rect x="2" y="6" width="16" height="12" rx="2" />
				</svg>
			</div>
		</div>
	)
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

/**
 * Renders a single message bubble for SMS export
 */
export function MessageBubble({
	message,
	characters,
	participants,
	styles,
	isMe,
	bubbleBg,
	textColor,
	imageSrc,
	imageBase64,
}: MessageBubbleProps) {
	const isLeft = message.position === 'left'
	const finalIsMe = isMe !== undefined ? isMe : !isLeft
	const finalBubbleBg =
		bubbleBg ||
		(styles ? (isLeft ? getColorFromClass(styles.bubbleLeft) : getColorFromClass(styles.bubbleRight)) : '#e5e7eb')

	const finalImage = imageSrc || imageBase64

	const isImageMessage = message.type === 'image'
	const isVideoMessage = message.type === 'video'
	const isMediaMessage = isImageMessage || isVideoMessage

	const participant = participants.find(p => p.characterId === message.senderId)
	const senderName = participant ? getParticipantName(participant, characters) : undefined

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: finalIsMe ? 'flex-end' : 'flex-start',
				width: '100%',
			}}
		>
			{senderName && (
				<span
					style={{
						fontSize: 10,
						color: '#6b7280',
						marginBottom: 2,
						paddingLeft: !finalIsMe ? 4 : 0,
						paddingRight: !finalIsMe ? 0 : 4,
					}}
				>
					{senderName}
				</span>
			)}
			{isMediaMessage ? (
				finalImage ? (
					// biome-ignore lint/performance/noImgElement: <we are in imageResponse, satori, so it's ok to use that>
					<img
						src={finalImage}
						alt="Media"
						width={200}
						height={200}
						style={{
							maxWidth: 200,
							maxHeight: 200,
							borderRadius: 12,
							objectFit: 'cover',
						}}
					/>
				) : isVideoMessage ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 180,
							height: 120,
							background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
							borderRadius: 12,
							position: 'relative',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 48,
								height: 48,
								borderRadius: '50%',
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
							}}
						>
							<div
								style={{
									width: 0,
									height: 0,
									borderTop: '10px solid transparent',
									borderBottom: '10px solid transparent',
									borderLeft: '16px solid #1e293b',
									marginLeft: 4,
								}}
							/>
						</div>
					</div>
				) : (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 150,
							height: 100,
							backgroundColor: '#e5e7eb',
							borderRadius: 12,
							fontSize: 24,
						}}
					>
						🖼
					</div>
				)
			) : (
				<div
					style={{
						display: 'flex',
						padding: '10px 14px',
						borderRadius: 18,
						backgroundColor: finalBubbleBg,
						color: textColor,
						fontSize: 15,
						maxWidth: '75%',
						lineHeight: 1.4,
					}}
				>
					{message.content}
				</div>
			)}
		</div>
	)
}
