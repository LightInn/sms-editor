/**
 * Rich Text Block Component
 * Displays rich text content using Tailwind Typography
 */

'use client'

import type { RichTextContent } from '@sms-editor/types/creator-stories'
import { cn } from '@/lib/utils'

export interface RichTextBlockProps {
	content: RichTextContent
	title?: string | null
}

export function RichTextBlock({ content, title }: RichTextBlockProps) {
	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-6">
			{title && <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">{title}</h2>}
			<article
				className={cn(
					'prose prose-shadcn prose-lg max-w-none',
					'prose-headings:font-bold prose-headings:text-foreground',
					'prose-p:text-foreground prose-p:leading-relaxed',
					'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
					'prose-strong:text-foreground prose-strong:font-semibold',
					'prose-em:text-muted-foreground',
					'prose-code:text-accent-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
					'prose-pre:bg-muted prose-pre:border prose-pre:border-border',
					'prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground',
					'prose-ul:text-foreground prose-ol:text-foreground',
					'prose-li:text-foreground',
					'prose-hr:border-border',
					'prose-img:rounded-lg prose-img:shadow-md'
				)}
				dangerouslySetInnerHTML={{ __html: content.plateJson }}
			/>
		</div>
	)
}
