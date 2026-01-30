/**
 * Fullscreen Block Preview Component
 * Displays block content in fullscreen without phone frame
 * Ultra-minimal reading experience
 */

'use client'

import { normalizePocketBaseDate } from '@sms-editor/lib/date-utils'
import type { ImageRecord } from '@sms-editor/services/imageService'
import type {
	BlockWithExpand,
	Character,
	MediaContent,
	RichTextContent,
	SMSContent,
} from '@sms-editor/types/creator-stories'
import { appTemplates, getConversationTitle, getParticipantName } from '@sms-editor/types/creator-stories'
import { BookOpen, ChevronLeft, ChevronRight, FileText, ImageIcon, Lock, MessageSquare } from 'lucide-react'
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
import { EndOfStoryModal } from './EndOfStoryModal'
import { DayBreakSeparator } from './editor/sms/day-break-separator'
import { MessageBubbleReadonly } from './preview/message-bubble-readonly'

export interface FullscreenBlockPreviewProps {
	blocks: BlockWithExpand[]
	characters: Character[]
	selectedBlockId?: string | null
	onBlockChange?: (blockId: string, index: number) => void
	// Chapter navigation
	hasPreviousChapter?: boolean
	hasNextChapter?: boolean
	onPreviousChapter?: () => void
	onNextChapter?: () => void
	// Mobile nav
	onOpenMobileNav?: () => void
	// End of story modal
	authorName?: string
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

function getBlockIcon(type: BlockDisplayType) {
	switch (type) {
		case 'sms':
			return <MessageSquare className="h-4 w-4" />
		case 'media':
			return <ImageIcon className="h-4 w-4" />
		case 'context':
			return <FileText className="h-4 w-4" />
		default:
			return <FileText className="h-4 w-4" />
	}
}

function getBlockTypeLabel(type: BlockDisplayType) {
	switch (type) {
		case 'sms':
			return 'Conversation'
		case 'media':
			return 'Media'
		case 'context':
			return 'Context'
		default:
			return 'Content'
	}
}

export function FullscreenBlockPreview({
	blocks,
	characters,
	selectedBlockId,
	onBlockChange,
	hasPreviousChapter = false,
	hasNextChapter = false,
	onPreviousChapter,
	onNextChapter,
	onOpenMobileNav,
	authorName,
	storyTitle,
}: FullscreenBlockPreviewProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
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
			<div className="flex flex-col items-center justify-center h-screen">
				<p className="text-muted-foreground">No content blocks to display</p>
			</div>
		)
	}

	return (
		<div className="relative flex flex-col h-full w-full bg-background">
			{/* Block Header - Minimal with icon and title */}
			<FullscreenHeader block={currentBlock} characters={characters} />

			{/* Content Area - with bottom padding for fixed nav on mobile only */}
			<div className="flex-1 overflow-hidden pb-16 md:pb-0">
				<ScrollArea className="h-full">
					<FullscreenContent block={currentBlock} characters={characters} onImageClick={openImageModal} />
				</ScrollArea>
			</div>

			{/* Fixed Navigation Bar - Mobile only (desktop uses top bar) */}
			<div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 md:hidden">
				<div className="flex items-center justify-between max-w-lg mx-auto">
					{/* Mobile: TOC button */}
					{onOpenMobileNav && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onOpenMobileNav}
							className="h-10 w-10 p-0 text-foreground hover:bg-muted"
							aria-label="Open table of contents"
						>
							<BookOpen className="w-5 h-5" />
						</Button>
					)}

					{/* Previous: chapter or block */}
					{currentIndex === 0 && hasPreviousChapter ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={onPreviousChapter}
							className="h-10 px-3 text-foreground hover:bg-muted gap-1"
						>
							<ChevronLeft className="w-4 h-4" />
							<span className="text-xs">Prev.</span>
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							onClick={goToPrevious}
							disabled={currentIndex === 0}
							className="h-10 w-10 p-0 text-foreground hover:bg-muted disabled:opacity-30"
							aria-label="Previous"
						>
							<ChevronLeft className="w-5 h-5" />
						</Button>
					)}

					{/* Progress indicator - dots + page number */}
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							{processedBlocks.slice(0, 8).map((block, idx) => (
								<button
									key={block.id}
									type="button"
									onClick={() => handleIndexChange(idx)}
									className={cn(
										'w-1.5 h-1.5 rounded-full transition-all duration-200',
										idx === currentIndex ? 'bg-primary w-3' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
									)}
									aria-label={`Go to block ${idx + 1}`}
								/>
							))}
							{processedBlocks.length > 8 && <span className="text-xs text-muted-foreground">...</span>}
						</div>
						<span className="text-xs text-muted-foreground font-medium">
							{currentIndex + 1}/{totalBlocks}
						</span>
					</div>

					{/* Next: chapter, block, or end */}
					{currentIndex === totalBlocks - 1 && hasNextChapter ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={onNextChapter}
							className="h-10 px-3 text-foreground hover:bg-muted gap-1"
						>
							<span className="text-xs">Next</span>
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
							className="h-10 w-10 p-0 text-foreground hover:bg-muted disabled:opacity-30"
							aria-label="Next"
						>
							<ChevronRight className="w-5 h-5" />
						</Button>
					)}
				</div>
			</div>

			{/* Desktop Navigation Bar - below content */}
			<div className="hidden md:block border-t border-border bg-card/95 px-4 py-3">
				<div className="flex items-center justify-between max-w-2xl mx-auto">
					{/* Previous: chapter or block */}
					{currentIndex === 0 && hasPreviousChapter ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={onPreviousChapter}
							className="h-10 px-3 text-foreground hover:bg-muted gap-1"
						>
							<ChevronLeft className="w-4 h-4" />
							<span className="text-sm">Previous chapter</span>
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							onClick={goToPrevious}
							disabled={currentIndex === 0}
							className="h-10 px-3 text-foreground hover:bg-muted disabled:opacity-30 gap-1"
						>
							<ChevronLeft className="w-4 h-4" />
							<span className="text-sm">Previous</span>
						</Button>
					)}

					{/* Progress indicator - dots + page number */}
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
						<span className="text-sm text-muted-foreground font-medium">
							{currentIndex + 1} / {totalBlocks}
						</span>
					</div>

					{/* Next: chapter, block, or end */}
					{currentIndex === totalBlocks - 1 && hasNextChapter ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={onNextChapter}
							className="h-10 px-3 text-foreground hover:bg-muted gap-1"
						>
							<span className="text-sm">Next chapter</span>
							<ChevronRight className="w-4 h-4" />
						</Button>
					) : currentIndex === totalBlocks - 1 && !hasNextChapter ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setEndOfStoryModalOpen(true)}
							className="h-10 px-3 text-foreground hover:bg-muted gap-1"
							aria-label="End of story"
						>
							<Lock className="w-4 h-4" />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							onClick={goToNext}
							disabled={currentIndex === totalBlocks - 1}
							className="h-10 px-3 text-foreground hover:bg-muted disabled:opacity-30 gap-1"
						>
							<span className="text-sm">Next</span>
							<ChevronRight className="w-4 h-4" />
						</Button>
					)}
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
				authorName={authorName}
				storyTitle={storyTitle}
			/>
		</div>
	)
}

// ============================================================================
// FULLSCREEN HEADER - Minimal with icon bubble and title
// ============================================================================

interface FullscreenHeaderProps {
	block: ProcessedBlock
	characters: Character[]
}

function FullscreenHeader({ block, characters }: FullscreenHeaderProps) {
	const originalBlock = block.originalBlock

	// For SMS blocks, show conversation info
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
			<header className={cn('px-6 py-4 flex items-center gap-3 border-b border-border shrink-0', styles.headerBg)}>
				{/* Avatar */}
				{(() => {
					if (conversationAvatarUrl) {
						return (
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
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

							return <GroupAvatar participants={otherCharacters} size={40} />
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
									size={40}
								/>
							)
						}
					}

					return (
						<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
							<MessageSquare className="h-5 w-5 text-primary" />
						</div>
					)
				})()}
				<div className="flex flex-col">
					<span className={cn('text-base font-semibold', styles.headerText)}>{title}</span>
					<span className="text-xs text-muted-foreground capitalize">{appTarget.replace('_', ' ')}</span>
				</div>
			</header>
		)
	}

	// For context and media blocks
	const typeLabel = getBlockTypeLabel(block.type)

	return (
		<header className="px-6 py-4 flex items-center gap-3 border-b border-border bg-card shrink-0">
			<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">{getBlockIcon(block.type)}</div>
			<div className="flex flex-col">
				<span className="text-base font-semibold text-foreground">{block.title || typeLabel}</span>
				{block.title && <span className="text-xs text-muted-foreground">{typeLabel}</span>}
			</div>
		</header>
	)
}

// ============================================================================
// FULLSCREEN CONTENT
// ============================================================================

interface FullscreenContentProps {
	block: ProcessedBlock
	characters: Character[]
	onImageClick: (url: string) => void
}

function FullscreenContent({ block, characters, onImageClick }: FullscreenContentProps) {
	const originalBlock = block.originalBlock

	switch (block.type) {
		case 'context':
			return <FullscreenContextContent block={originalBlock} onImageClick={onImageClick} />
		case 'media':
			return <FullscreenMediaContent block={originalBlock} onImageClick={onImageClick} />
		case 'sms':
			return <FullscreenSmsContent block={originalBlock} characters={characters} />
		default:
			return (
				<div className="p-6 text-center text-muted-foreground">
					<p className="text-sm">Unknown block type</p>
				</div>
			)
	}
}

// ============================================================================
// CONTEXT CONTENT (Rich Text) - Fullscreen
// ============================================================================

interface FullscreenContextContentProps {
	block: BlockWithExpand
	onImageClick: (url: string) => void
}

function FullscreenContextContent({ block, onImageClick }: FullscreenContextContentProps) {
	const content = block.content as RichTextContent

	return (
		<div className="px-6 py-6 max-w-3xl mx-auto">
			<article
				className={cn(
					'prose prose-lg max-w-none prose-shadcn',
					'prose-headings:font-bold prose-headings:text-foreground prose-headings:mb-4 prose-headings:mt-6',
					'prose-p:text-foreground prose-p:leading-relaxed prose-p:my-4',
					'prose-a:text-primary prose-a:no-underline hover:prose-a:underline hover:prose-a:text-accent',
					'prose-strong:text-foreground prose-strong:font-semibold',
					'prose-em:text-muted-foreground',
					'prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic',
					'prose-ul:text-foreground prose-ol:text-foreground',
					'prose-li:text-foreground',
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
				dangerouslySetInnerHTML={{ __html: content.plateJson }}
			/>
		</div>
	)
}

// ============================================================================
// MEDIA CONTENT - Fullscreen
// ============================================================================

interface FullscreenMediaContentProps {
	block: BlockWithExpand
	onImageClick: (url: string) => void
}

function FullscreenMediaContent({ block, onImageClick }: FullscreenMediaContentProps) {
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
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
					<p className="text-sm text-muted-foreground">No media available</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className="flex flex-col items-center justify-center overflow-hidden"
			style={{ width: '100vw', maxWidth: '100vw', minHeight: 'calc(100vh - 200px)' }}
		>
			<div className="relative flex flex-col items-center justify-center px-4 py-4">
				{content.mediaType === 'image' ? (
					!imageError && url ? (
						<button
							type="button"
							onClick={() => onImageClick(url)}
							className="relative group cursor-pointer flex items-center justify-center"
						>
							<Image
								src={url}
								alt={content.mediaAlt || 'Media content'}
								width={1200}
								height={800}
								style={{
									maxWidth: 'calc(100vw - 32px)',
									maxHeight: 'calc(100vh - 220px)',
									width: 'auto',
									height: 'auto',
									objectFit: 'contain',
								}}
								className="rounded-lg"
								onError={() => setImageError(true)}
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
								<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div className="bg-card/90 rounded-full p-3 border border-border">
										<ImageIcon className="w-6 h-6 text-primary" />
									</div>
								</div>
							</div>
						</button>
					) : (
						<div
							className="flex items-center justify-center h-64 bg-muted rounded-lg"
							style={{ width: 'calc(100vw - 32px)', maxWidth: '400px' }}
						>
							<div className="text-center">
								<ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Failed to load image</p>
							</div>
						</div>
					)
				) : content.mediaType === 'video' ? (
					<video
						controls
						className="rounded-lg"
						style={{
							maxWidth: 'calc(100vw - 32px)',
							maxHeight: 'calc(100vh - 220px)',
							width: 'auto',
							height: 'auto',
							objectFit: 'contain',
						}}
						poster={url}
					>
						<source src={url} />
						<track kind="captions" />
						Your browser does not support the video tag.
					</video>
				) : (
					<div
						className="flex items-center justify-center h-64 bg-muted rounded-lg"
						style={{ width: 'calc(100vw - 32px)', maxWidth: '400px' }}
					>
						<p className="text-sm text-muted-foreground">Unsupported media type</p>
					</div>
				)}
			</div>
		</div>
	)
}

// ============================================================================
// SMS CONTENT - Fullscreen
// ============================================================================

interface FullscreenSmsContentProps {
	block: BlockWithExpand
	characters: Character[]
}

function FullscreenSmsContent({ block, characters }: FullscreenSmsContentProps) {
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
		<div className={cn('min-h-screen', styles.background)}>
			<div className="max-w-2xl mx-auto px-4 py-6">
				{/* Conversation Date */}
				{formattedConversationDate && (
					<div className="flex items-center justify-center py-3 mb-4">
						<span className="text-sm font-medium text-gray-500">{formattedConversationDate}</span>
					</div>
				)}

				{/* Messages */}
				<div className="space-y-1">
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
		</div>
	)
}
