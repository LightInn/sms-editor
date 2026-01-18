'use client'

import CharacterCount from '@tiptap/extension-character-count'
import Link from '@tiptap/extension-link'
import { ListKeymap } from '@tiptap/extension-list-keymap'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { cn } from '@smseditor/lib/utils'
import { CharacterCountDisplay } from './components/character-count-display'
import { EditorBubbleMenu } from './components/editor-bubble-menu'
import { EditorFloatingMenu } from './components/editor-floating-menu'
import { EditorToolbar } from './components/editor-toolbar'
import { FontSize } from './extensions/font-size'

export interface TiptapEditorProps {
	content: string
	onChange: (content: string) => void
	placeholder?: string
	className?: string
	characterLimit?: number
}

export function TiptapEditor({
	content,
	onChange,
	placeholder = 'Start writing...',
	className,
	characterLimit,
}: TiptapEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: false, // Disable headings completely
				// Custom dropcursor styling
				dropcursor: {
					color: 'var(--primary)',
					width: 2,
				},
			}),
			// Text formatting
			TextStyle,
			Underline,
			FontSize,

			// Alignment and typography
			TextAlign.configure({
				types: ['paragraph'],
				alignments: ['left', 'center', 'right', 'justify'],
			}),
			Typography,

			// Links
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-accent underline cursor-pointer hover:text-accent-foreground transition-colors',
				},
			}),

			// UI enhancements
			Placeholder.configure({
				placeholder,
			}),
			CharacterCount.configure({
				limit: characterLimit,
			}),
			ListKeymap,
		],
		content,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML())
		},
		editorProps: {
			attributes: {
				class: cn('tiptap focus:outline-none min-h-[400px] p-4 text-base', 'font-serif prose prose-invert max-w-none'),
			},
		},
	})

	// Sync external content changes
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content)
		}
	}, [content, editor])

	if (!editor) {
		return null
	}

	return (
		<div className={cn('border rounded-md bg-background overflow-hidden flex flex-col', className)}>
			{/* Toolbar */}
			<EditorToolbar editor={editor} />

			{/* Editor Content with Bubble and Floating Menus */}
			<div className="relative flex-1 overflow-auto">
				<EditorBubbleMenu editor={editor} />
				<EditorFloatingMenu editor={editor} />
				<EditorContent editor={editor} />
			</div>

			{/* Character Count */}
			<CharacterCountDisplay editor={editor} limit={characterLimit} />
		</div>
	)
}
