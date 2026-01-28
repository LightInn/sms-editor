'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { Editor } from '@tiptap/react'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	Redo,
	Type,
	Underline as UnderlineIcon,
	Undo,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { LinkInputDialog } from './link-input-dialog'

interface EditorToolbarProps {
	editor: Editor
}

const FONT_SIZES = [
	{ label: 'Small', value: '12px' },
	{ label: 'Normal', value: '16px' },
	{ label: 'Medium', value: '18px' },
	{ label: 'Large', value: '24px' },
	{ label: 'X-Large', value: '32px' },
	{ label: 'XX-Large', value: '48px' },
]

export function EditorToolbar({ editor }: EditorToolbarProps) {
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

	const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px'

	return (
		<>
			<div className="border-b bg-muted/50 p-2 flex items-center gap-1 flex-wrap sticky top-0 z-10">
				{/* Undo/Redo */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					className="h-8 w-8 p-0"
					aria-label="Undo"
				>
					<Undo className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					className="h-8 w-8 p-0"
					aria-label="Redo"
				>
					<Redo className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				{/* Font Size */}
				<div className="flex items-center gap-1">
					<Type className="h-4 w-4 text-muted-foreground" />
					<Select value={currentFontSize} onValueChange={value => editor.chain().focus().setFontSize(value).run()}>
						<SelectTrigger className="h-8 w-[100px]" aria-label="Font Size">
							<SelectValue placeholder="Size" />
						</SelectTrigger>
						<SelectContent>
							{FONT_SIZES.map(size => (
								<SelectItem key={size.value} value={size.value}>
									{size.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Separator orientation="vertical" className="h-6 mx-1" />

				{/* Text Formatting */}
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

				{/* Lists */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					data-active={editor.isActive('bulletList')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Bullet List"
				>
					<List className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					data-active={editor.isActive('orderedList')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Ordered List"
				>
					<ListOrdered className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				{/* Text Alignment */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					data-active={editor.isActive({ textAlign: 'left' })}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Align Left"
				>
					<AlignLeft className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					data-active={editor.isActive({ textAlign: 'center' })}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Align Center"
				>
					<AlignCenter className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					data-active={editor.isActive({ textAlign: 'right' })}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Align Right"
				>
					<AlignRight className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().setTextAlign('justify').run()}
					data-active={editor.isActive({ textAlign: 'justify' })}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Align Justify"
				>
					<AlignJustify className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6 mx-1" />

				{/* Other Formatting */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					data-active={editor.isActive('blockquote')}
					className="h-8 w-8 p-0 data-[active=true]:bg-accent"
					aria-label="Blockquote"
				>
					<Quote className="h-4 w-4" />
				</Button>
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
