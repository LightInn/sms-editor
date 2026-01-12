/**
 * Format Save Time Utilities
 * Formats the last save time in a user-friendly way
 */

/**
 * Formats a save timestamp into a user-friendly string
 * - If saved within last 24 hours: shows relative time (e.g., "5 minutes ago", "2 hours ago")
 * - If saved more than 24 hours ago: shows full date and time
 *
 * @param savedAt - The timestamp when the content was last saved (Date object or ISO string)
 * @returns Formatted string describing when the content was saved
 *
 * @example
 * formatSaveTime(new Date()) // "just now"
 * formatSaveTime(new Date(Date.now() - 5 * 60 * 1000)) // "5 minutes ago"
 * formatSaveTime(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2 hours ago"
 * formatSaveTime(new Date(Date.now() - 25 * 60 * 60 * 1000)) // "Dec 24, 2023 at 3:45 PM"
 */
export function formatSaveTime(savedAt: Date | string | null): string {
	if (!savedAt) return ''

	const savedDate = typeof savedAt === 'string' ? new Date(savedAt) : savedAt
	const now = new Date()
	const diffInMs = now.getTime() - savedDate.getTime()
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

	// Less than 24 hours: show relative time
	if (diffInHours < 24) {
		if (diffInMinutes < 1) {
			return 'just now'
		} else if (diffInMinutes === 1) {
			return '1 minute ago'
		} else if (diffInMinutes < 60) {
			return `${diffInMinutes} minutes ago`
		} else if (diffInHours === 1) {
			return '1 hour ago'
		} else {
			return `${diffInHours} hours ago`
		}
	}

	// More than 24 hours: show full date and time
	return savedDate.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	})
}

/**
 * Formats a save timestamp into a shorter format for compact displays
 * - If saved within last hour: shows minutes (e.g., "5m ago")
 * - If saved within last 24 hours: shows hours (e.g., "2h ago")
 * - If saved more than 24 hours ago: shows date (e.g., "Dec 24")
 *
 * @param savedAt - The timestamp when the content was last saved
 * @returns Short formatted string
 *
 * @example
 * formatSaveTimeShort(new Date()) // "now"
 * formatSaveTimeShort(new Date(Date.now() - 5 * 60 * 1000)) // "5m ago"
 * formatSaveTimeShort(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2h ago"
 * formatSaveTimeShort(new Date(Date.now() - 25 * 60 * 60 * 1000)) // "Dec 24"
 */
export function formatSaveTimeShort(savedAt: Date | string | null): string {
	if (!savedAt) return ''

	const savedDate = typeof savedAt === 'string' ? new Date(savedAt) : savedAt
	const now = new Date()
	const diffInMs = now.getTime() - savedDate.getTime()
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

	// Less than 1 hour: show minutes
	if (diffInMinutes < 60) {
		if (diffInMinutes < 1) {
			return 'now'
		}
		return `${diffInMinutes}m ago`
	}

	// Less than 24 hours: show hours
	if (diffInHours < 24) {
		return `${diffInHours}h ago`
	}

	// More than 24 hours: show date
	return savedDate.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
}

/**
 * Gets the appropriate CSS color class for the save status indicator
 * based on the save state (dirty, saved, never saved)
 *
 * @param isDirty - Whether there are unsaved changes
 * @param lastSaved - The timestamp when the content was last saved (null if never saved)
 * @returns Tailwind CSS color class
 *
 * Logic:
 * - Green: Content is saved and no changes since last save
 * - Yellow: There are unsaved changes
 * - Gray: Never saved yet
 */
export function getSaveStatusColorClass(isDirty: boolean, lastSaved: Date | string | null): string {
	// Has unsaved changes → Yellow
	if (isDirty) {
		return 'bg-yellow-500'
	}

	// Saved with no changes → Green
	if (lastSaved) {
		return 'bg-green-500'
	}

	// Never saved → Gray
	return 'bg-gray-400'
}

/**
 * @deprecated Use getSaveStatusColorClass instead
 * This function is kept for backward compatibility but uses time-based colors
 */
export function getSaveTimeColorClass(savedAt: Date | string | null): string {
	if (!savedAt) return 'bg-gray-400'

	const savedDate = typeof savedAt === 'string' ? new Date(savedAt) : savedAt
	const now = new Date()
	const diffInMinutes = Math.floor((now.getTime() - savedDate.getTime()) / (1000 * 60))

	// Green: saved within last 5 minutes
	if (diffInMinutes < 5) {
		return 'bg-green-500'
	}

	// Yellow/orange: saved 5-30 minutes ago
	if (diffInMinutes < 30) {
		return 'bg-yellow-500'
	}

	// Gray: saved more than 30 minutes ago
	return 'bg-gray-400'
}
