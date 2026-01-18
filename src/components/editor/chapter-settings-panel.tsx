/**
 * Chapter Settings Panel Component
 * Displays chapter settings when no block is selected in the editor
 * Allows editing title, scheduled date, published status, and cover image
 */

'use client'

import { Button } from '@smseditor/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smseditor/components/ui/card'
import { DateTimePicker } from '@smseditor/components/ui/date-time-picker'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@smseditor/components/ui/dialog'
import { Input } from '@smseditor/components/ui/input'
import { Label } from '@smseditor/components/ui/label'
import { Switch } from '@smseditor/components/ui/switch'
import { formatRelativeOrAbsolute, isPast } from '@smseditor/lib/date-utils'
import { pb } from '@smseditor/lib/pocketbase'
import { cn } from '@smseditor/lib/utils'
import { Calendar, Image as ImageIcon, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateChapterSettingsAction } from '../../actions/chapter'
import type { ChapterWithExpand } from '../../types/creator-stories'
import { MediaUpload } from './media-upload'

export interface ChapterSettingsPanelProps {
	chapter: ChapterWithExpand
	onDelete: (chapterId: string) => void
	onChapterUpdate?: (chapter: ChapterWithExpand) => void
}

export function ChapterSettingsPanel({ chapter, onDelete, onChapterUpdate }: ChapterSettingsPanelProps) {
	// Form state
	const [title, setTitle] = useState(chapter.title)
	const [programed, setProgramed] = useState<string | null>(chapter.programed)
	const [isPublished, setIsPublished] = useState(chapter.isPublished)
	const [coverImage, setCoverImage] = useState<string>(chapter.coverImage || '')
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

	// UI state
	const [isSaving, setIsSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

	// Update state when chapter changes
	useEffect(() => {
		setTitle(chapter.title)
		setProgramed(chapter.programed)
		setIsPublished(chapter.isPublished)

		// Handle cover image - preserve URL if ID hasn't changed
		const newCoverImageId = chapter.coverImage || ''
		setCoverImage(prev => {
			// If the ID changed, update it
			if (prev !== newCoverImageId) {
				return newCoverImageId
			}
			return prev
		})

		// Extract coverImage URL from expand data if available
		const chapterWithExpand = chapter as ChapterWithExpand
		if (chapterWithExpand.expand?.coverImage) {
			const imageRecord = chapterWithExpand.expand.coverImage
			const url = `${pb.baseUrl}/api/files/images/${imageRecord.id}/${imageRecord.image}`
			setCoverImageUrl(url)
		} else if (!chapter.coverImage) {
			// Only reset URL if coverImage was actually removed
			setCoverImageUrl(null)
		}
		// If chapter.coverImage exists but no expand data, PRESERVE the existing coverImageUrl
		// This happens after save when the response doesn't include expand data

		setIsDirty(false)
	}, [chapter])

	// Track changes
	const handleTitleChange = (value: string) => {
		setTitle(value)
		setIsDirty(true)
	}

	const handleProgramedChange = (value: string | null) => {
		setProgramed(value)
		// Auto-enable isPublished when a scheduled date is set
		// (scheduling implies the chapter should be published at that date)
		if (value) {
			setIsPublished(true)
		}
		setIsDirty(true)
	}

	const handlePublishedChange = (value: boolean) => {
		setIsPublished(value)
		// If unpublishing, clear the scheduled date
		if (!value) {
			setProgramed(null)
		}
		setIsDirty(true)
	}

	const handleCoverImageUpload = (recordId: string, url: string, _alt: string, _type: 'image' | 'video') => {
		setCoverImage(recordId)
		setCoverImageUrl(url)
		setIsDirty(true)
	}

	// Save handler
	const handleSave = async () => {
		if (!title.trim()) {
			toast.error('Chapter title is required')
			return
		}

		setIsSaving(true)
		try {
			const result = await updateChapterSettingsAction(chapter.id, {
				title: title.trim(),
				programed,
				isPublished,
				coverImage: coverImage || null,
			})

			if (result.success && result.chapter) {
				setIsDirty(false)
				toast.success('Chapter saved!')

				// Notify parent of the update
				if (onChapterUpdate) {
					onChapterUpdate(result.chapter)
				}
			} else {
				toast.error(result.error || 'Failed to save chapter')
			}
		} catch (error) {
			console.error('Failed to save chapter:', error)
			toast.error('Failed to save chapter')
		} finally {
			setIsSaving(false)
		}
	}

	// Delete handler
	const handleDelete = () => {
		setShowDeleteDialog(true)
	}

	const handleDeleteConfirm = () => {
		onDelete(chapter.id)
		setShowDeleteDialog(false)
	}

	return (
		<div className="flex items-center justify-center min-h-full p-8">
			<div className="w-full max-w-2xl space-y-6">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2">Chapter Settings</h1>
					<p className="text-muted-foreground">
						Configure this chapter's settings or edit/create a new block throught the sidebar to start adding content
					</p>
				</div>

				{/* Chapter Title */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Chapter Title</CardTitle>
						<CardDescription>The title displayed in the chapter list</CardDescription>
					</CardHeader>
					<CardContent>
						<Input
							value={title}
							onChange={e => handleTitleChange(e.target.value)}
							placeholder="Enter chapter title..."
							maxLength={200}
							disabled={isSaving}
						/>
					</CardContent>
				</Card>

				{/* Publication Status */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Publication Status</CardTitle>
						<CardDescription>Control when this chapter is visible to readers</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Published Toggle */}
						<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
							<div className="space-y-0.5">
								<Label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
									Publish this chapter
								</Label>
								<p className="text-xs text-muted-foreground">
									{isPublished ? 'Chapter is visible to readers' : 'Chapter is in draft mode'}
								</p>
							</div>
							<Switch
								id="isPublished"
								checked={isPublished}
								onCheckedChange={handlePublishedChange}
								disabled={isSaving}
							/>
						</div>

						{/* Scheduled Date */}
						{isPublished && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<Label className="text-sm font-medium">Scheduled Publication Date (optional)</Label>
								</div>
								<DateTimePicker
									value={programed}
									onChange={handleProgramedChange}
									placeholder="Select date to delay publication"
									disabled={isSaving}
								/>
								{programed && (
									<div className="space-y-0.5">
										<p
											className={cn(
												'text-xs font-medium',
												isPast(programed) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
											)}
										>
											{formatRelativeOrAbsolute(programed)}
										</p>
										{isPast(programed) && (
											<p className="text-xs text-muted-foreground">⚠️ Date in the past - chapter is already visible</p>
										)}
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Cover Image */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<ImageIcon className="h-5 w-5" />
							Cover Image
						</CardTitle>
						<CardDescription>Upload an image to display as the chapter cover</CardDescription>
					</CardHeader>
					<CardContent>
						<MediaUpload
							onUpload={handleCoverImageUpload}
							currentMediaUrl={coverImageUrl || undefined}
							currentMediaAlt="Chapter cover image"
							currentMediaType="image"
						/>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex items-center justify-between pt-4">
					<Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete Chapter
					</Button>

					<Button onClick={handleSave} disabled={isSaving || !isDirty}>
						<Save className="h-4 w-4 mr-2" />
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Chapter</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{chapter.title || 'this chapter'}"? This action cannot be undone and will
							also delete all blocks within this chapter.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteConfirm}>
							Delete Chapter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
