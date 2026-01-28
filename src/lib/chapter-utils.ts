/**
 * Chapter Status Utilities
 * Centralized chapter status logic extracted from components
 */

import type { CreatorChapter } from '../types/creator-stories'
import { isFuture, isPast } from './date-utils'

// ============================================================================
// TYPES
// ============================================================================

export type ChapterStatus = 'draft' | 'scheduled' | 'published'

export interface BadgeConfig {
	variant: 'default' | 'secondary' | 'outline'
	text: string
	tooltip: string
	icon: 'clock' | null
}

// ============================================================================
// STATUS FUNCTIONS
// ============================================================================

/**
 * Get chapter status based on isPublished, programed date, and story publish status
 * Extracted from chapter-schedule-dialog.tsx
 */
export function getChapterStatus(chapter: CreatorChapter, isStoryPublished: boolean): ChapterStatus {
	// If story is not published, all chapters are effectively drafts
	if (!isStoryPublished) return 'draft'

	// If chapter is not published, it's a draft
	if (!chapter.isPublished) return 'draft'

	// If chapter is published but has a future programed date, it's scheduled
	if (chapter.programed) {
		const programedDate = new Date(chapter.programed)
		const now = new Date()
		if (programedDate > now) return 'scheduled'
	}

	// Otherwise, it's published
	return 'published'
}

/**
 * Helper to determine status from current state values
 * Extracted from chapter-schedule-dialog.tsx
 */
export function getStatusFromState(
	isStoryPublished: boolean,
	isChapterPublished: boolean,
	programed: string | null
): ChapterStatus {
	if (!isStoryPublished) return 'draft'
	if (!isChapterPublished) return 'draft'
	if (programed && !isPast(programed)) return 'scheduled'
	return 'published'
}

/**
 * Get the chapter publication status display info
 * Uses theme CSS variables for consistent styling
 * Extracted from story-editor-header.tsx
 */
export function getChapterStatusBadge(chapter: CreatorChapter): BadgeConfig {
	// Check for scheduled publication
	if (chapter.programed) {
		if (isFuture(chapter.programed)) {
			// Scheduled for the future - outline with clock icon
			// Note: formatShortRelative should be imported from date-utils if needed
			return {
				variant: 'outline',
				text: 'Scheduled',
				tooltip: 'Chapter is scheduled for publication',
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
