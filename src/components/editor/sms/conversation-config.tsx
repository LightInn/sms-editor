/**
 * Conversation Configuration Component
 * Simple configuration panel for SMS conversations
 */

'use client'

import { Calendar } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AppTarget, Character, ConversationType, Participant } from '../../../types/creator-stories'
import { appTargets } from '../../../types/creator-stories'

export interface ConversationConfigProps {
	conversationDate: string
	conversationType: ConversationType
	appTarget: AppTarget
	participants: Participant[]
	characters: Character[]
	hasMessages?: boolean
	onConversationDateChange: (date: string) => void
	onConversationTypeChange: (type: ConversationType) => void
	onAppTargetChange: (target: AppTarget) => void
	onParticipantsChange: (participants: Participant[]) => void
}

export function ConversationConfig({
	conversationDate,
	conversationType,
	appTarget,
	participants,
	characters,
	hasMessages = false,
	onConversationDateChange,
	onConversationTypeChange,
	onAppTargetChange,
	onParticipantsChange,
}: ConversationConfigProps) {
	const handleAddParticipant = (characterId: string) => {
		if (!characterId || participants.some(p => p.characterId === characterId)) return

		const newParticipant: Participant = {
			characterId,
			customName: null,
			position: participants.length === 0 ? 'left' : participants.length === 1 ? 'right' : undefined,
		}

		onParticipantsChange([...participants, newParticipant])
	}

	const handleRemoveParticipant = (characterId: string) => {
		onParticipantsChange(participants.filter(p => p.characterId !== characterId))
	}

	const availableCharacters = characters.filter(char => !participants.some(p => p.characterId === char.id))
	const canAddParticipants = conversationType === 'group' || participants.length < 2

	return (
		<Card>
			<CardContent className="pt-6 space-y-4">
				{/* Row 1: Date, Type, App */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Conversation Date */}
					<div className="space-y-2">
						<Label htmlFor="conversationDate" className="text-sm text-muted-foreground flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							Conversation date
						</Label>
						<Input
							id="conversationDate"
							type="date"
							className="bg-transparent border"
							value={conversationDate}
							onChange={e => onConversationDateChange(e.target.value)}
						/>
					</div>

					{/* Conversation Type */}
					<div className="space-y-2">
						<Label htmlFor="conversationType" className="text-sm text-muted-foreground">
							Type
						</Label>
						<Select value={conversationType} onValueChange={v => onConversationTypeChange(v as ConversationType)}>
							<SelectTrigger id="conversationType" className="bg-transparent border">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="duo">Duo</SelectItem>
								<SelectItem value="group">Group</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* App Target */}
					<div className="space-y-2">
						<Label htmlFor="appTarget" className="text-sm text-muted-foreground">
							App
						</Label>
						<Select value={appTarget} onValueChange={v => onAppTargetChange(v as AppTarget)}>
							<SelectTrigger id="appTarget" className="bg-transparent border">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{appTargets.map(target => (
									<SelectItem key={target} value={target}>
										{target === 'imessage' && 'iMessage'}
										{target === 'whatsapp' && 'WhatsApp'}
										{target === 'instagram' && 'Instagram'}
										{target === 'snapchat' && 'Snapchat'}
										{target === 'google_messages' && 'Google Messages'}
										{target === 'facebook_messenger' && 'Facebook Messenger'}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Row 3: Participants */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-sm text-muted-foreground">
							Participants {conversationType === 'duo' && '(2 people)'}
						</Label>
						{hasMessages && <span className="text-xs text-orange-600 font-medium">🔒 Locked (messages exist)</span>}
					</div>
					{hasMessages ? (
						<div className="p-3 border rounded-md">
							<p className="text-xs">
								⚠️ You cannot modify participants while messages exist in this conversation. Please delete all messages
								first if you need to change participants.
							</p>
						</div>
					) : (
						<p className="text-xs text-muted-foreground/80">
							The first participant will be the phone owner (messages on the right)
						</p>
					)}

					{/* Current Participants */}
					<div className="flex flex-wrap gap-2">
						{participants.map((participant, index) => {
							const character = characters.find(c => c.id === participant.characterId)
							if (!character) return null

							const isOwner = index === 0

							return (
								<div
									key={participant.characterId}
									className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
								>
									<div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
										{character.avatar ? (
											<Image
												src={character.avatar}
												alt={character.firstName}
												width={24}
												height={24}
												className="h-full w-full object-cover"
											/>
										) : (
											<span className="text-[10px] font-medium">
												{character.firstName[0]}
												{character.lastName[0]}
											</span>
										)}
									</div>
									<div className="flex flex-col">
										<span className="font-medium">
											{character.firstName} {character.lastName}
										</span>
										{isOwner && <span className="text-[10px] text-blue-600">Phone owner</span>}
									</div>
									{!hasMessages && (
										<button
											type="button"
											onClick={() => handleRemoveParticipant(participant.characterId)}
											className="ml-1 text-muted-foreground hover:text-foreground"
											aria-label="Remove"
										>
											×
										</button>
									)}
								</div>
							)
						})}

						{/* Add Participant Dropdown */}
						{!hasMessages && canAddParticipants && availableCharacters.length > 0 && (
							<Select onValueChange={handleAddParticipant} value="">
								<SelectTrigger className="w-[160px] bg-transparent border h-8">
									<SelectValue placeholder="+ Add" />
								</SelectTrigger>
								<SelectContent>
									{availableCharacters.map(character => (
										<SelectItem key={character.id} value={character.id}>
											{character.firstName} {character.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					{/* Helper text */}
					{participants.length === 0 && (
						<p className="text-xs text-muted-foreground">
							Add at least {conversationType === 'duo' ? '2' : '1'} participant(s)
						</p>
					)}
					{conversationType === 'duo' && participants.length === 1 && (
						<p className="text-xs text-muted-foreground">Add 1 more participant for a duo conversation</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
