/**
 * Chapter Settings Panel Component
 * Allows configuring SMS conversation settings
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Settings2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import type { AppTarget, Character, ConversationType, Participant } from '../../../types/creator-stories'
import { appTargets } from '../../../types/creator-stories'

export interface ChapterSettingsPanelProps {
	conversationType: ConversationType
	appTarget: AppTarget
	participants: Participant[]
	characters: Character[]
	groupName?: string
	onConversationTypeChange: (type: ConversationType) => void
	onAppTargetChange: (target: AppTarget) => void
	onParticipantsChange: (participants: Participant[]) => void
	onGroupNameChange: (name: string) => void
}

export function ChapterSettingsPanel({
	conversationType,
	appTarget,
	participants,
	characters,
	groupName,
	onConversationTypeChange,
	onAppTargetChange,
	onParticipantsChange,
	onGroupNameChange,
}: ChapterSettingsPanelProps) {
	const [localGroupName, setLocalGroupName] = useState(groupName || '')
	const [isOpen, setIsOpen] = useState(false)

	const handleAddParticipant = (characterId: string) => {
		if (participants.some(p => p.characterId === characterId)) return

		const newParticipant: Participant = {
			characterId,
			customName: undefined,
		}

		onParticipantsChange([...participants, newParticipant])
	}

	const handleRemoveParticipant = (characterId: string) => {
		onParticipantsChange(participants.filter(p => p.characterId !== characterId))
	}

	const handleUpdateCustomName = (characterId: string, customName: string) => {
		onParticipantsChange(
			participants.map(p => (p.characterId === characterId ? { ...p, customName: customName || undefined } : p))
		)
	}

	const handleSaveGroupName = () => {
		onGroupNameChange(localGroupName.trim())
	}

	const availableCharacters = characters.filter(char => !participants.some(p => p.characterId === char.id))

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm">
					<Settings2 className="h-4 w-4 mr-2" />
					Conversation Settings
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full px-4 sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Conversation Settings</SheetTitle>
					<SheetDescription>Configure the conversation type, app style, and participants</SheetDescription>
				</SheetHeader>

				<div className="space-y-6 mt-6">
					{/* Conversation Type */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Conversation Type</CardTitle>
							<CardDescription>Choose between a duo or group conversation</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-sm">Duo Conversation</Label>
									<p className="text-xs text-muted-foreground">Two participants only</p>
								</div>
								<Switch
									checked={conversationType === 'duo'}
									onCheckedChange={checked => onConversationTypeChange(checked ? 'duo' : 'group')}
								/>
							</div>
						</CardContent>
					</Card>

					{/* App Target */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Messaging App</CardTitle>
							<CardDescription>Select the app style for the conversation</CardDescription>
						</CardHeader>
						<CardContent>
							<Select value={appTarget} onValueChange={v => onAppTargetChange(v as AppTarget)}>
								<SelectTrigger className="bg-transparent border">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{appTargets.map(target => (
										<SelectItem key={target} value={target}>
											{target.charAt(0).toUpperCase() + target.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					{/* Group Name (for group conversations) */}
					{conversationType === 'group' && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Group Name</CardTitle>
								<CardDescription>Set a custom name for the group chat</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Input
									placeholder="Enter group name"
									className="bg-transparent border"
									value={localGroupName}
									onChange={e => setLocalGroupName(e.target.value)}
									onBlur={handleSaveGroupName}
								/>
							</CardContent>
						</Card>
					)}

					<Separator />

					{/* Participants */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Participants</CardTitle>
							<CardDescription>
								{conversationType === 'duo' ? 'Select exactly 2 participants' : 'Add participants to the group'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Current Participants */}
							{participants.length > 0 && (
								<div className="space-y-2">
									<Label className="text-sm text-muted-foreground">Current Participants</Label>
									{participants.map(participant => {
										const character = characters.find(c => c.id === participant.characterId)
										if (!character) return null

										return (
											<div key={participant.characterId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
												<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
													{character.avatar ? (
														<Image
															src={character.avatar}
															alt={character.firstName}
															width={32}
															height={32}
															className="object-cover"
														/>
													) : (
														<span className="text-xs font-medium">
															{character.firstName[0]}
															{character.lastName[0]}
														</span>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium">
														{character.firstName} {character.lastName}
													</p>
													<Input
														placeholder="Custom name (optional)"
														className="mt-1 h-7 text-xs bg-transparent border"
														value={participant.customName || ''}
														onChange={e => handleUpdateCustomName(participant.characterId, e.target.value)}
													/>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveParticipant(participant.characterId)}
													disabled={conversationType === 'duo' && participants.length <= 2}
												>
													Remove
												</Button>
											</div>
										)
									})}
								</div>
							)}

							{/* Add Participant */}
							{availableCharacters.length > 0 && (conversationType === 'group' || participants.length < 2) && (
								<div className="space-y-2">
									<Label className="text-sm text-muted-foreground">Add Participant</Label>
									<Select onValueChange={handleAddParticipant}>
										<SelectTrigger className="bg-transparent border">
											<SelectValue placeholder="Select a character" />
										</SelectTrigger>
										<SelectContent>
											{availableCharacters.map(character => (
												<SelectItem key={character.id} value={character.id}>
													{character.firstName} {character.lastName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{availableCharacters.length === 0 && participants.length === 0 && (
								<p className="text-sm text-muted-foreground text-center py-4">
									No characters available. Add characters to your story first.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</SheetContent>
		</Sheet>
	)
}
