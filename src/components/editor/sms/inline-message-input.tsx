/**
 * Inline Message Input Component
 * Auto-expanding textarea for quick message creation
 */

'use client'

import { uploadMediaAction } from '@smseditor/actions/mediaActions'
import { Button } from '@smseditor/components/ui/button'
import { CharacterAvatar } from '@smseditor/components/ui/character-avatar'
import { cn } from '@smseditor/lib/utils'
import { Check, Loader2, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Character, MessageType, Participant } from '../../../types/creator-stories'

export interface InlineMessageInputProps {
	position: 'left' | 'right'
	onSave: (content: string, type?: MessageType, senderId?: string) => void
	onCancel: () => void
	senderName?: string
	participants?: Participant[]
	characters?: Character[]
	defaultSenderId?: string
	initialContent?: string
	initialType?: MessageType
}

export function InlineMessageInput({
	position,
	onSave,
	onCancel,
	senderName,
	participants,
	characters,
	defaultSenderId,
	initialContent = '',
	initialType = 'text',
}: InlineMessageInputProps) {
	const [content, setContent] = useState(initialContent)
	const [messageType, setMessageType] = useState<MessageType>(initialType)
	const [mediaPreview, setMediaPreview] = useState<string | null>(null)
	const [mediaUrl, setMediaUrl] = useState<string | null>(null)
	const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [selectedSenderId, setSelectedSenderId] = useState<string | undefined>(defaultSenderId)

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const isLeft = position === 'left'

	// Auto-focus on mount
	useEffect(() => {
		textareaRef.current?.focus()
	}, [])

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current
		if (textarea) {
			textarea.style.height = 'auto'
			textarea.style.height = `${textarea.scrollHeight}px`
		}
	}, [content])

	// Initialize media preview if content is media
	useEffect(() => {
		if (initialType === 'image' || initialType === 'video') {
			setMediaUrl(initialContent)
			setMediaPreview(initialContent)
			setMediaType(initialType)
			setContent(initialContent)
		}
	}, [initialContent, initialType])

	const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Detect media type
		const isImage = file.type.startsWith('image/')
		const isVideo = file.type.startsWith('video/')

		if (!isImage && !isVideo) {
			toast.error('Please select an image or video file')
			return
		}

		// Check file size (max 50MB for videos, 5MB for images)
		const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
		if (file.size > maxSize) {
			toast.error(`${isImage ? 'Image' : 'Video'} must be less than ${isImage ? '5MB' : '50MB'}`)
			return
		}

		// Set media type
		const type = isImage ? 'image' : 'video'
		setMediaType(type)

		// Create preview
		const reader = new FileReader()
		reader.onloadend = () => {
			setMediaPreview(reader.result as string)
		}
		reader.readAsDataURL(file)

		// Upload to server via server action
		setIsUploading(true)
		try {
			const uploadFormData = new FormData()
			uploadFormData.append('file', file)
			uploadFormData.append('alt', `Message ${type}`)

			const result = await uploadMediaAction(uploadFormData)

			if (result.success && result.url) {
				setMediaUrl(result.url)
				setContent(result.url)
				setMessageType(type)
				toast.success(`${isImage ? 'Image' : 'Video'} uploaded successfully!`)
			} else {
				toast.error('error' in result ? result.error : `Failed to upload ${type}`)
				setMediaPreview(null)
				setMediaType(null)
			}
		} catch (error) {
			console.error('Media upload error:', error)
			toast.error('Failed to upload media. Please try again.')
			setMediaPreview(null)
			setMediaType(null)
		} finally {
			setIsUploading(false)
		}
	}

	const handleRemoveMedia = () => {
		setMediaPreview(null)
		setMediaUrl(null)
		setMediaType(null)
		setContent('')
		setMessageType('text')
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleSave = () => {
		if (mediaUrl && mediaType) {
			onSave(mediaUrl, mediaType, selectedSenderId)
		} else {
			const trimmed = content.trim()
			if (trimmed) {
				onSave(trimmed, messageType, selectedSenderId)
			}
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSave()
		}
		if (e.key === 'Escape') {
			e.preventDefault()
			onCancel()
		}
	}

	// Sender Selector UI
	const showSenderSelector = isLeft && participants && participants.length > 1 && characters

	return (
		<div
			className={cn('flex gap-2 mb-1 animate-in fade-in duration-200 w-full', isLeft ? 'justify-start' : 'justify-end')}
		>
			<div className={cn('relative max-w-[75%]', isLeft ? 'items-start' : 'items-end')}>
				{/* Sender Selector for Group Chats (Left side only) */}
				{showSenderSelector && (
					<div className="flex gap-2 mb-2 ml-1">
						{participants.map(participant => {
							const character = characters?.find(c => c.id === participant.characterId)
							if (!character) return null

							const isSelected = selectedSenderId === participant.characterId

							return (
								<button
									key={participant.characterId}
									type="button"
									onClick={() => setSelectedSenderId(participant.characterId)}
									className={cn(
										'relative rounded-full transition-all duration-200 ring-offset-2 outline-none focus-visible:ring-2',
										isSelected ? 'ring-2 ring-primary ring-offset-1' : 'ring-0 opacity-50 hover:opacity-100'
									)}
									title={`${character.firstName} ${character.lastName}`}
								>
									<CharacterAvatar
										characterId={character.id}
										firstName={character.firstName}
										lastName={character.lastName}
										avatarUrl={character.avatar}
										size={24}
										round
									/>
								</button>
							)
						})}
					</div>
				)}

				{/* Sender name - displayed if not selecting */}
				{!showSenderSelector && senderName && (
					<p className={cn('text-[10px] text-muted-foreground mb-0.5 px-1', isLeft ? 'text-left' : 'text-right')}>
						{senderName}
					</p>
				)}

				{/* Input bubble */}
				<div
					className={cn(
						'relative px-3.5 py-2 rounded-lg flex flex-col gap-2 transition-colors duration-200',
						isLeft ? 'bg-gray-200 text-black' : 'bg-blue-500 text-white'
					)}
				>
					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*,video/*"
						className="hidden"
						onChange={handleMediaUpload}
					/>

					{/* Media Preview */}
					{mediaPreview ? (
						<div className="relative">
							{mediaType === 'image' ? (
								<Image
									src={mediaPreview}
									alt="Preview"
									width={192}
									height={192}
									className="w-48 h-48 object-cover rounded-lg"
								/>
							) : mediaType === 'video' ? (
								<div className="relative w-48 h-48 bg-black rounded-lg overflow-hidden">
									<video src={mediaPreview} className="w-full h-full object-cover">
										<track kind="captions" />
									</video>
									{/* Play icon overlay */}
									<div className="absolute inset-0 flex items-center justify-center bg-black/30">
										<svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
											<path d="M8 5v14l11-7z" />
										</svg>
									</div>
								</div>
							) : null}
							{isUploading && (
								<div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
									<Loader2 className="h-8 w-8 text-white animate-spin" />
								</div>
							)}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full"
								onClick={handleRemoveMedia}
								disabled={isUploading}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					) : (
						/* Textarea with Plus button */
						<div className="flex items-start gap-2">
							{!content && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className={cn('h-5 w-5 shrink-0 mt-0.5', isLeft ? ' text-gray-700' : 'hover:bg-blue-600 text-white')}
									onClick={() => fileInputRef.current?.click()}
									title="Upload image"
								>
									<Plus className="h-4 w-4" />
								</Button>
							)}
							<textarea
								ref={textareaRef}
								className={cn(
									'text-[15px] leading-tight flex-1 bg-transparent border-none outline-none resize-none min-h-[20px]',
									isLeft ? 'text-black' : 'text-white'
								)}
								placeholder="Type message..."
								value={content}
								onChange={e => setContent(e.target.value)}
								onKeyDown={handleKeyDown}
								rows={1}
							/>
						</div>
					)}

					{/* Action buttons */}
					<div className="flex gap-1 justify-end -mb-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={cn('h-5 w-5', isLeft ? ' text-gray-700' : 'hover:bg-blue-600 text-white')}
							onClick={onCancel}
							disabled={isUploading}
						>
							<X className="h-3 w-3" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={cn('h-5 w-5', isLeft ? ' text-gray-700' : 'hover:bg-blue-600 text-white')}
							onClick={handleSave}
							disabled={isUploading || (!content.trim() && !mediaUrl)}
						>
							{isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
