import { safeHtml } from '@sms-editor/lib/safe-html'
import type { CreatorBlock, CreatorStory } from '@sms-editor/types/creator-stories'
import Image from '@/components/global/image-fallback.component'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface OriginalChapterContentProps {
	blocks: CreatorBlock[]
	story: CreatorStory
}

export function OriginalChapterContent({ blocks, story }: OriginalChapterContentProps) {
	const sortedBlocks = blocks.sort((a, b) => a.order - b.order)

	return (
		<div className="space-y-6">
			{sortedBlocks.map(block => (
				<BlockRenderer key={block.id} block={block} story={story} />
			))}
		</div>
	)
}

function BlockRenderer({ block, story }: { block: CreatorBlock; story: CreatorStory }) {
	switch (block.type) {
		case 'sms_conversation':
			return <SMSConversationBlock block={block} story={story} />
		case 'rich_text_content':
			return <RichTextBlock block={block} />
		case 'media_content':
			return <MediaBlock block={block} />
		default:
			return null
	}
}

function SMSConversationBlock({ block, story }: { block: CreatorBlock; story: CreatorStory }) {
	const messages = block.messages || []
	const participants = block.participants || []
	const appTarget = block.appTarget || 'imessage'

	// Create participant map
	const participantMap = new Map(
		participants.map(p => {
			const character = story.characters?.find(c => c.id === p.characterId)
			return [
				p.characterId,
				{
					name: p.customName || character ? `${character.firstName} ${character.lastName}` : 'Unknown',
					position: p.position || 'left',
				},
			]
		})
	)

	return (
		<Card>
			<CardContent className="p-4">
				{block.title && <h3 className="text-lg font-semibold mb-4">{block.title}</h3>}

				<div className="space-y-3">
					{messages.map(message => {
						const participant = participantMap.get(message.senderId)
						const isLeft = participant?.position === 'left' || message.position === 'left'

						return (
							<div key={message.id} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
								<div
									className={`max-w-[80%] rounded-2xl px-4 py-2 ${
										isLeft ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
									}`}
								>
									<div className="text-sm">
										{participant?.name && <span className="font-medium mr-2">{participant.name}:</span>}
										{message.content}
									</div>
									{message.dayBreak && message.dateLabel && (
										<div className="text-xs opacity-70 mt-1">{message.dateLabel}</div>
									)}
								</div>
							</div>
						)
					})}
				</div>

				<div className="mt-4 flex items-center gap-2">
					<Badge variant="outline" className="text-xs">
						{appTarget.replace('_', ' ')}
					</Badge>
					{block.conversationType && (
						<Badge variant="outline" className="text-xs">
							{block.conversationType}
						</Badge>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

function RichTextBlock({ block }: { block: CreatorBlock }) {
	const content = block.content as { plateJson: string }
	return (
		<Card>
			<CardContent className="p-6">
				{block.title && <h3 className="text-lg font-semibold mb-4">{block.title}</h3>}
				<div className="prose prose-sm max-w-none dark:prose-invert" {...safeHtml(content.plateJson)} />
			</CardContent>
		</Card>
	)
}

function MediaBlock({ block }: { block: CreatorBlock }) {
	const content = block.content as { mediaUrl?: string; mediaAlt: string; mediaType: 'image' | 'video' }
	const mediaUrl = content?.mediaUrl || block.media
	const mediaType = content?.mediaType || 'image'

	if (!mediaUrl) return null

	return (
		<Card>
			<CardContent className="p-4">
				{block.title && <h3 className="text-lg font-semibold mb-4">{block.title}</h3>}

				{mediaType === 'image' ? (
					<div className="rounded-lg overflow-hidden">
						<Image
							src={mediaUrl}
							alt={content?.mediaAlt || block.title || 'Media'}
							width={800}
							height={600}
							className="w-full h-auto"
						/>
					</div>
				) : (
					<video src={mediaUrl} controls className="w-full rounded-lg">
						<track kind="captions" src="" label="No captions available" />
						Your browser does not support the video tag.
					</video>
				)}

				{content?.mediaAlt && <p className="text-sm text-muted-foreground mt-2">{content.mediaAlt}</p>}
			</CardContent>
		</Card>
	)
}
