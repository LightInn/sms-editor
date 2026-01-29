/**
 * Phone Preview Read-Only Component
 * Displays SMS messages in a phone-like interface without editing
 */

'use client'

import { BatteryIcon, SignalIcon, WifiIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { AppTarget, Character, Message, Participant } from 'sms-editor/types/creator-stories'
import { appTemplates, getConversationTitle, getParticipantName } from 'sms-editor/types/creator-stories'
import { CharacterAvatar } from '@/components/ui/character-avatar'
import { GroupAvatar } from '@/components/ui/group-avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { DayBreakSeparator } from '../editor/sms/day-break-separator'
import { MessageBubbleReadonly } from './message-bubble-readonly'

export interface PhonePreviewReadonlyProps {
	appTarget: AppTarget
	messages: Message[]
	participants: Participant[]
	characters: Character[]
	conversationTitle?: string
	conversationAvatar?: string
	conversationDate?: string
}

export function PhonePreviewReadonly({
	appTarget,
	messages,
	participants,
	characters,
	conversationTitle,
	conversationAvatar,
	conversationDate,
}: PhonePreviewReadonlyProps) {
	const styles = appTemplates[appTarget]
	const title = conversationTitle || getConversationTitle(participants, characters)

	// Format conversation date for display
	const formattedConversationDate = conversationDate
		? DateTime.fromISO(conversationDate).toLocaleString({
				weekday: 'long',
				month: 'long',
				day: 'numeric',
			})
		: null

	// Client-side time state - updates every minute
	const [currentTime, setCurrentTime] = useState(() => DateTime.now())

	useEffect(() => {
		setCurrentTime(DateTime.now())

		const interval = setInterval(() => {
			setCurrentTime(DateTime.now())
		}, 60000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className="flex flex-col items-center justify-start w-full gap-4 pt-0 pb-8 px-8">
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
								if (conversationAvatar) {
									return (
										<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
											<Image src={conversationAvatar} alt="Conversation" fill className="object-cover" />
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

					{/* Messages Area */}
					<div className={cn('flex-1 overflow-hidden', styles.background)}>
						<ScrollArea className="h-full">
							<div className="px-3 py-3 flex flex-col">
								{/* Conversation Date */}
								{formattedConversationDate && (
									<div className="flex items-center justify-center py-2 mb-2">
										<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
											{formattedConversationDate}
										</span>
									</div>
								)}

								{/* Messages */}
								{messages.map((message, index) => {
									const isConsecutive =
										index > 0 && messages[index - 1].senderId === message.senderId && !message.dayBreak

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

								{/* Empty state */}
								{messages.length === 0 && (
									<div className="text-center py-12 text-muted-foreground">
										<p className="text-sm">No messages in this conversation</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	)
}
