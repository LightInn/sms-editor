/**
 * Message Editor Component
 * Allows adding and editing SMS messages
 */

'use client'

import { ArrowLeft, Clock, Image, Paperclip, Send, Video } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Character, Message, MessageType, Participant } from '../../../types/creator-stories'
import { getParticipantName } from '../../../types/creator-stories'

export interface MessageEditorProps {
	participants: Participant[]
	characters: Character[]
	onSend: (message: Omit<Message, 'id'>) => void
	onCancel?: () => void
	editingMessage?: Message
	defaultSenderId?: string
	showCancel?: boolean
}

export function MessageEditor({
	participants,
	characters,
	onSend,
	onCancel,
	editingMessage,
	defaultSenderId,
	showCancel = false,
}: MessageEditorProps) {
	const [senderId, setSenderId] = useState(editingMessage?.senderId || defaultSenderId || '')
	const [content, setContent] = useState(editingMessage?.content || '')
	const [messageType, setMessageType] = useState<MessageType>(editingMessage?.type || 'text')
	const [position, setPosition] = useState<'left' | 'right'>(editingMessage?.position || 'left')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!content.trim()) return

		// For time_ellipse, senderId is not required
		if (messageType !== 'time_ellipse' && !senderId) return

		const message: Omit<Message, 'id'> = {
			senderId: messageType === 'time_ellipse' ? '' : senderId,
			content: content.trim(),
			type: messageType,
			position: messageType === 'time_ellipse' ? 'left' : position,
			timestamp: editingMessage?.timestamp || new Date().toISOString(),
			dayBreak: false,
			dateLabel: undefined,
		}

		onSend(message)

		// Reset form if not editing
		if (!editingMessage) {
			setContent('')
		}
	}

	const canSubmit = content.trim() && (messageType === 'time_ellipse' || senderId)

	return (
		<form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">{editingMessage ? 'Edit Message' : 'New Message'}</h3>
				{showCancel && onCancel && (
					<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Cancel
					</Button>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3">
				{/* Sender Selection */}
				{messageType !== 'time_ellipse' && (
					<div className="space-y-2">
						<Label htmlFor="sender" className="text-sm text-muted-foreground">
							Sender *
						</Label>
						<Select value={senderId} onValueChange={setSenderId}>
							<SelectTrigger id="sender" className="bg-transparent border">
								<SelectValue placeholder="Select sender" />
							</SelectTrigger>
							<SelectContent>
								{participants.map(participant => (
									<SelectItem key={participant.characterId} value={participant.characterId}>
										{getParticipantName(participant, characters)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Position Selection */}
				{messageType !== 'time_ellipse' && (
					<div className="space-y-2">
						<Label htmlFor="position" className="text-sm text-muted-foreground">
							Position
						</Label>
						<Select value={position} onValueChange={v => setPosition(v as 'left' | 'right')}>
							<SelectTrigger id="position" className="bg-transparent border">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="left">Left (Received)</SelectItem>
								<SelectItem value="right">Right (Sent)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Message Type */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-sm text-muted-foreground">Message Type</Label>
					{messageType === 'text' && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setMessageType('image')}
							className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
						>
							<Paperclip className="h-4 w-4" />
							<span className="text-xs">Attachment</span>
						</Button>
					)}
				</div>
				<div className="grid grid-cols-4 gap-2">
					<Button
						type="button"
						variant={messageType === 'text' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setMessageType('text')}
						className="flex-1"
					>
						Text
					</Button>
					<Button
						type="button"
						variant={messageType === 'image' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setMessageType('image')}
						className="flex-1"
					>
						<Image className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant={messageType === 'video' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setMessageType('video')}
						className="flex-1"
					>
						<Video className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant={messageType === 'time_ellipse' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setMessageType('time_ellipse')}
						className="flex-1"
						title="Time Ellipse"
					>
						<Clock className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Content Input */}
			<div className="space-y-2">
				<Label htmlFor="content" className="text-sm text-muted-foreground">
					{messageType === 'text' ? 'Message' : messageType === 'time_ellipse' ? 'Time Ellipse Text' : 'URL'} *
				</Label>
				{messageType === 'text' || messageType === 'time_ellipse' ? (
					messageType === 'text' ? (
						<Textarea
							id="content"
							className="bg-transparent border min-h-[80px] resize-none"
							placeholder="Type your message..."
							value={content}
							onChange={e => setContent(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
									handleSubmit(e)
								}
							}}
						/>
					) : (
						<Input
							id="content"
							className="bg-transparent border"
							placeholder="e.g., 2 hours later, The next day, A week later..."
							value={content}
							onChange={e => setContent(e.target.value)}
						/>
					)
				) : (
					<Input
						id="content"
						className="bg-transparent border"
						placeholder={messageType === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
						value={content}
						onChange={e => setContent(e.target.value)}
					/>
				)}
				<p className="text-xs text-muted-foreground">
					{messageType === 'text'
						? 'Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send'
						: messageType === 'time_ellipse'
							? 'Add a time gap in the conversation (e.g., "2 hours later")'
							: 'Paste a direct URL to an image or video'}
				</p>
			</div>

			{/* Submit Button */}
			<div className="flex justify-end">
				<Button type="submit" disabled={!canSubmit} size="sm">
					<Send className="h-4 w-4 mr-2" />
					{editingMessage ? 'Update' : 'Add Message'}
				</Button>
			</div>
		</form>
	)
}
