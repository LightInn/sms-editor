/**
 * Insert Zone Component
 * Invisible hover zone with participant selector
 */

'use client'

import { MessageSquarePlus, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Character, Participant } from '../../../types/creator-stories'
import { getParticipantName } from '../../../types/creator-stories'

export interface InsertZoneProps {
	participants: Participant[]
	characters: Character[]
	onSelect: (senderId: string, position: 'left' | 'right') => void
}

export function InsertZone({ participants, characters, onSelect }: InsertZoneProps) {
	const [isHovered, setIsHovered] = useState(false)

	// Logic to determine if we should show the "Add a message" generic button or individual buttons
	// For left side (received):
	// - If > 1 participant on left side (group chat with multiple others), show generic "Add message"
	// - If only 1 participant on left side (duo), show that person's name
	const leftParticipants = participants.slice(1)
	const isGroupChat = leftParticipants.length > 1
	const firstLeftParticipant = leftParticipants[0]

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Hover detection for insertion UI
		<div className="w-full relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			{/* Hover detection zone (invisible but extends to make hovering easier) */}
			<div className="absolute inset-x-0 -top-2 h-8 z-0" />

			{/* Content area that expands on hover */}
			<div
				className="w-full transition-all duration-200 ease-in-out overflow-hidden relative z-10"
				style={{
					height: isHovered ? '32px' : '0px',
					opacity: isHovered ? 1 : 0,
				}}
			>
				{/* Participant buttons - inline in the flow */}
				<div className="flex justify-between items-center px-2 h-full">
					{/* Left side participants (received messages) */}
					<div className="flex gap-1 items-center">
						{isGroupChat ? (
							// Group Chat: Show generic "Add message" button that triggers the first participant (default)
							// The inline editor will then allow changing the sender
							<button
								type="button"
								className="flex items-center gap-1.5 rounded-full px-3 py-0.5 border shadow-sm backdrop-blur-sm border-gray-300 bg-gray-100/90 text-gray-700 hover:bg-gray-200/90 transition-colors cursor-pointer appearance-none"
								onClick={() => onSelect(firstLeftParticipant.characterId, 'left')}
							>
								<MessageSquarePlus className="h-3.5 w-3.5" />
								<span className="text-[11px] font-medium">Add a message</span>
							</button>
						) : (
							// Duo Chat: Show the specific person button (existing behavior)
							leftParticipants.map(participant => {
								const name = getParticipantName(participant, characters)
								return (
									<button
										key={participant.characterId}
										type="button"
										className="flex items-center gap-1 rounded-full px-2 py-0.5 border shadow-sm backdrop-blur-sm border-gray-300 bg-gray-100/90 text-gray-700 hover:bg-gray-200/90 transition-colors cursor-pointer appearance-none"
										onClick={() => onSelect(participant.characterId, 'left')}
									>
										<Plus className="h-3 w-3" />
										<span className="text-[10px] font-medium">{name}</span>
									</button>
								)
							})
						)}
					</div>

					{/* Right side participant (sent messages - owner) */}
					<div className="flex gap-1 items-center">
						{participants[0] && (
							<button
								type="button"
								className="flex items-center gap-1 rounded-full px-2 py-0.5 border shadow-sm backdrop-blur-sm border-blue-300 bg-blue-100/90 text-blue-700 hover:bg-blue-200/90 transition-colors cursor-pointer appearance-none"
								onClick={() => onSelect(participants[0].characterId, 'right')}
							>
								<Plus className="h-3 w-3" />
								<span className="text-[10px] font-medium">{getParticipantName(participants[0], characters)}</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
