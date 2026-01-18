'use client'

import { cn } from '@smseditor/lib/utils'
import type { Editor } from '@tiptap/react'

interface CharacterCountDisplayProps {
	editor: Editor
	limit?: number
	className?: string
}

export function CharacterCountDisplay({ editor, limit, className }: CharacterCountDisplayProps) {
	const characterCount = editor.storage.characterCount.characters()
	const wordCount = editor.storage.characterCount.words()

	const isNearLimit = limit && characterCount > limit * 0.9
	const isOverLimit = limit && characterCount > limit

	return (
		<div
			className={cn('text-xs text-muted-foreground flex items-center gap-4 px-4 py-2 border-t bg-muted/30', className)}
		>
			<div className="flex items-center gap-1">
				<span className="font-medium">Words:</span>
				<span>{wordCount.toLocaleString()}</span>
			</div>
			<div className="flex items-center gap-1">
				<span className="font-medium">Characters:</span>
				<span
					className={cn({
						'text-yellow-500': isNearLimit && !isOverLimit,
						'text-destructive font-semibold': isOverLimit,
					})}
				>
					{characterCount.toLocaleString()}
					{limit && ` / ${limit.toLocaleString()}`}
				</span>
			</div>
		</div>
	)
}
