'use client'

import type { Editor } from '@tiptap/react'
import { Bold, Italic, Link2, Underline as UnderlineIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@smseditor/components/ui/button'
import { Separator } from '@smseditor/components/ui/separator'
import { LinkInputDialog } from './link-input-dialog'

interface EditorBubbleMenuProps {
	editor: Editor
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null)
	const [linkDialogOpen, setLinkDialogOpen] = useState(false)
	const [initialUrl, setInitialUrl] = useState('')

	const openLinkDialog = useCallback(() => {
		const previousUrl = editor.getAttributes('link').href || ''
		setInitialUrl(previousUrl)
		setLinkDialogOpen(true)
	}, [editor])

	const handleLinkSubmit = useCallback(
		(url: string | null) => {
			// null means cancelled
			if (url === null) {
				return
			}

			// Empty string means remove link
			if (url === '') {
				editor.chain().focus().extendMarkRange('link').unsetLink().run()
				return
			}

			// Set the link
			editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
		},
		[editor]
	)

	useEffect(() => {
		const updateMenu = () => {
			const { selection } = editor.state
			const { from, to } = selection

			if (from === to || !menuRef.current) {
				menuRef.current?.setAttribute('data-show', 'false')
				return
			}

			menuRef.current.setAttribute('data-show', 'true')
		}

		editor.on('selectionUpdate', updateMenu)
		editor.on('update', updateMenu)

		return () => {
			editor.off('selectionUpdate', updateMenu)
			editor.off('update', updateMenu)
		}
	}, [editor])

	return (
		<>
			<div
				ref={menuRef}
				data-show="false"
				className="bubble-menu flex items-center gap-1 p-1 bg-popover border rounded-md shadow-lg data-[show=false]:hidden"
				style={{
					position: 'absolute',
					top: '-9999px',
					left: '-9999px',
				}}
			>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBold().run()}
					data-active={editor.isActive('bold')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Bold"
				>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					data-active={editor.isActive('italic')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Italic"
				>
					<Italic className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					data-active={editor.isActive('underline')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Underline"
				>
					<UnderlineIcon className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={openLinkDialog}
					data-active={editor.isActive('link')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Link"
				>
					<Link2 className="h-4 w-4" />
				</Button>
			</div>

			<LinkInputDialog
				open={linkDialogOpen}
				onOpenChange={setLinkDialogOpen}
				initialUrl={initialUrl}
				onSubmit={handleLinkSubmit}
			/>
		</>
	)
}
