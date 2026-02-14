'use client'

import { useAutosave } from '@sms-editor/hooks/use-autosave'
import { formatSaveTime, getSaveStatusColorClass } from '@sms-editor/lib/format-save-time'
import { cn } from '@sms-editor/lib/utils'
import { Settings, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreatorBlock, RichTextContent } from '../../types/creator-stories'
import { TiptapEditor } from './tiptap-editor'

export interface RichTextChapterEditorProps {
	chapter: CreatorBlock
	onSave: (updates: { title: string | null; content: RichTextContent }) => Promise<void>
	onDelete?: (blockId: string) => Promise<void>
	onBackToChapterSettings?: () => void
}

export function RichTextChapterEditor({
	chapter: block,
	onSave,
	onDelete,
	onBackToChapterSettings,
}: RichTextChapterEditorProps) {
	const content = block.content as RichTextContent

	// Content states
	const [editorValue, setEditorValue] = useState(() => {
		return typeof content.plateJson === 'string' ? content.plateJson : ''
	})

	// UI states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// Sync all values when block changes
	useEffect(() => {
		const newContent = typeof content.plateJson === 'string' ? content.plateJson : ''
		setEditorValue(newContent)
	}, [block.id, content.plateJson])

	// Prepare data for autosave
	const chapterData = useMemo(
		() => ({
			title: null,
			content: {
				plateJson: editorValue,
			} as RichTextContent,
		}),
		[editorValue]
	)

	// Autosave callback
	const handleAutosave = useCallback(
		async (data: { title: string | null; content: RichTextContent }) => {
			try {
				await onSave(data)
			} catch (error) {
				console.error('Autosave failed:', error)
				throw error
			}
		},
		[onSave]
	)

	// Auto-save after 2 seconds of inactivity
	const { isSaving, isDirty, lastSaved, error, manualSave } = useAutosave({
		data: chapterData,
		onSave: handleAutosave,
		interval: 2000,
		enabled: true,
		serverTimestamp: block.updated,
	})

	// Format autosave status text
	const getAutosaveStatus = () => {
		if (isSaving) return 'Saving...'
		if (error) return 'Failed to save'
		if (lastSaved) return `Saved ${formatSaveTime(lastSaved)}`
		return 'Not saved yet'
	}

	// Handle block deletion
	const handleDelete = async () => {
		if (!onDelete) return

		setIsDeleting(true)
		try {
			await onDelete(block.id)
			toast.success('Block deleted')
			setDeleteDialogOpen(false)
		} catch (error) {
			console.error('Failed to delete block:', error)
			toast.error('Failed to delete block')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="max-w-4xl mx-auto p-8 space-y-6">
			{/* Header with Autosave Status and Delete Button */}
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2">
					<div
						className={cn(
							'h-2 w-2 rounded-full',
							isSaving
								? 'bg-blue-500 animate-pulse'
								: error
									? 'bg-red-500'
									: getSaveStatusColorClass(isDirty, lastSaved)
						)}
					/>
					<span className="text-sm text-muted-foreground">{getAutosaveStatus()}</span>
				</div>
				<div className="flex items-center gap-2">
					{onBackToChapterSettings && (
						<Button variant="outline" size="sm" onClick={onBackToChapterSettings} className="mr-2">
							<Settings className="h-4 w-4 mr-2" />
							Chapter Settings
						</Button>
					)}
					<Button variant="outline" size="sm" onClick={manualSave} disabled={isSaving}>
						Save Now
					</Button>
					{onDelete && (
						<Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Block
						</Button>
					)}
				</div>
			</div>

			{/* Text Content */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Text Content</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p className="text-xs text-muted-foreground">
							Write your narrative context. This will provide background and context for your story.
						</p>
						<TiptapEditor
							content={editorValue}
							onChange={setEditorValue}
							placeholder="Start writing your narrative context here..."
						/>
						<p className="text-xs text-muted-foreground">
							Rich text editor powered by Tiptap. Use the toolbar to format your text.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this block?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete this block and all its content.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? 'Deleting...' : 'Delete Block'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
