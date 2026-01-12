'use client'

import type { Editor } from '@tiptap/react'
import { List, ListOrdered, Plus, Quote } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface EditorFloatingMenuProps {
	editor: Editor
}

export function EditorFloatingMenu({ editor }: EditorFloatingMenuProps) {
	const [isOpen, setIsOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const handleAction = (action: () => void) => {
		action()
		setIsOpen(false)
	}

	useEffect(() => {
		const updateMenu = () => {
			const { selection } = editor.state
			const { $from } = selection
			const currentLineText = $from.parent.textContent

			// Only show on empty paragraphs
			if (currentLineText.length === 0 && menuRef.current) {
				menuRef.current.setAttribute('data-show', 'true')
			} else if (menuRef.current) {
				menuRef.current.setAttribute('data-show', 'false')
				setIsOpen(false)
			}
		}

		editor.on('selectionUpdate', updateMenu)
		editor.on('update', updateMenu)

		return () => {
			editor.off('selectionUpdate', updateMenu)
			editor.off('update', updateMenu)
		}
	}, [editor])

	return (
		<div
			ref={menuRef}
			data-show="false"
			className="floating-menu flex items-center gap-1 bg-popover border rounded-md shadow-lg data-[show=false]:hidden"
			style={{
				position: 'absolute',
				top: '-9999px',
				left: '-9999px',
			}}
		>
			{!isOpen ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setIsOpen(true)}
					className="h-8 w-8 p-0"
					aria-label="Open menu"
				>
					<Plus className="h-4 w-4" />
				</Button>
			) : (
				<div className="flex items-center gap-1 p-1">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => handleAction(() => editor.chain().focus().toggleBulletList().run())}
						className="h-8 w-8 p-0"
						aria-label="Bullet List"
					>
						<List className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => handleAction(() => editor.chain().focus().toggleOrderedList().run())}
						className="h-8 w-8 p-0"
						aria-label="Ordered List"
					>
						<ListOrdered className="h-4 w-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => handleAction(() => editor.chain().focus().toggleBlockquote().run())}
						className="h-8 w-8 p-0"
						aria-label="Blockquote"
					>
						<Quote className="h-4 w-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setIsOpen(false)}
						className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
						aria-label="Close menu"
					>
						×
					</Button>
				</div>
			)}
		</div>
	)
}
