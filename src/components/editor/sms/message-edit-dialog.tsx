/**
 * Message Edit Dialog Component
 * Modal for adding/editing SMS messages
 */

'use client'

import { Image, Send, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@smseditor/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@smseditor/components/ui/dialog'
import { Input } from '@smseditor/components/ui/input'
import { Label } from '@smseditor/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@smseditor/components/ui/select'
import { Textarea } from '@smseditor/components/ui/textarea'
import type { Character, Message, MessageType, Participant } from '../../../types/creator-stories'
import { getCharacterById } from '../../../types/creator-stories'

export interface MessageEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	participants: Participant[]
	characters: Character[]
	message?: Message // If provided, we're editing; otherwise, adding
	onSave: (message: Omit<Message, 'id'>) => void
}

export function MessageEditDialog({
	open,
	onOpenChange,
	participants,
	characters,
	message,
	onSave,
}: MessageEditDialogProps) {
	const [senderId, setSenderId] = useState(message?.senderId || participants[0]?.characterId || '')
	const [content, setContent] = useState(message?.content || '')
	const [messageType, setMessageType] = useState<MessageType>(message?.type || 'text')
	const [position, setPosition] = useState<'left' | 'right'>(message?.position || 'left')

	// Reset form when message or dialog state changes
	useEffect(() => {
		if (open) {
			setSenderId(message?.senderId || participants[0]?.characterId || '')
			setContent(message?.content || '')
			setMessageType(message?.type || 'text')
			setPosition(message?.position || 'left')
		}
	}, [open, message, participants])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!content.trim() || !senderId) return

		const newMessage: Omit<Message, 'id'> = {
			senderId,
			content: content.trim(),
			type: messageType,
			position,
			timestamp: message?.timestamp || new Date().toISOString(),
			dayBreak: false,
		}

		onSave(newMessage)
		onOpenChange(false)

		// Reset form
		if (!message) {
			setContent('')
		}
	}

	const canSubmit = content.trim() && senderId

	// Get sender character for display
	const getSenderDisplayName = (participantId: string) => {
		const participant = participants.find(p => p.characterId === participantId)
		if (!participant) return 'Unknown'

		if (participant.customName) return participant.customName

		const character = getCharacterById(participantId, characters)
		return character ? `${character.firstName} ${character.lastName}` : 'Unknown'
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{message ? 'Edit message' : 'New message'}</DialogTitle>
					<DialogDescription>
						{message ? 'Edit the message content below.' : 'Add a new message to the conversation.'}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						{/* Sender Selection */}
						<div className="space-y-2">
							<Label htmlFor="sender" className="text-sm">
								Sender *
							</Label>
							<Select value={senderId} onValueChange={setSenderId}>
								<SelectTrigger id="sender">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									{participants.map(participant => (
										<SelectItem key={participant.characterId} value={participant.characterId}>
											{getSenderDisplayName(participant.characterId)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Position Selection */}
						<div className="space-y-2">
							<Label htmlFor="position" className="text-sm">
								Position
							</Label>
							<Select value={position} onValueChange={v => setPosition(v as 'left' | 'right')}>
								<SelectTrigger id="position">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="left">Left (Received)</SelectItem>
									<SelectItem value="right">Right (Sent)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Message Type */}
					<div className="space-y-2">
						<Label className="text-sm">Message type</Label>
						<div className="flex gap-2">
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
								<Image className="h-4 w-4 mr-1" />
								Image
							</Button>
							<Button
								type="button"
								variant={messageType === 'video' ? 'default' : 'outline'}
								size="sm"
								onClick={() => setMessageType('video')}
								className="flex-1"
							>
								<Video className="h-4 w-4 mr-1" />
								Video
							</Button>
						</div>
					</div>

					{/* Content Input */}
					<div className="space-y-2">
						<Label htmlFor="content" className="text-sm">
							{messageType === 'text' ? 'Message' : 'URL'} *
						</Label>
						{messageType === 'text' ? (
							<Textarea
								id="content"
								className="min-h-[100px] resize-none"
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
								placeholder={
									messageType === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'
								}
								value={content}
								onChange={e => setContent(e.target.value)}
							/>
						)}
						<p className="text-xs text-muted-foreground">
							{messageType === 'text'
								? 'Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send'
								: 'Paste a direct URL to an image or video'}
						</p>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							<Send className="h-4 w-4 mr-2" />
							{message ? 'Update' : 'Add'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
