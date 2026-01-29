/**
 * Media Block Component
 * Displays image or video content
 */

'use client'

import type { ImageRecord } from '@sms-editor/services/imageService'
import type { BlockWithExpand, MediaContent } from '@sms-editor/types/creator-stories'
import { ImageIcon, Play } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { pb } from '@/lib/pocketbase'

export interface MediaBlockProps {
	block: BlockWithExpand
	title?: string | null
}

export function MediaBlock({ block }: MediaBlockProps) {
	const [imageError, setImageError] = useState(false)
	const content = block.content as MediaContent

	// Get media URL from expanded data
	let url: string | undefined
	if (block.expand?.media) {
		const mediaRecord = block.expand.media as ImageRecord
		const pbRecord = {
			id: mediaRecord.id,
			collectionId: 'images',
			collectionName: 'images',
		}
		url = pb.files.getURL(pbRecord, mediaRecord.image)
	} else {
		url = content.mediaUrl
	}

	if (!url) {
		return (
			<div className="w-full max-w-4xl mx-auto py-8 px-6">
				<div className="flex items-center justify-center h-64 bg-muted rounded-lg">
					<div className="text-center">
						<ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
						<p className="text-sm text-muted-foreground">No media available</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-6">
			<div className="relative w-full rounded-lg overflow-hidden shadow-lg">
				{content.mediaType === 'image' ? (
					!imageError ? (
						<div className="relative w-full">
							<Image
								src={url}
								alt={content.mediaAlt || 'Media content'}
								width={1200}
								height={800}
								className="w-full h-auto object-cover rounded-lg"
								onError={() => setImageError(true)}
								priority
							/>
						</div>
					) : (
						<div className="flex items-center justify-center h-96 bg-muted rounded-lg">
							<div className="text-center">
								<ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Failed to load image</p>
							</div>
						</div>
					)
				) : content.mediaType === 'video' ? (
					<div className="relative w-full">
						<video controls className="w-full h-auto rounded-lg" poster={url}>
							<source src={url} />
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					</div>
				) : (
					<div className="flex items-center justify-center h-64 bg-muted rounded-lg">
						<div className="text-center">
							<Play className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Unsupported media type</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
