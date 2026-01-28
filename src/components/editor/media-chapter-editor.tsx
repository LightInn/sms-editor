'use client'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAutosave } from '@smseditor/hooks/use-autosave'
import { formatSaveTime, getSaveStatusColorClass } from '@smseditor/lib/format-save-time'
import { cn } from '@smseditor/lib/utils'
import { Settings, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CreatorBlock, MediaContent } from '../../types/creator-stories'
import { MediaUpload } from './media-upload'

export interface MediaChapterEditorProps {
	chapter: CreatorBlock
	onSave: (updates: { title: string | null; content: MediaContent; media?: string | null }) => Promise<void>
	onDelete?: (blockId: string) => Promise<void>
	onBackToChapterSettings?: () => void
}

export function MediaChapterEditor({
	chapter: block,
	onSave,
	onDelete,
	onBackToChapterSettings,
}: MediaChapterEditorProps) {
	const content = block.content as MediaContent

	// Content states
	const [title, setTitle] = useState(block.title || '')
	const [mediaRecordId, setMediaRecordId] = useState(block.media || '')
	const [mediaUrl, setMediaUrl] = useState('')
	const [mediaAlt, setMediaAlt] = useState(content.mediaAlt || '')
	const [mediaType, setMediaType] = useState<'image' | 'video'>(content.mediaType || 'image')

	// UI states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// Sync values when block changes
	useEffect(() => {
		setTitle(block.title || '')
		setMediaAlt(content.mediaAlt || '')
		setMediaType(content.mediaType || 'image')

		// Handle media record ID - preserve if unchanged
		const newMediaRecordId = block.media || ''
		setMediaRecordId(prev => {
			if (prev !== newMediaRecordId) {
				return newMediaRecordId
			}
			return prev
		})

		// Build URL from expand.media if available
		const blockWithExpand = block as import('../../types/creator-stories').BlockWithExpand
		if (blockWithExpand.expand?.media) {
			const record = blockWithExpand.expand.media
			// Construct URL using PocketBase files API
			const url = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/images/${record.id}/${record.image}`
			setMediaUrl(url)
		} else if (!block.media) {
			// Only reset URL if media was actually removed
			setMediaUrl('')
		}
		// If block.media exists but no expand data, PRESERVE the existing mediaUrl
		// This happens after save when the response doesn't include expand data
	}, [block, content])

	// Handle media upload
	const handleMediaUpload = useCallback((recordId: string, url: string, alt: string, type: 'image' | 'video') => {
		setMediaRecordId(recordId)
		setMediaUrl(url)
		setMediaAlt(alt)
		setMediaType(type)
	}, [])

	// Prepare data for autosave
	const chapterData = useMemo(
		() => ({
			title: title.trim() || null,
			content: {
				mediaAlt,
				mediaType,
			} as MediaContent,
			media: mediaRecordId || null,
		}),
		[title, mediaAlt, mediaType, mediaRecordId]
	)

	// Autosave callback
	const handleAutosave = useCallback(
		async (data: { title: string | null; content: MediaContent; media?: string | null }) => {
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

			{/* Chapter Title */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Chapter Title</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="chapter-title">Title</Label>
						<Input
							id="chapter-title"
							type="text"
							value={title}
							onChange={e => setTitle(e.target.value)}
							placeholder="Enter chapter title..."
							className="text-lg font-semibold"
						/>
						<p className="text-xs text-muted-foreground">Give your chapter a descriptive title</p>
					</div>
				</CardContent>
			</Card>

			{/* Media Content */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Media Content</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p className="text-xs text-muted-foreground">
							Upload an image or video to use as context. This will be displayed to readers as a visual resource.
						</p>
						<MediaUpload
							onUpload={handleMediaUpload}
							currentMediaUrl={mediaUrl}
							currentMediaAlt={mediaAlt}
							currentMediaType={mediaType}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this chapter?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the block "{title || 'Untitled'}" and all its
							content.
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
