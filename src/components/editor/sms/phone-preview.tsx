/**
 * Phone Preview Component
 * Displays SMS messages in a phone-like interface with inline editing
 */

'use client'

import { normalizePocketBaseDate } from '@sms-editor/lib/date-utils'
import { cn } from '@sms-editor/lib/utils'
import { BatteryIcon, SignalIcon, WifiIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { CharacterAvatar } from '@/components/ui/character-avatar'
import { GroupAvatar } from '@/components/ui/group-avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AppTarget, Character, Message, MessageType, Participant } from '../../../types/creator-stories'
import { appTemplates, getConversationTitle, getParticipantName } from '../../../types/creator-stories'
import { DayBreakSeparator } from './../sms/day-break-separator'
import { InlineMessageInput } from './../sms/inline-message-input'
import { InsertZone } from './../sms/insert-zone'
import { MessageBubble } from './../sms/message-bubble'

export interface PhonePreviewProps {
	appTarget: AppTarget
	messages: Message[]
	participants: Participant[]
	characters: Character[]
	conversationTitle?: string
	conversationAvatar?: string
	conversationDate?: string
	onMessageAdd: (message: Omit<Message, 'id'>, insertIndex: number) => void
	onMessageDelete: (messageId: string) => void
	onMessageEdit: (messageId: string, content: string) => void
}

export function PhonePreview({
	appTarget,
	messages,
	participants,
	characters,
	conversationTitle,
	conversationAvatar,
	conversationDate,
	onMessageAdd,
	onMessageDelete,
	onMessageEdit,
}: PhonePreviewProps) {
	const styles = appTemplates[appTarget]
	const title = conversationTitle || getConversationTitle(participants, characters)

	// Format conversation date for display
	const formattedConversationDate = conversationDate
		? DateTime.fromISO(normalizePocketBaseDate(conversationDate) || '').toLocaleString({
				weekday: 'long',
				month: 'long',
				day: 'numeric',
			})
		: null

	// Refs for focus and visibility tracking
	const editorContainerRef = useRef<HTMLDivElement>(null)
	const [isInViewport, setIsInViewport] = useState(false)
	const [hasFocus, setHasFocus] = useState(false)

	// State for inline editing
	const [editingPosition, setEditingPosition] = useState<{
		index: number
		side: 'left' | 'right'
		senderId: string
	} | null>(null)
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

	// Client-side time state - updates every minute using Luxon
	const [currentTime, setCurrentTime] = useState(() => DateTime.now())
	const [isMac, setIsMac] = useState(false)

	useEffect(() => {
		// Update time immediately on mount
		setCurrentTime(DateTime.now())

		// Detect if Mac
		setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)

		// Update time every minute
		const interval = setInterval(() => {
			setCurrentTime(DateTime.now())
		}, 60000) // Update every 60 seconds

		return () => clearInterval(interval)
	}, [])

	// Track viewport visibility using IntersectionObserver
	useEffect(() => {
		const element = editorContainerRef.current
		if (!element) return

		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					setIsInViewport(entry.isIntersecting)
				})
			},
			{
				threshold: 0.1, // Trigger when at least 10% is visible
			}
		)

		observer.observe(element)

		return () => {
			observer.disconnect()
		}
	}, [])

	// Track focus state
	useEffect(() => {
		const element = editorContainerRef.current
		if (!element) return

		const handleFocusIn = () => setHasFocus(true)
		const handleFocusOut = (e: FocusEvent) => {
			// Only blur if focus moved outside the container
			if (!element.contains(e.relatedTarget as Node)) {
				setHasFocus(false)
			}
		}

		element.addEventListener('focusin', handleFocusIn)
		element.addEventListener('focusout', handleFocusOut)

		return () => {
			element.removeEventListener('focusin', handleFocusIn)
			element.removeEventListener('focusout', handleFocusOut)
		}
	}, [])

	const getSenderName = (senderId: string): string | undefined => {
		const participant = participants.find(p => p.characterId === senderId)
		if (!participant) return undefined
		return getParticipantName(participant, characters)
	}

	const handleInsertClick = (index: number, senderId: string, side: 'left' | 'right') => {
		setEditingPosition({ index, side, senderId })
		setEditingMessageId(null)
	}

	const handleTimeEllipseClick = (index: number) => {
		// Create a time ellipse message
		const newMessage: Omit<Message, 'id'> = {
			senderId: '', // Time ellipses don't have a sender
			content: '2 hours later', // Default placeholder
			type: 'time_ellipse',
			position: 'left',
			timestamp: new Date().toISOString(),
			dayBreak: false,
		}

		onMessageAdd(newMessage, index)
	}

	const handleEditClick = (messageId: string) => {
		setEditingMessageId(messageId)
		setEditingPosition(null)
	}

	const handleSaveNew = (content: string, type: MessageType = 'text', senderId?: string) => {
		if (!editingPosition) return

		const newMessage: Omit<Message, 'id'> = {
			senderId: senderId || editingPosition.senderId,
			content,
			type,
			position: editingPosition.side,
			timestamp: new Date().toISOString(),
			dayBreak: false,
		}

		onMessageAdd(newMessage, editingPosition.index)

		// Auto-open next input for the same participant (continuous flow)
		const nextIndex = editingPosition.index + 1
		setEditingPosition({
			index: nextIndex,
			side: editingPosition.side,
			senderId: senderId || editingPosition.senderId,
		})
	}

	const handleSaveEdit = (messageId: string, content: string) => {
		onMessageEdit(messageId, content)
		setEditingMessageId(null)
	}

	const handleCancel = () => {
		setEditingPosition(null)
		setEditingMessageId(null)
	}

	// Keyboard shortcuts handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only trigger shortcuts if editor is visible in viewport AND has focus
			if (!isInViewport || !hasFocus) return

			// Don't trigger shortcuts if user is typing in an input/textarea/contentEditable
			const activeElement = document.activeElement
			const isTyping =
				activeElement instanceof HTMLInputElement ||
				activeElement instanceof HTMLTextAreaElement ||
				activeElement?.hasAttribute('contenteditable')

			if (isTyping || editingPosition !== null || editingMessageId !== null) return

			// Arrow Left: Add message on the left (received)
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				if (participants.length >= 2 && participants[1]) {
					const insertIndex = messages.length
					handleInsertClick(insertIndex, participants[1].characterId, 'left')
				}
				return
			}

			// Arrow Right: Add message on the right (sent)
			if (e.key === 'ArrowRight') {
				e.preventDefault()
				if (participants.length >= 1 && participants[0]) {
					const insertIndex = messages.length
					handleInsertClick(insertIndex, participants[0].characterId, 'right')
				}
				return
			}

			// Arrow Up: Edit previous message
			if (e.key === 'ArrowUp') {
				e.preventDefault()
				if (messages.length > 0) {
					const lastMessage = messages[messages.length - 1]
					handleEditClick(lastMessage.id)
				}
				return
			}

			// Arrow Down: Navigate to next message (for future implementation)
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				// Could be used to navigate between messages in edit mode
				return
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [editingPosition, editingMessageId, messages.length, participants, isMac, isInViewport, hasFocus])

	return (
		<div
			ref={editorContainerRef}
			tabIndex={-1}
			className="flex flex-col items-center justify-start w-full gap-4 pt-0 pb-8 px-8 outline-none"
		>
			{/* Phone Frame */}
			<div className="relative">
				{/* phone top photo + microphone */}
				<div className="absolute top-0 left-0 w-full flex justify-center gap-2 items-center z-10">
					<div className="h-1.5 w-8 bg-black rounded-full mt-2"></div>
					<div className="h-2 w-2 bg-black rounded-full mt-2"></div>
				</div>
				{/* phone buttons left phone case */}
				<div className="absolute top-0 left-0 flex justify-left gap-2">
					<div className="h-10 w-1 bg-white/80 rounded-full mt-28 translate-x-[-3px]"></div>
				</div>
				{/* phone buttons left phone case */}
				<div className="absolute top-0 left-0 flex justify-left gap-2">
					<div className="h-10 w-1 bg-white/80 rounded-full mt-44 translate-x-[-3px]"></div>
				</div>
				{/* phone buttons right phone case */}
				<div className="absolute top-0 right-0 flex justify-right gap-2">
					<div className="h-10 w-1 bg-white/80 rounded-full mt-28 translate-x-[3px]"></div>
				</div>
				<div className="relative w-[400px] h-[800px] border-4 border-black rounded-4xl bg-white overflow-y-hidden flex flex-col">
					<div className="py-2 px-4 text-xs text-black flex justify-between">
						<div>{currentTime.toLocaleString(DateTime.TIME_SIMPLE)}</div>
						<div className="flex gap-1">
							<SignalIcon className="w-4 h-4"></SignalIcon>
							<WifiIcon className="w-4 h-4"></WifiIcon>
							<BatteryIcon className="w-4 h-4"></BatteryIcon>
						</div>
					</div>
					{/* Phone Header */}
					<div className={cn('px-4 py-3 flex items-center justify-between', styles.headerBg)}>
						<div className="flex items-center gap-2">
							{/* Conversation Avatar */}
							{(() => {
								// Use custom avatar if provided
								if (conversationAvatar) {
									return (
										<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
											<Image src={conversationAvatar} alt="Conversation" fill className="object-cover" />
										</div>
									)
								}

								// Otherwise, use receiver's avatar with CharacterAvatar component
								if (participants.length >= 2) {
									// For group conversations (more than 2 participants), show group avatar
									if (participants.length > 2) {
										const otherParticipants = participants.slice(1)
										// Map to Character objects for GroupAvatar
										const otherCharacters = otherParticipants
											.map(p => characters.find(c => c.id === p.characterId))
											.filter((c): c is Character => !!c)

										return <GroupAvatar participants={otherCharacters} size={32} />
									}

									// For duo, just show the other person
									const receiver = participants[1] // First non-owner participant
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

					{/* Messages Area */}
					<div className={cn('flex-1 overflow-hidden', styles.background)}>
						<ScrollArea className="h-full min-h-[700px]">
							<div className="px-3 py-3 flex flex-col">
								{/* Conversation Date - at the top of messages */}
								{formattedConversationDate && (
									<div className="flex items-center justify-center py-2 mb-2">
										<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
											{formattedConversationDate}
										</span>
									</div>
								)}
								{/* Insert zones at start - both sides */}
								{editingPosition?.index === 0 ? (
									<InlineMessageInput
										position={editingPosition.side}
										onSave={handleSaveNew}
										onCancel={handleCancel}
										senderName={getSenderName(editingPosition.senderId)}
										participants={editingPosition.side === 'left' ? participants.slice(1) : [participants[0]]}
										characters={characters}
										defaultSenderId={editingPosition.senderId}
									/>
								) : (
									participants.length >= 2 && (
										<InsertZone
											participants={participants}
											characters={characters}
											onSelect={(senderId, position) => handleInsertClick(0, senderId, position)}
											onTimeEllipseSelect={() => handleTimeEllipseClick(0)}
										/>
									)
								)}

								{/* Messages */}
								{messages.map((message, index) => {
									// Check if message is consecutive (same sender as previous message)
									const isConsecutive =
										index > 0 && messages[index - 1].senderId === message.senderId && !message.dayBreak

									return (
										<div key={message.id}>
											{/* Day break */}
											{message.dayBreak && message.dateLabel && <DayBreakSeparator date={message.dateLabel} />}

											{/* Message or editing input */}
											{editingMessageId === message.id ? (
												<InlineMessageInput
													position={message.position}
													onSave={content => handleSaveEdit(message.id, content)}
													onCancel={handleCancel}
													senderName={getSenderName(message.senderId)}
													initialContent={message.content}
													initialType={message.type}
												/>
											) : (
												<MessageBubble
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
													onDelete={() => onMessageDelete(message.id)}
													onEdit={() => handleEditClick(message.id)}
												/>
											)}

											{/* Insert zones after each message */}
											{editingPosition?.index === index + 1 ? (
												<InlineMessageInput
													position={editingPosition.side}
													onSave={handleSaveNew}
													onCancel={handleCancel}
													senderName={getSenderName(editingPosition.senderId)}
													participants={editingPosition.side === 'left' ? participants.slice(1) : [participants[0]]}
													characters={characters}
													defaultSenderId={editingPosition.senderId}
												/>
											) : (
												participants.length >= 2 && (
													<InsertZone
														participants={participants}
														characters={characters}
														onSelect={(senderId, position) => handleInsertClick(index + 1, senderId, position)}
														onTimeEllipseSelect={() => handleTimeEllipseClick(index + 1)}
													/>
												)
											)}
										</div>
									)
								})}

								{/* Empty state or warning */}
								{messages.length === 0 && (
									<div className="text-center py-12 text-muted-foreground">
										{participants.length < 2 ? (
											<>
												<p className="text-sm font-medium">⚠️ Incomplete configuration</p>
												<p className="text-xs mt-2">
													You must configure at least <strong>2 participants</strong> to create a conversation.
												</p>
												<p className="text-xs mt-1 opacity-70">Add participants in the section above.</p>
											</>
										) : (
											<>
												<p className="text-sm">No messages yet</p>
												<p className="text-xs mt-1">Hover over the left or right area then click to add a message</p>
											</>
										)}
									</div>
								)}

								{/* Bottom spacer to ensure last insert zone is always visible */}
								<div className="h-32" />
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>

			{/* Keyboard shortcuts */}
			<div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center max-w-3xl">
				<div className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">←</kbd>
					<span className="text-[10px]">Add left</span>
				</div>
				<div className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">→</kbd>
					<span className="text-[10px]">Add right</span>
				</div>
				<div className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">↑</kbd>
					<span className="text-[10px]">Edit last</span>
				</div>
				<div className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Enter</kbd>
					<span className="text-[10px]">Save & next</span>
				</div>
				<div className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Esc</kbd>
					<span className="text-[10px]">Cancel</span>
				</div>
			</div>
		</div>
	)
}
