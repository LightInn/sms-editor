/**
 * Chapter Schedule Dialog Component
 * Modal for configuring publication scheduling and isPublished status for all chapters
 */

'use client'

import { Badge } from '@smseditor/components/ui/badge'
import { Button } from '@smseditor/components/ui/button'
import { Card, CardContent } from '@smseditor/components/ui/card'
import { DateTimePicker } from '@smseditor/components/ui/date-time-picker'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@smseditor/components/ui/dialog'
import { Label } from '@smseditor/components/ui/label'
import { ScrollArea } from '@smseditor/components/ui/scroll-area'
import { Switch } from '@smseditor/components/ui/switch'
import { type ChapterStatus, getChapterStatus, getStatusFromState } from '@smseditor/lib/chapter-utils'
import { formatRelativeOrAbsolute, getUserTimezone, isPast } from '@smseditor/lib/date-utils'
import { cn } from '@smseditor/lib/utils'
import { Calendar, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { batchUpdateChaptersProgrammedAction } from '../../actions/chapter'
import type { CreatorChapter, CreatorStory } from '../../types/creator-stories'

export interface ChapterScheduleDialogProps {
	story: CreatorStory
	chapters: CreatorChapter[]
	open: boolean
	onOpenChange: (open: boolean) => void
	onUpdate: (updates: Array<{ chapterId: string; programed: string | null; isPublished?: boolean }>) => void
}

interface ChapterScheduleData {
	id: string
	title: string
	order: number
	programed: string | null
	isPublished: boolean
	status: ChapterStatus
}

export function ChapterScheduleDialog({ story, chapters, open, onOpenChange, onUpdate }: ChapterScheduleDialogProps) {
	const [chapterSchedules, setChapterSchedules] = useState<ChapterScheduleData[]>([])
	const [isSaving, setIsSaving] = useState(false)

	// Initialize chapter schedules when dialog opens or chapters change
	useEffect(() => {
		const schedules = chapters.map(chapter => ({
			id: chapter.id,
			title: chapter.title || 'Untitled Chapter',
			order: chapter.order,
			programed: chapter.programed,
			isPublished: chapter.isPublished,
			status: getChapterStatus(chapter, story.isPublished),
		}))

		// Sort by order
		schedules.sort((a, b) => a.order - b.order)

		setChapterSchedules(schedules)
	}, [chapters, story.isPublished, open])

	// Get badge variant and label for status
	function getStatusDisplay(status: ChapterStatus): {
		variant: 'default' | 'secondary' | 'outline'
		label: string
		color: string
	} {
		switch (status) {
			case 'draft':
				return { variant: 'secondary', label: 'Draft', color: 'text-white' }
			case 'published':
				return { variant: 'default', label: 'Published', color: 'text-white' }
			case 'scheduled':
				return { variant: 'outline', label: 'Scheduled', color: 'text-white' }
		}
	}

	// Update programed date for a chapter
	const handleDateChange = (chapterId: string, isoString: string | null) => {
		setChapterSchedules(prev =>
			prev.map(schedule => {
				if (schedule.id !== chapterId) return schedule

				// Auto-enable isPublished when a scheduled date is set
				// (scheduling implies the chapter should be published at that date)
				const newIsPublished = isoString ? true : schedule.isPublished

				// Determine new status based on isPublished and programed date
				const newStatus = getStatusFromState(story.isPublished, newIsPublished, isoString)

				return {
					...schedule,
					programed: isoString,
					isPublished: newIsPublished,
					status: newStatus,
				}
			})
		)
	}

	// Update isPublished for a chapter
	const handlePublishedChange = (chapterId: string, isPublished: boolean) => {
		setChapterSchedules(prev =>
			prev.map(schedule => {
				if (schedule.id !== chapterId) return schedule

				// If unpublishing, clear the scheduled date
				const newProgramed = isPublished ? schedule.programed : null

				// Determine new status
				const newStatus = getStatusFromState(story.isPublished, isPublished, newProgramed)

				return {
					...schedule,
					isPublished,
					programed: newProgramed,
					status: newStatus,
				}
			})
		)
	}

	// Save all chapter schedules
	const handleSave = async () => {
		setIsSaving(true)
		try {
			// Prepare batch update data
			const updates = chapterSchedules.map(schedule => ({
				chapterId: schedule.id,
				programed: schedule.programed,
				isPublished: schedule.isPublished,
			}))

			// Use server action for secure batch update
			const result = await batchUpdateChaptersProgrammedAction(updates)

			if (!result.success) {
				throw new Error(result.error || 'Failed to update chapters')
			}

			toast.success(`${result.updatedCount} chapter schedules updated!`)
			onUpdate(updates)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to update chapter schedules:', error)
			toast.error(error instanceof Error ? error.message : 'Failed to update schedules. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	// Get user's timezone for display
	const userTimezone = getUserTimezone()

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl mx-auto max-h-[90vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Chapter Publishing Schedule
					</DialogTitle>
					<DialogDescription className="space-y-1">
						<p>Configure publication dates for each chapter. Leave empty to publish immediately.</p>
						<p className="text-xs flex items-center gap-1">
							<Info className="h-3 w-3" />
							Your timezone: <span className="font-medium">{userTimezone}</span>
						</p>
					</DialogDescription>
				</DialogHeader>

				{/* Info banner if story is not published */}
				{!story.isPublished && (
					<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mb-4">
						<p className="text-sm text-amber-800 dark:text-amber-200">
							<strong>Note:</strong> The story is not published yet. While you can configure chapter publication
							settings, chapters will only become visible to readers after you publish the story.
						</p>
					</div>
				)}

				{/* Chapters list */}
				<ScrollArea className="max-h-[400px] pr-4">
					<div className="space-y-3">
						{chapterSchedules.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<p>No chapters found. Create chapters to schedule them.</p>
							</div>
						) : (
							chapterSchedules.map(schedule => {
								const statusDisplay = getStatusDisplay(schedule.status)

								return (
									<Card key={schedule.id} className="overflow-hidden">
										<CardContent className="p-4">
											<div className="flex items-start gap-4">
												{/* Chapter info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-3">
														<span className="text-sm font-medium text-muted-foreground shrink-0">
															#{schedule.order + 1}
														</span>
														<h4 className="text-sm font-semibold truncate">{schedule.title}</h4>
														<Badge
															variant={statusDisplay.variant}
															className={cn('text-xs shrink-0', statusDisplay.color)}
														>
															{statusDisplay.label}
														</Badge>
													</div>

													{/* Published toggle */}
													<div className="flex items-center justify-between mb-3 p-3 bg-muted/50 rounded-lg">
														<div className="space-y-0.5">
															<Label
																htmlFor={`published-${schedule.id}`}
																className="text-sm font-medium cursor-pointer"
															>
																Publish this chapter
															</Label>
															<p className="text-xs text-muted-foreground">
																{schedule.isPublished ? 'Chapter is visible to readers' : 'Chapter is in draft mode'}
															</p>
														</div>
														<Switch
															id={`published-${schedule.id}`}
															checked={schedule.isPublished}
															onCheckedChange={checked => handlePublishedChange(schedule.id, checked)}
															disabled={isSaving}
														/>
													</div>

													{/* Date picker (only shown if chapter is published) */}
													{schedule.isPublished && (
														<div className="space-y-2">
															<Label htmlFor={`schedule-${schedule.id}`} className="text-xs text-muted-foreground">
																Scheduled Publication Date (optional)
															</Label>
															<DateTimePicker
																value={schedule.programed}
																onChange={isoString => handleDateChange(schedule.id, isoString)}
																disabled={isSaving}
																placeholder="Select date to delay publication"
															/>
															{schedule.programed && (
																<div className="space-y-0.5">
																	<p
																		className={cn(
																			'text-xs font-medium',
																			isPast(schedule.programed)
																				? 'text-red-600 dark:text-red-400'
																				: 'text-green-600 dark:text-green-400'
																		)}
																	>
																		{formatRelativeOrAbsolute(schedule.programed)}
																	</p>
																	{isPast(schedule.programed) && (
																		<p className="text-xs text-muted-foreground">
																			⚠️ Date in the past - chapter is already visible
																		</p>
																	)}
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})
						)}
					</div>
				</ScrollArea>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save All Changes'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
