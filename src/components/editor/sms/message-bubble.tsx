/**
 * Message Bubble Component
 * Displays an individual SMS message
 */

'use client'

import { Button } from '@/components/ui/button'
import { CharacterAvatar } from '@/components/ui/character-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@smseditor/lib/utils'
import { Image as ImageIcon, MoreVertical, Play, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import type { Message } from '../../../types/creator-stories'

export interface MessageBubbleProps {
	message: Message
	senderName?: string
	senderFirstName?: string
	senderLastName?: string
	senderAvatar?: string | null
	onDelete: () => void
	onEdit: () => void
	isConsecutive?: boolean
}

export function MessageBubble({
	message,
	senderName,
	senderFirstName,
	senderLastName,
	senderAvatar,
	onDelete,
	onEdit,
	isConsecutive = false,
}: MessageBubbleProps) {
	const isLeft = message.position === 'left'
	const [imageError, setImageError] = useState(false)
	const [imageDimensions, setImageDimensions] = useState({ width: 300, height: 300 })
	const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)

	return (
		<>
			<div
				className={cn(
					'flex w-full group gap-2 items-end',
					isLeft ? 'justify-start' : 'justify-end',
					isConsecutive ? 'mb-1' : 'mb-2'
				)}
			>
				{/* Avatar - left side */}
				{isLeft && senderFirstName && senderLastName && (
					<div className={cn('transition-opacity duration-200', isConsecutive ? 'opacity-0' : 'opacity-100')}>
						<CharacterAvatar
							characterId={message.senderId}
							firstName={senderFirstName}
							lastName={senderLastName}
							avatarUrl={senderAvatar}
							size={32}
							className="mb-0.5"
						/>
					</div>
				)}

				{/* Message bubble container */}
				<div className={cn('relative max-w-[75%]')}>
					{/* Sender name - displayed for both sides */}
					{senderName && !isConsecutive && (
						<p className={cn('text-[10px] text-muted-foreground mb-0.5 px-1', isLeft ? 'text-left' : 'text-right')}>
							{senderName}
						</p>
					)}

					{/* Message bubble */}
					<div className={`relative w-full flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
						{/* Actions menu - absolute top right */}
						<div className={`absolute -top-1 ${isLeft ? '-right-4' : '-left-4'} z-10`}>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-white shadow-sm"
									>
										<MoreVertical className="h-3 w-3 text-black" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align={isLeft ? 'start' : 'end'}>
									<DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
									<DropdownMenuItem onClick={onDelete} className="text-destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<button
							type="button"
							className={cn(
								'text-left relative leading-tight',
								message.type === 'text' ? 'px-3.5 py-2 mt-0.5 rounded-[1.15rem]' : 'p-0',
								isLeft ? 'bg-gray-200 text-black' : 'bg-blue-500 text-white',
								message.type !== 'text' && 'bg-transparent'
							)}
							onClick={() => {
								if (message.type === 'image' || message.type === 'video') {
									setIsMediaViewerOpen(true)
								} else {
									onEdit()
								}
							}}
						>
							{/* Content based on type */}
							{message.type === 'text' ? (
								<div className="text-[15px] leading-tight wrap-break-word block">{message.content}</div>
							) : message.type === 'image' ? (
								<div className="relative group">
									{!imageError ? (
										<div className="relative" style={{ maxWidth: '300px', maxHeight: '400px' }}>
											<Image
												src={message.content}
												alt="Message image"
												width={imageDimensions.width}
												height={imageDimensions.height}
												className="rounded-lg object-cover"
												style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
												onLoad={e => {
													const img = e.target as HTMLImageElement
													const aspectRatio = img.naturalWidth / img.naturalHeight
													const maxWidth = 300
													const maxHeight = 400

													let width = img.naturalWidth
													let height = img.naturalHeight

													// Scale down if larger than max dimensions
													if (width > maxWidth) {
														width = maxWidth
														height = width / aspectRatio
													}
													if (height > maxHeight) {
														height = maxHeight
														width = height * aspectRatio
													}

													setImageDimensions({ width: Math.round(width), height: Math.round(height) })
												}}
												onError={() => setImageError(true)}
											/>
											{/* Hover overlay similar to the template */}
											<div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
												{/* biome-ignore lint/a11y/useSemanticElements: Cannot use button element inside button parent */}
												<div
													role="button"
													tabIndex={0}
													className="inline-flex items-center justify-center rounded-full h-10 w-10 bg-white/30 hover:bg-white/50 focus:ring-4 focus:outline-none focus:ring-white cursor-pointer"
													title="View full image"
													onClick={e => {
														e.stopPropagation()
														setIsMediaViewerOpen(true)
													}}
													onKeyDown={e => {
														if (e.key === 'Enter' || e.key === ' ') {
															e.preventDefault()
															e.stopPropagation()
															setIsMediaViewerOpen(true)
														}
													}}
												>
													<ImageIcon className="w-5 h-5 text-white" />
												</div>
											</div>
										</div>
									) : (
										<div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
											<ImageIcon className="h-12 w-12 text-muted-foreground" />
										</div>
									)}
								</div>
							) : message.type === 'video' ? (
								<div className="relative group">
									<div className="relative w-48 h-48 bg-black rounded-lg overflow-hidden">
										<video className="w-full h-full object-cover">
											<source src={message.content} />
											<track kind="captions" />
										</video>
										{/* Play icon overlay */}
										<div className="absolute inset-0 flex items-center justify-center bg-black/30">
											<Play className="h-12 w-12 text-white fill-white" />
										</div>
										{/* Hover overlay */}
										<div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
											{/* biome-ignore lint/a11y/useSemanticElements: Cannot use button element inside button parent */}
											<div
												role="button"
												tabIndex={0}
												className="inline-flex items-center justify-center rounded-full h-10 w-10 bg-white/30 hover:bg-white/50 focus:ring-4 focus:outline-none focus:ring-white cursor-pointer"
												title="View video"
												onClick={e => {
													e.stopPropagation()
													setIsMediaViewerOpen(true)
												}}
												onKeyDown={e => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault()
														e.stopPropagation()
														setIsMediaViewerOpen(true)
													}
												}}
											>
												<Play className="w-5 h-5 text-white fill-white" />
											</div>
										</div>
									</div>
								</div>
							) : (
								<span className="text-xs text-muted-foreground p-2">{message.type.toUpperCase()}</span>
							)}
						</button>
					</div>
				</div>

				{/* Avatar - right side */}
				{!isLeft && senderFirstName && senderLastName && (
					<div className={cn('transition-opacity duration-200', isConsecutive ? 'opacity-0' : 'opacity-100')}>
						<CharacterAvatar
							characterId={message.senderId}
							firstName={senderFirstName}
							lastName={senderLastName}
							avatarUrl={senderAvatar}
							size={32}
							className="mb-0.5"
						/>
					</div>
				)}
			</div>

			{/* Media Viewer Dialog */}
			<Dialog open={isMediaViewerOpen} onOpenChange={setIsMediaViewerOpen}>
				<DialogContent className="max-w-4xl w-full">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{message.type === 'image' ? (
								<>
									<ImageIcon className="h-5 w-5" />
									Image
								</>
							) : message.type === 'video' ? (
								<>
									<Play className="h-5 w-5" />
									Video
								</>
							) : (
								'Media'
							)}
						</DialogTitle>
					</DialogHeader>
					<div className="relative w-full flex items-center justify-center bg-black/5 rounded-lg">
						{message.type === 'image' && !imageError ? (
							<Image
								src={message.content}
								alt="Full size image"
								width={800}
								height={800}
								className="max-w-full h-auto max-h-[70vh] object-contain rounded-lg"
								onError={() => setImageError(true)}
							/>
						) : message.type === 'video' ? (
							<div className="w-full">
								<video controls className="w-full h-auto max-h-[70vh] rounded-lg">
									<source src={message.content} />
									<track kind="captions" />
									Your browser does not support the video tag.
								</video>
							</div>
						) : (
							<div className="flex flex-col items-center gap-4 p-8">
								<ImageIcon className="h-16 w-16 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">Failed to load media</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
