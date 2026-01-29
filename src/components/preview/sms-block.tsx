/**
 * SMS Block Component
 * Displays SMS conversation using PhonePreviewReadonly
 */

'use client'

import type { ImageRecord } from 'sms-editor/services/imageService'
import type { BlockWithExpand, Character, SMSContent } from 'sms-editor/types/creator-stories'
import { pb } from '@/lib/pocketbase'
import { PhonePreviewReadonly } from './phone-preview-readonly'

export interface SmsBlockProps {
	block: BlockWithExpand
	characters: Character[]
}

export function SmsBlock({ block, characters }: SmsBlockProps) {
	const content = block.content as SMSContent

	if (!content.messages || content.messages.length === 0) {
		return (
			<div className="w-full max-w-4xl mx-auto py-8 px-6">
				{block.title && (
					<h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">{block.title}</h2>
				)}
				<div className="text-center py-12 text-muted-foreground">
					<p className="text-sm">No messages in this conversation</p>
				</div>
			</div>
		)
	}

	// Get conversation avatar URL from expanded data
	let conversationAvatarUrl: string | undefined
	if (block.expand?.conversationAvatar) {
		const avatarRecord = block.expand.conversationAvatar as ImageRecord
		const pbRecord = {
			id: avatarRecord.id,
			collectionId: 'images',
			collectionName: 'images',
		}
		conversationAvatarUrl = pb.files.getURL(pbRecord, avatarRecord.image, { thumb: '100x100' })
	}

	return (
		<div className="w-full py-8">
			{block.title && (
				<div className="max-w-4xl mx-auto px-6 mb-6">
					<h2 className="text-2xl font-bold text-foreground border-b border-border pb-3">{block.title}</h2>
				</div>
			)}
			<PhonePreviewReadonly
				appTarget={block.appTarget || 'imessage'}
				messages={content.messages}
				participants={block.participants || []}
				characters={characters}
				conversationTitle={block.conversationTitle || undefined}
				conversationAvatar={conversationAvatarUrl}
				conversationDate={content.messages[0]?.timestamp}
			/>
		</div>
	)
}
