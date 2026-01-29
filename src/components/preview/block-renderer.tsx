/**
 * Block Renderer Component
 * Routes to appropriate block display component based on block type
 */

'use client'

import type { BlockWithExpand, Character, RichTextContent } from '@sms-editor/types/creator-stories'
import { MediaBlock } from './media-block'
import { RichTextBlock } from './rich-text-block'
import { SmsBlock } from './sms-block'

export interface BlockRendererProps {
	block: BlockWithExpand
	characters: Character[]
}

export function BlockRenderer({ block, characters }: BlockRendererProps) {
	return (
		<div id={`block-${block.id}`} className="scroll-mt-20">
			{(() => {
				switch (block.type) {
					case 'sms_conversation':
						return <SmsBlock block={block} characters={characters} />

					case 'rich_text_content':
						return <RichTextBlock content={block.content as RichTextContent} title={block.title} />

					case 'media_content':
						return <MediaBlock block={block} title={block.title} />

					default:
						return (
							<div className="w-full max-w-4xl mx-auto py-8 px-6">
								<div className="text-center py-12 text-muted-foreground">
									<p className="text-sm">Unknown block type: {block.type}</p>
								</div>
							</div>
						)
				}
			})()}
		</div>
	)
}
