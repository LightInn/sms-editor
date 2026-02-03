/**
 * Unified Phone Preview Component
 * Displays all block types (context, media, sms) in a single phone with pagination
 */

'use client'

import { normalizePocketBaseDate } from '@sms-editor/lib/date-utils'
import { safeHtml } from '@sms-editor/lib/safe-html'
import type { ImageRecord } from '@sms-editor/services/imageService'
import type {
	BlockWithExpand,
	Character,
	MediaContent,
	RichTextContent,
	SMSContent,
} from '@sms-editor/types/creator-stories'
import { appTemplates, getConversationTitle, getParticipantName } from '@sms-editor/types/creator-stories'
import { BatteryIcon, ChevronLeft, ChevronRight, ImageIcon, Lock, SignalIcon, WifiIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CharacterAvatar } from '@/components/ui/character-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GroupAvatar } from '@/components/ui/group-avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { pb } from '@/lib/pocketbase'
import { cn } from '@/lib/utils'
import { EndOfStoryModal } from '../EndOfStoryModal'
import { DayBreakSeparator } from '../editor/sms/day-break-separator'
import { MessageBubbleReadonly } from './message-bubble-readonly'

export interface UnifiedPhonePreviewProps {
	blocks: BlockWithExpand[]
	characters: Character[]
	selectedBlockId?: string | null
	onBlockChange?: (blockId: string, index: number) => void
	// Chapter navigation (optional)
	hasPreviousChapter?: boolean
	hasNextChapter?: boolean
	onPreviousChapter?: () => void
	onNextChapter?: () => void
	// End of story modal
	authorId?: string
	storyTitle?: string
}

type BlockDisplayType = 'context' | 'media' | 'sms'

interface ProcessedBlock {
	id: string
	type: BlockDisplayType
	title: string | null
	originalBlock: BlockWithExpand
}

function getBlockDisplayType(block: BlockWithExpand): BlockDisplayType {
	switch (block.type) {
		case 'rich_text_content':
			return 'context'
		case 'media_content':
			return 'media'
		case 'sms_conversation':
			return 'sms'
		default:
			return 'context'
	}
}

export function UnifiedPhonePreview({
	blocks,
	characters,
	selectedBlockId,
	onBlockChange,
	hasPreviousChapter = false,
	hasNextChapter = false,
	onPreviousChapter,
	onNextChapter,
	authorId,
	storyTitle,
}: UnifiedPhonePreviewProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [currentTime, setCurrentTime] = useState(() => DateTime.now())
	const [imageModalOpen, setImageModalOpen] = useState(false)
	const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
	const [endOfStoryModalOpen, setEndOfStoryModalOpen] = useState(false)

	// Process blocks into a unified format
	const processedBlocks: ProcessedBlock[] = blocks.map(block => ({
		id: block.id,
		type: getBlockDisplayType(block),
		title: block.title,
		originalBlock: block,
	}))

	const currentBlock = processedBlocks[currentIndex]
	const totalBlocks = processedBlocks.length

	// Sync index when selectedBlockId changes from parent
	useEffect(() => {
		if (selectedBlockId) {
			const index = processedBlocks.findIndex(b => b.id === selectedBlockId)
			if (index !== -1 && index !== currentIndex) {
				setCurrentIndex(index)
			}
		}
	}, [selectedBlockId, processedBlocks])

	// Notify parent when block changes
	const handleIndexChange = useCallback(
		(newIndex: number) => {
			setCurrentIndex(newIndex)
			const block = processedBlocks[newIndex]
			if (block && onBlockChange) {
				onBlockChange(block.id, newIndex)
			}
		},
		[processedBlocks, onBlockChange]
	)

	// Update time every minute
	useEffect(() => {
		setCurrentTime(DateTime.now())
		const interval = setInterval(() => {
			setCurrentTime(DateTime.now())
		}, 60000)
		return () => clearInterval(interval)
	}, [])

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft' && currentIndex > 0) {
				handleIndexChange(currentIndex - 1)
			} else if (e.key === 'ArrowRight' && currentIndex < totalBlocks - 1) {
				handleIndexChange(currentIndex + 1)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentIndex, totalBlocks, handleIndexChange])

	const goToPrevious = useCallback(() => {
		if (currentIndex > 0) {
			handleIndexChange(currentIndex - 1)
		}
	}, [currentIndex, handleIndexChange])

	const goToNext = useCallback(() => {
		if (currentIndex < totalBlocks - 1) {
			handleIndexChange(currentIndex + 1)
		}
	}, [currentIndex, totalBlocks, handleIndexChange])

	const openImageModal = (url: string) => {
		setModalImageUrl(url)
		setImageModalOpen(true)
	}

	if (totalBlocks === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">No content blocks to display</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-start w-full gap-4 pt-0 pb-8 px-2 md:px-8">
			{/* Phone Frame */}
			<div className="relative w-full max-w-[400px]">
				{/* Phone top photo + microphone */}
				<div className="absolute top-0 left-0 w-full flex justify-center gap-2 items-center z-10">
					<div className="h-1.5 w-8 bg-foreground/80 rounded-full mt-2" />
					<div className="h-2 w-2 bg-foreground/80 rounded-full mt-2" />
				</div>
				{/* Phone buttons left - hidden on mobile for cleaner look */}
				<div className="absolute top-0 left-0 hidden sm:flex justify-left gap-2">
					<div className="h-10 w-1 bg-muted-foreground/50 rounded-full mt-28 translate-x-[-3px]" />
				</div>
				<div className="absolute top-0 left-0 hidden sm:flex justify-left gap-2">
					<div className="h-10 w-1 bg-muted-foreground/50 rounded-full mt-44 translate-x-[-3px]" />
				</div>
				{/* Phone buttons right - hidden on mobile for cleaner look */}
				<div className="absolute top-0 right-0 hidden sm:flex justify-right gap-2">
					<div className="h-10 w-1 bg-muted-foreground/50 rounded-full mt-28 translate-x-[3px]" />
				</div>

				<div className="relative w-full aspect-[1/2] min-h-[500px] h-[800px] border-4 border-border rounded-4xl bg-background overflow-hidden flex flex-col shadow-lg">
					{/* Status bar */}
					<div className="py-2 px-4 text-xs text-foreground flex justify-between shrink-0 bg-card/50">
						<div>{currentTime.toLocaleString(DateTime.TIME_SIMPLE)}</div>
						<div className="flex gap-1 text-muted-foreground">
							<SignalIcon className="w-4 h-4" />
							<WifiIcon className="w-4 h-4" />
							<BatteryIcon className="w-4 h-4" />
						</div>
					</div>

					{/* Phone Header - shows block type and title */}
					<PhoneHeader block={currentBlock} characters={characters} />

					{/* Content Area */}
					<div className="flex-1 overflow-hidden bg-background">
						<ScrollArea className="h-full">
							<PhoneContent block={currentBlock} characters={characters} onImageClick={openImageModal} />
						</ScrollArea>
					</div>

					{/* Navigation Controls */}
					<div className="shrink-0 bg-card border-t border-border px-4 py-3">
						<div className="flex items-center justify-between">
							{/* Previous: chapter or block */}
							{currentIndex === 0 && hasPreviousChapter ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={onPreviousChapter}
									className="h-10 px-2 text-foreground hover:bg-muted gap-1"
								>
									<ChevronLeft className="w-4 h-4" />
									<span className="text-xs">Prev. ch.</span>
								</Button>
							) : (
								<Button
									variant="ghost"
									size="sm"
									onClick={goToPrevious}
									disabled={currentIndex === 0}
									className="h-10 w-10 p-0 text-foreground hover:bg-muted"
								>
									<ChevronLeft className="w-5 h-5" />
								</Button>
							)}

							{/* Progress indicator */}
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5">
									{processedBlocks.map((block, idx) => (
										<button
											key={block.id}
											type="button"
											onClick={() => handleIndexChange(idx)}
											className={cn(
												'w-2 h-2 rounded-full transition-all duration-200',
												idx === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
											)}
											aria-label={`Go to block ${idx + 1}`}
										/>
									))}
								</div>
								<span className="text-xs text-muted-foreground font-medium">
									{currentIndex + 1} / {totalBlocks}
								</span>
							</div>

							{/* Next: chapter, block, or end */}
							{currentIndex === totalBlocks - 1 && hasNextChapter ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={onNextChapter}
									className="h-10 px-2 text-foreground hover:bg-muted gap-1"
								>
									<span className="text-xs">Next ch.</span>
									<ChevronRight className="w-4 h-4" />
								</Button>
							) : currentIndex === totalBlocks - 1 && !hasNextChapter ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEndOfStoryModalOpen(true)}
									className="h-10 w-10 p-0 text-foreground hover:bg-muted"
									aria-label="End of story"
								>
									<Lock className="w-5 h-5" />
								</Button>
							) : (
								<Button
									variant="ghost"
									size="sm"
									onClick={goToNext}
									disabled={currentIndex === totalBlocks - 1}
									className="h-10 w-10 p-0 text-foreground hover:bg-muted"
								>
									<ChevronRight className="w-5 h-5" />
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Image Modal */}
			<Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
				<DialogContent className="max-w-4xl w-full">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ImageIcon className="h-5 w-5" />
							Image
						</DialogTitle>
					</DialogHeader>
					<div className="relative w-full flex items-center justify-center bg-muted/50 rounded-lg">
						{modalImageUrl && (
							<Image
								src={modalImageUrl}
								alt="Full size image"
								width={800}
								height={800}
								className="max-w-full h-auto max-h-[70vh] object-contain rounded-lg"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* End of Story Modal */}
			<EndOfStoryModal
				open={endOfStoryModalOpen}
				onOpenChange={setEndOfStoryModalOpen}
				authorId={authorId}
				storyTitle={storyTitle}
			/>
		</div>
	)
}

// ============================================================================
// PHONE HEADER
// ============================================================================

interface PhoneHeaderProps {
	block: ProcessedBlock
	characters: Character[]
}

function PhoneHeader({ block, characters }: PhoneHeaderProps) {
	const originalBlock = block.originalBlock

	// For SMS blocks, use the app-specific header
	if (block.type === 'sms') {
		const appTarget = originalBlock.appTarget || 'imessage'
		const styles = appTemplates[appTarget]
		const participants = originalBlock.participants || []
		const title = originalBlock.conversationTitle || getConversationTitle(participants, characters)

		// Get conversation avatar URL
		let conversationAvatarUrl: string | undefined
		if (originalBlock.expand?.conversationAvatar) {
			const avatarRecord = originalBlock.expand.conversationAvatar as ImageRecord
			const pbRecord = {
				id: avatarRecord.id,
				collectionId: 'images',
				collectionName: 'images',
			}
			conversationAvatarUrl = pb.files.getURL(pbRecord, avatarRecord.image, { thumb: '100x100' })
		}

		return (
			<div className={cn('px-4 py-3 flex items-center justify-between shrink-0', styles.headerBg)}>
				<div className="flex items-center gap-2">
					{/* Conversation Avatar */}
					{(() => {
						if (conversationAvatarUrl) {
							return (
								<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
									<Image src={conversationAvatarUrl} alt="Conversation" fill className="object-cover" />
								</div>
							)
						}

						if (participants.length >= 2) {
							if (participants.length > 2) {
								const otherParticipants = participants.slice(1)
								const otherCharacters = otherParticipants
									.map(p => characters.find(c => c.id === p.characterId))
									.filter((c): c is Character => !!c)

								return <GroupAvatar participants={otherCharacters} size={32} />
							}

							const receiver = participants[1]
							const receiverCharacter = characters.find(c => c.id === receiver.characterId)

							if (receiverCharacter) {
								return (
									<CharacterAvatar
										characterId={receiverCharacter.id}
										firstName={receiverCharacter.firstName}
										lastName={receiverCharacter.lastName}
										avatarUrl={receiverCharacter.avatar}
										size={32}
									/>
								)
							}
						}

						return null
					})()}
					<div className={cn('text-sm font-medium', styles.headerText)}>{title}</div>
				</div>
			</div>
		)
	}

	// For context and media blocks, use a generic header with app theme
	const typeLabel = block.type === 'context' ? 'Context' : 'Image'

	return (
		<div className="px-4 py-3 flex items-center gap-2 bg-card border-b border-border shrink-0">
			<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
				{block.type === 'context' ? (
					// Table of contents style icon - small lines representing text
					<div className="flex flex-col gap-[3px] items-start px-1.5">
						<div className="h-[2px] w-4 bg-primary rounded-full" />
						<div className="h-[2px] w-3 bg-muted-foreground rounded-full" />
						<div className="h-[2px] w-3.5 bg-muted-foreground rounded-full" />
					</div>
				) : (
					<ImageIcon className="w-4 h-4 text-primary" />
				)}
			</div>
			<div className="flex flex-col">
				<span className="text-sm font-medium text-foreground">{block.title || typeLabel}</span>
				{block.title && <span className="text-[10px] text-muted-foreground">{typeLabel}</span>}
			</div>
		</div>
	)
}

// ============================================================================
// PHONE CONTENT
// ============================================================================

interface PhoneContentProps {
	block: ProcessedBlock
	characters: Character[]
	onImageClick: (url: string) => void
}

function PhoneContent({ block, characters, onImageClick }: PhoneContentProps) {
	const originalBlock = block.originalBlock

	switch (block.type) {
		case 'context':
			return <ContextContent block={originalBlock} onImageClick={onImageClick} />
		case 'media':
			return <MediaContentDisplay block={originalBlock} onImageClick={onImageClick} />
		case 'sms':
			return <SmsContent block={originalBlock} characters={characters} />
		default:
			return (
				<div className="p-4 text-center text-muted-foreground">
					<p className="text-sm">Unknown block type</p>
				</div>
			)
	}
}

// ============================================================================
// CONTEXT CONTENT (Rich Text)
// ============================================================================

interface ContextContentProps {
	block: BlockWithExpand
	onImageClick: (url: string) => void
}

function ContextContent({ block, onImageClick }: ContextContentProps) {
	const content = block.content as RichTextContent

	return (
		<div className="px-4 py-4 h-full bg-background">
			{/* Render as styled card matching app theme */}
			<div className="bg-card rounded-2xl px-4 py-3 border border-border shadow-sm">
				<article
					className={cn(
						'prose prose-sm max-w-none prose-shadcn',
						'prose-headings:font-bold prose-headings:text-foreground prose-headings:text-base prose-headings:mb-2 prose-headings:mt-3',
						'prose-p:text-foreground prose-p:leading-relaxed prose-p:text-sm prose-p:my-1.5',
						'prose-a:text-primary prose-a:no-underline hover:prose-a:underline hover:prose-a:text-accent',
						'prose-strong:text-foreground prose-strong:font-semibold',
						'prose-em:text-muted-foreground',
						'prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:pl-3 prose-blockquote:italic',
						'prose-ul:text-foreground prose-ol:text-foreground',
						'prose-li:text-foreground prose-li:text-sm',
						'prose-img:rounded-lg prose-img:cursor-pointer prose-img:hover:opacity-90 prose-img:transition-opacity'
					)}
					onClick={e => {
						const target = e.target as HTMLElement
						if (target.tagName === 'IMG') {
							const imgSrc = (target as HTMLImageElement).src
							if (imgSrc) onImageClick(imgSrc)
						}
					}}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							const target = e.target as HTMLElement
							if (target.tagName === 'IMG') {
								const imgSrc = (target as HTMLImageElement).src
								if (imgSrc) onImageClick(imgSrc)
							}
						}
					}}
					{...safeHtml(content.plateJson)}
				/>
			</div>
		</div>
	)
}

// ============================================================================
// MEDIA CONTENT
// ============================================================================

interface MediaContentDisplayProps {
	block: BlockWithExpand
	onImageClick: (url: string) => void
}

function MediaContentDisplay({ block, onImageClick }: MediaContentDisplayProps) {
	const [imageError, setImageError] = useState(false)
	const content = block.content as MediaContent

	// Get media URL
	let url: string | undefined
	if (block.expand?.media) {
		const mediaRecord = block.expand.media as ImageRecord
		const pbRecord = {
			id: mediaRecord.id,
			collectionId: 'images',
			collectionName: 'images',
		}
		url = pb.files.getURL(pbRecord, mediaRecord.image)
	} else {
		url = content.mediaUrl
	}

	if (!url) {
		return (
			<div className="p-4 flex items-center justify-center h-64 bg-background">
				<div className="text-center">
					<ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
					<p className="text-sm text-muted-foreground">No media available</p>
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 bg-background">
			<div className="relative w-full rounded-lg overflow-hidden">
				{content.mediaType === 'image' ? (
					!imageError && url ? (
						<button type="button" onClick={() => onImageClick(url)} className="relative w-full group cursor-pointer">
							<Image
								src={url}
								alt={content.mediaAlt || 'Media content'}
								width={380}
								height={500}
								className="w-full h-auto object-cover rounded-lg"
								onError={() => setImageError(true)}
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-lg flex items-center justify-center">
								<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div className="bg-card/90 rounded-full p-3 border border-border">
										<ImageIcon className="w-6 h-6 text-primary" />
									</div>
								</div>
							</div>
						</button>
					) : (
						<div className="flex items-center justify-center h-64 bg-muted rounded-lg">
							<div className="text-center">
								<ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Failed to load image</p>
							</div>
						</div>
					)
				) : content.mediaType === 'video' ? (
					<video controls className="w-full h-auto rounded-lg" poster={url}>
						<source src={url} />
						<track kind="captions" />
						Your browser does not support the video tag.
					</video>
				) : (
					<div className="flex items-center justify-center h-64 bg-muted rounded-lg">
						<p className="text-sm text-muted-foreground">Unsupported media type</p>
					</div>
				)}
			</div>
		</div>
	)
}

// ============================================================================
// SMS CONTENT
// ============================================================================

interface SmsContentProps {
	block: BlockWithExpand
	characters: Character[]
}

function SmsContent({ block, characters }: SmsContentProps) {
	const content = block.content as SMSContent
	const messages = content.messages || []
	const participants = block.participants || []
	const appTarget = block.appTarget || 'imessage'
	const styles = appTemplates[appTarget]

	// Format conversation date
	const conversationDate = messages[0]?.timestamp
	const formattedConversationDate = conversationDate
		? DateTime.fromISO(normalizePocketBaseDate(conversationDate) || '').toLocaleString({
				weekday: 'long',
				month: 'long',
				day: 'numeric',
			})
		: null

	if (messages.length === 0) {
		return (
			<div className={cn('h-full flex items-center justify-center', styles.background)}>
				<p className="text-sm text-gray-500">No messages in this conversation</p>
			</div>
		)
	}

	return (
		<div className={cn('h-full min-h-[700px]', styles.background)}>
			<div className="px-3 py-3 flex flex-col">
				{/* Conversation Date */}
				{formattedConversationDate && (
					<div className="flex items-center justify-center py-2 mb-2">
						<span className="text-xs font-medium text-gray-500">{formattedConversationDate}</span>
					</div>
				)}

				{/* Messages */}
				{messages.map((message, index) => {
					const isConsecutive = index > 0 && messages[index - 1].senderId === message.senderId && !message.dayBreak

					return (
						<div key={message.id}>
							{/* Day break */}
							{message.dayBreak && message.dateLabel && <DayBreakSeparator date={message.dateLabel} />}

							{/* Message */}
							<MessageBubbleReadonly
								message={message}
								isConsecutive={isConsecutive}
								senderName={(() => {
									const participant = participants.find(p => p.characterId === message.senderId)
									return participant ? getParticipantName(participant, characters) : undefined
								})()}
								senderFirstName={(() => {
									const character = characters.find(c => c.id === message.senderId)
									return character?.firstName
								})()}
								senderLastName={(() => {
									const character = characters.find(c => c.id === message.senderId)
									return character?.lastName
								})()}
								senderAvatar={(() => {
									const character = characters.find(c => c.id === message.senderId)
									return character?.avatar
								})()}
							/>
						</div>
					)
				})}
			</div>
		</div>
	)
}
