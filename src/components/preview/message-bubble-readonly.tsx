/**
 * Message Bubble Read-Only Component
 * Displays an individual SMS message without editing capabilities
 */

'use client'

import type { Message } from '@sms-editor/types/creator-stories'
import { Image as ImageIcon, Play } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { CharacterAvatar } from '@/components/ui/character-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { proxiedCover, rewriteLegacyPocketbaseUrl } from '@/lib/cover-url'
import { cn } from '@/lib/utils'
import { TimeEllipse } from '../editor/sms/time-ellipse'

export interface MessageBubbleReadonlyProps {
	message: Message
	senderName?: string
	senderFirstName?: string
	senderLastName?: string
	senderAvatar?: string | null
	isConsecutive?: boolean
}

export function MessageBubbleReadonly({
	message,
	senderName,
	senderFirstName,
	senderLastName,
	senderAvatar,
	isConsecutive = false,
}: MessageBubbleReadonlyProps) {
	const isLeft = message.position === 'left'
	// Media authored before the PocketBase server move is stored as an absolute URL on
	// the old host, which no longer answers. Same rewrite the scraped covers get.
	const mediaSrc =
		message.type === 'image' ? proxiedCover(message.content) : rewriteLegacyPocketbaseUrl(message.content)
	const [imageError, setImageError] = useState(false)
	const [imageDimensions, setImageDimensions] = useState({ width: 300, height: 300 })
	const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)

	// Render time ellipse if this is a time_ellipse type message
	if (message.type === 'time_ellipse') {
		return <TimeEllipse content={message.content} readonly />
	}

	return (
		<>
			<div
				className={cn(
					'flex w-full gap-2 items-end',
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
					{/* Sender name */}
					{senderName && !isConsecutive && (
						<p className={cn('text-[10px] text-muted-foreground mb-0.5 px-1', isLeft ? 'text-left' : 'text-right')}>
							{senderName}
						</p>
					)}

					{/* Message bubble */}
					<div className={`relative w-full flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
						<div
							className={cn(
								'text-left relative leading-tight',
								message.type === 'text' ? 'px-3.5 py-2 mt-0.5 rounded-[1.15rem]' : 'p-0',
								isLeft ? 'bg-gray-200 text-black' : 'bg-blue-500 text-white',
								message.type !== 'text' && 'bg-transparent'
							)}
						>
							{/* Content based on type */}
							{message.type === 'text' ? (
								<div className="text-[15px] leading-tight wrap-break-word block whitespace-pre-wrap">
									{message.content}
								</div>
							) : message.type === 'image' ? (
								<button
									type="button"
									onClick={() => setIsMediaViewerOpen(true)}
									className="relative group cursor-pointer"
								>
									{!imageError ? (
										<div className="relative" style={{ maxWidth: '300px', maxHeight: '400px' }}>
											<Image
												src={mediaSrc}
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
											<div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
												<div className="inline-flex items-center justify-center rounded-full h-10 w-10 bg-white/30 hover:bg-white/50">
													<ImageIcon className="w-5 h-5 text-white" />
												</div>
											</div>
										</div>
									) : (
										<div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
											<ImageIcon className="h-12 w-12 text-muted-foreground" />
										</div>
									)}
								</button>
							) : message.type === 'video' ? (
								<button
									type="button"
									onClick={() => setIsMediaViewerOpen(true)}
									className="relative group cursor-pointer"
								>
									<div className="relative w-48 h-48 bg-black rounded-lg overflow-hidden">
										<video className="w-full h-full object-cover">
											<source src={mediaSrc} />
											<track kind="captions" />
										</video>
										<div className="absolute inset-0 flex items-center justify-center bg-black/30">
											<Play className="h-12 w-12 text-white fill-white" />
										</div>
										<div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
											<div className="inline-flex items-center justify-center rounded-full h-10 w-10 bg-white/30 hover:bg-white/50">
												<Play className="w-5 h-5 text-white fill-white" />
											</div>
										</div>
									</div>
								</button>
							) : (
								<span className="text-xs text-muted-foreground p-2">{message.type.toUpperCase()}</span>
							)}
						</div>
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
					<div className="relative w-full flex items-center justify-center bg-black/5 rounded-lg p-4">
						{message.type === 'image' && !imageError ? (
							<Image
								src={mediaSrc}
								alt="Full size image"
								width={800}
								height={800}
								className="max-w-full h-auto max-h-[70vh] object-contain rounded-lg"
								onError={() => setImageError(true)}
							/>
						) : message.type === 'video' ? (
							<div className="w-full">
								<video controls className="w-full h-auto max-h-[70vh] rounded-lg">
									<source src={mediaSrc} />
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
