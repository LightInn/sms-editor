/**
 * Story Editor Header Component
 * Header for the story editor with title and action buttons
 */

'use client'

import JSZip from 'jszip'
import { ArrowLeft, Calendar, Clock, Download, Eye, Save, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { getExportPreviewAction } from '@/actions/exportActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GlobalSaveState } from '@/hooks/use-save-tracking'
import { useStoryEditorState } from '@/hooks/use-story-editor-state'
import { formatShortRelative, isFuture, isPast } from '@/lib/date-utils'
import { updateStoryAction } from '../../actions/story'
import type { CreatorChapter, CreatorStory } from '../../types/creator-stories'
import { ChapterScheduleDialog } from './chapter-schedule-dialog'
import { ExportPreviewDialog } from './export-preview-dialog'
import { SaveIndicator } from './save-indicator'
import { StorySettingsDialog } from './story-settings-dialog'

export interface StoryEditorHeaderProps {
	story: CreatorStory
	chapters: CreatorChapter[]
	activeChapterId?: string | null // Current chapter being edited
	onUpdate: (story: CreatorStory) => void
	onChaptersUpdate?: (updates?: Array<{ chapterId: string; programed: string | null; isPublished?: boolean }>) => void
	globalSaveState?: GlobalSaveState
	onSave?: (() => Promise<void>) | null
	isPreviewMode?: boolean
	onBack?: () => void
}

type BadgeConfig = {
	variant: 'default' | 'secondary' | 'outline' | 'destructive'
	text: string
	tooltip: string
	icon?: 'clock' | null
}

/**
 * Get the story publication status display info
 * Uses theme CSS variables for consistent styling
 */
function getStoryStatusBadges(story: CreatorStory): BadgeConfig[] {
	const badges: BadgeConfig[] = []

	// Publication status - primary variant for published (theme's primary color)
	if (story.isPublished) {
		badges.push({
			variant: 'default',
			text: 'Published',
			tooltip: 'Story is visible to readers',
		})
	} else {
		badges.push({
			variant: 'secondary',
			text: 'Draft',
			tooltip: 'Story is not yet visible to readers',
		})
	}

	// Completed status - outline variant
	if (story.isCompleted) {
		badges.push({
			variant: 'outline',
			text: 'Completed',
			tooltip: 'Story is marked as finished',
		})
	}

	// NSFW status - destructive variant (theme's destructive color)
	if (story.nsfw) {
		badges.push({
			variant: 'destructive',
			text: 'NSFW',
			tooltip: 'Contains adult content',
		})
	}

	return badges
}

/**
 * Get the chapter publication status display info
 * Uses theme CSS variables for consistent styling
 */
function getChapterStatusBadge(chapter: CreatorChapter): BadgeConfig {
	// Check for scheduled publication
	if (chapter.programed) {
		if (isFuture(chapter.programed)) {
			// Scheduled for the future - outline with clock icon
			const relativeTime = formatShortRelative(chapter.programed)
			return {
				variant: 'outline',
				text: `Scheduled ${relativeTime}`,
				tooltip: `Chapter will be published ${relativeTime}`,
				icon: 'clock',
			}
		}
		if (isPast(chapter.programed) && chapter.isPublished) {
			// Already published (scheduled time passed)
			return {
				variant: 'default',
				text: 'Published',
				tooltip: 'Chapter is visible to readers',
				icon: null,
			}
		}
	}

	// Regular publication status
	if (chapter.isPublished) {
		return {
			variant: 'default',
			text: 'Published',
			tooltip: 'Chapter is visible to readers',
			icon: null,
		}
	}

	return {
		variant: 'secondary',
		text: 'Draft',
		tooltip: 'Chapter is not yet visible to readers',
		icon: null,
	}
}

export function StoryEditorHeader({
	story,
	chapters,
	activeChapterId,
	onUpdate,
	onChaptersUpdate,
	globalSaveState,
	onSave,
	isPreviewMode = false,
	onBack,
}: StoryEditorHeaderProps) {
	// URL-synchronized settings state
	const { isSettingsOpen, toggleSettings } = useStoryEditorState()

	const [isToggling, setIsToggling] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isScheduleOpen, setIsScheduleOpen] = useState(false)
	const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false)

	// Get the active chapter if one is selected
	const activeChapter = activeChapterId ? chapters.find(ch => ch.id === activeChapterId) : null

	// Get status badges
	const storyBadges = getStoryStatusBadges(story)
	const chapterBadge = activeChapter ? getChapterStatusBadge(activeChapter) : null

	const handleTogglePublish = async () => {
		setIsToggling(true)
		try {
			const newPublishStatus = !story.isPublished
			const result = await updateStoryAction(story.id, {
				isPublished: newPublishStatus,
			})

			if (!result.success || !result.story) {
				throw new Error(result.error || 'Failed to update story')
			}

			onUpdate(result.story)
			toast.success(result.story.isPublished ? 'Story published!' : 'Story unpublished')
		} catch (error) {
			console.error('Failed to toggle publish:', error)
			toast.error(error instanceof Error ? error.message : 'Failed to update story status')
		} finally {
			setIsToggling(false)
		}
	}

	const handleSave = async () => {
		if (!onSave) return
		setIsSaving(true)
		try {
			await onSave()
			toast.success('Changes saved!')
		} catch (error) {
			console.error('Failed to save:', error)
			toast.error('Failed to save changes')
		} finally {
			setIsSaving(false)
		}
	}

	// Open export preview modal and log story info
	const handleOpenExportPreview = () => {
		console.log('\n========== [Export Preview] STORY INFO ==========')
		console.log(
			'[Export Preview] Story:',
			JSON.stringify(
				{
					id: story.id,
					title: story.title,
					description: story.description,
					slug: story.slug,
					isPublished: story.isPublished,
					isCompleted: story.isCompleted,
					nsfw: story.nsfw,
					categories: story.categories,
					coverImage: story.coverImage,
					author: story.author,
					created: story.created,
					updated: story.updated,
				},
				null,
				2
			)
		)
		console.log('[Export Preview] Characters:', JSON.stringify(story.characters, null, 2))
		console.log('[Export Preview] Chapters count:', chapters.length)
		chapters.forEach((chapter, idx) => {
			console.log(
				`[Export Preview] Chapter ${idx + 1}:`,
				JSON.stringify(
					{
						id: chapter.id,
						title: chapter.title,
						order: chapter.order,
						isPublished: chapter.isPublished,
						programed: chapter.programed,
					},
					null,
					2
				)
			)
		})
		console.log('================================================\n')
		setIsExportPreviewOpen(true)
	}

	// Download all export images as a ZIP file
	const handleDownloadExport = async () => {
		try {
			toast.loading('Fetching export images...', { id: 'export-toast' })

			// First, get the list of all export images from the server action
			const previewData = await getExportPreviewAction(story.id)
			if (!previewData.success) {
				throw new Error('Failed to fetch export preview')
			}

			const imageUrls: string[] = previewData.exportImageUrls || []

			if (imageUrls.length === 0) {
				throw new Error('No images to export')
			}

			toast.loading(`Creating ZIP with ${imageUrls.length} images...`, { id: 'export-toast' })

			// Create ZIP file
			const zip = new JSZip()

			// Download and add each image to the ZIP
			for (let i = 0; i < imageUrls.length; i++) {
				const imageUrl = imageUrls[i]
				const response = await fetch(imageUrl)

				if (!response.ok) {
					console.error(`Failed to download image ${i + 1}`)
					continue
				}

				const blob = await response.blob()
				// Name format: 01.png, 02.png, etc.
				const paddedIndex = String(i + 1).padStart(2, '0')
				zip.file(`${paddedIndex}.png`, blob)
			}

			toast.loading('Generating ZIP file...', { id: 'export-toast' })

			// Generate the ZIP blob
			const zipBlob = await zip.generateAsync({ type: 'blob' })

			// Download the ZIP
			const url = window.URL.createObjectURL(zipBlob)
			const a = document.createElement('a')
			a.href = url
			a.download = `${story.slug || story.id}-export.zip`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)

			toast.success(`${imageUrls.length} images exported as ZIP!`, { id: 'export-toast' })
		} catch (error) {
			console.error('Failed to export:', error)
			toast.error('Failed to export story', { id: 'export-toast' })
		}
	}

	return (
		<div className="border-b bg-background sticky top-0 z-10">
			<div className="flex items-center justify-between px-4 py-3 gap-4">
				{/* Left: Back button and title */}
				<div className="flex items-center gap-3 min-w-0 flex-1">
					{onBack ? (
						<Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}>
							<ArrowLeft className="h-4 w-4" />
						</Button>
					) : (
						<Link href="/editor">
							<Button variant="ghost" size="icon" className="shrink-0">
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
					)}
					<div className="min-w-0 flex-1">
						<h1 className="text-lg font-semibold truncate">{story.title}</h1>
						<div className="flex items-center gap-1.5 mt-1 flex-wrap">
							{/* Story status badges */}
							<span className="text-xs text-muted-foreground">Story:</span>
							{storyBadges.map(badge => (
								<Badge key={badge.text} variant={badge.variant} title={badge.tooltip}>
									{badge.text}
								</Badge>
							))}

							{/* Chapter status badge (only shown when a chapter is active) */}
							{chapterBadge && (
								<>
									<span className="text-muted-foreground mx-0.5">•</span>
									<span className="text-xs text-muted-foreground">Chapter:</span>
									<Badge variant={chapterBadge.variant} title={chapterBadge.tooltip}>
										{chapterBadge.icon === 'clock' && <Clock className="h-3 w-3" />}
										{chapterBadge.text}
									</Badge>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right: Actions */}
				<div className="flex items-center gap-2 shrink-0">
					{/* Export Button - Hidden in preview mode */}
					{!isPreviewMode && (
						<>
							<Button variant="outline" size="sm" className="hidden md:flex" onClick={handleOpenExportPreview}>
								<Download className="mr-2 h-4 w-4" />
								Export
							</Button>
							<Button variant="outline" size="icon" className="md:hidden" onClick={handleOpenExportPreview}>
								<Download className="h-4 w-4" />
							</Button>
						</>
					)}

					{/* Preview/Edit Toggle Button */}
					<Link href={isPreviewMode ? `/editor/${story.id}/edit` : `/editor/${story.id}/preview`}>
						<Button variant="outline" size="sm" className="hidden md:flex">
							<Eye className="mr-2 h-4 w-4" />
							{isPreviewMode ? 'Edit' : 'Preview'}
						</Button>
						<Button variant="outline" size="icon" className="md:hidden">
							<Eye className="h-4 w-4" />
						</Button>
					</Link>

					{/* Settings Button - Hidden in preview mode */}
					{!isPreviewMode && (
						<>
							<Button variant="outline" size="sm" className="hidden md:flex" onClick={() => toggleSettings(true)}>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>
							<Button variant="outline" size="icon" className="md:hidden" onClick={() => toggleSettings(true)}>
								<Settings className="h-4 w-4" />
							</Button>
						</>
					)}

					{/* Save Button - Only visible when onSave is provided and not in preview mode */}
					{onSave && !isPreviewMode && (
						<>
							<Button
								onClick={handleSave}
								disabled={isSaving || !globalSaveState?.isAnyDirty}
								variant={globalSaveState?.isAnyDirty ? 'default' : 'outline'}
								size="sm"
								className="hidden md:flex"
							>
								<Save className="mr-2 h-4 w-4" />
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving || !globalSaveState?.isAnyDirty}
								variant={globalSaveState?.isAnyDirty ? 'default' : 'outline'}
								size="icon"
								className="md:hidden"
							>
								<Save className="h-4 w-4" />
							</Button>
						</>
					)}

					{/* Schedule Button - Hidden in preview mode */}
					{!isPreviewMode && (
						<>
							<Button variant="outline" size="sm" className="hidden md:flex" onClick={() => setIsScheduleOpen(true)}>
								<Calendar className="mr-2 h-4 w-4" />
								Schedule
							</Button>
							<Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsScheduleOpen(true)}>
								<Calendar className="h-4 w-4" />
							</Button>
						</>
					)}

					{/* Publish Toggle - Hidden in preview mode */}
					{!isPreviewMode && (
						<Button
							onClick={handleTogglePublish}
							disabled={isToggling}
							variant={story.isPublished ? 'outline' : 'default'}
							size="sm"
						>
							{isToggling ? 'Updating...' : story.isPublished ? 'Unpublish' : 'Publish'}
						</Button>
					)}
				</div>
			</div>

			{/* Global Save indicator - Hidden in preview mode */}
			{globalSaveState && !isPreviewMode && (
				<div className="px-4 pb-2">
					<SaveIndicator
						isSaving={globalSaveState.isAnySaving}
						isDirty={globalSaveState.isAnyDirty}
						lastSaved={globalSaveState.lastGlobalSave}
						error={globalSaveState.lastError}
						itemInfo={
							globalSaveState.lastSavedItem
								? {
										type: globalSaveState.lastSavedItem.type,
										title: globalSaveState.lastSavedItem.title,
									}
								: undefined
						}
					/>
				</div>
			)}

			{/* Settings Dialog - Hidden in preview mode */}
			{!isPreviewMode && (
				<StorySettingsDialog story={story} open={isSettingsOpen} onOpenChange={toggleSettings} onUpdate={onUpdate} />
			)}

			{/* Chapter Schedule Dialog - Hidden in preview mode */}
			{!isPreviewMode && (
				<ChapterScheduleDialog
					story={story}
					chapters={chapters}
					open={isScheduleOpen}
					onOpenChange={setIsScheduleOpen}
					onUpdate={updates => {
						// Callback to refresh chapters after update with optimized partial update
						if (onChaptersUpdate) {
							onChaptersUpdate(updates)
						}
					}}
				/>
			)}

			{/* Export Preview Dialog */}
			{!isPreviewMode && (
				<ExportPreviewDialog
					storyId={story.id}
					open={isExportPreviewOpen}
					onOpenChange={setIsExportPreviewOpen}
					onDownload={handleDownloadExport}
				/>
			)}
		</div>
	)
}
