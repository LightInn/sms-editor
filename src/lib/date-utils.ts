/**
 * Date utilities using Luxon for proper timezone and locale handling
 */

import { DateTime } from 'luxon'

/**
 * Normalize PocketBase date format to ISO 8601
 * PocketBase returns: "2022-01-01 10:00:00.123Z" (space)
 * ISO 8601 expects: "2022-01-01T10:00:00.123Z" (T)
 */
export function normalizePocketBaseDate(dateString: string | null): string | null {
	if (!dateString) return null
	// Replace first space with 'T' to make it ISO 8601 compliant
	return dateString.replace(' ', 'T')
}

/**
 * Convert ISO string to DateTime in local timezone
 * Handles both standard ISO and PocketBase format
 */
export function isoToLocal(isoString: string | null): DateTime | null {
	if (!isoString) return null
	const normalized = normalizePocketBaseDate(isoString)
	return DateTime.fromISO(normalized || '', { zone: 'local' })
}

/**
 * Format datetime for datetime-local input
 * Returns format: YYYY-MM-DDTHH:mm
 */
export function formatForDatetimeInput(isoString: string | null): string {
	if (!isoString) return ''
	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return ''
	return dt.toFormat("yyyy-MM-dd'T'HH:mm")
}

/**
 * Convert datetime-local input value to ISO string
 */
export function datetimeInputToISO(inputValue: string): string | null {
	if (!inputValue) return null
	const dt = DateTime.fromFormat(inputValue, "yyyy-MM-dd'T'HH:mm", { zone: 'local' })
	if (!dt.isValid) return null
	return dt.toUTC().toISO()
}

/**
 * Format date in a human-friendly way with relative time when appropriate
 * Examples:
 * - "in 2 hours" (if < 24h in future)
 * - "3 days ago" (if < 7 days in past)
 * - "15 January 2025 at 14:30" (otherwise)
 */
export function formatRelativeOrAbsolute(isoString: string | null, options?: { locale?: string }): string {
	if (!isoString) return ''

	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return 'Invalid date'

	const now = DateTime.local()
	const diff = dt.diff(now, ['days', 'hours', 'minutes']).toObject()
	const absDays = Math.abs(diff.days || 0)

	// Set locale
	const locale = options?.locale || 'en-US'

	// Use relative time for recent dates (< 7 days)
	if (absDays < 7) {
		return dt.setLocale(locale).toRelative() || dt.toFormat("dd LLL yyyy 'at' HH:mm")
	}

	// Use absolute format for distant dates
	return dt.setLocale(locale).toFormat("dd LLLL yyyy 'at' HH:mm")
}

/**
 * Format date with full details including timezone
 * Example: "Monday 15 January 2025 at 14:30 (UTC+1)"
 */
export function formatFullWithTimezone(isoString: string | null, options?: { locale?: string }): string {
	if (!isoString) return ''

	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return 'Invalid date'

	const locale = options?.locale || 'en-US'
	const formatted = dt.setLocale(locale).toFormat("EEEE dd LLLL yyyy 'at' HH:mm")
	const timezone = dt.toFormat('ZZZZ')

	return `${formatted} (${timezone})`
}

/**
 * Get a short relative time description
 * Examples: "In 2h", "3d ago", "Now"
 */
export function formatShortRelative(isoString: string | null, options?: { locale?: string }): string {
	if (!isoString) return ''

	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return 'Invalid'

	const now = DateTime.local()
	const diff = dt.diff(now, ['days', 'hours', 'minutes']).toObject()

	const days = Math.floor(diff.days || 0)
	const hours = Math.floor(diff.hours || 0)
	const minutes = Math.floor(diff.minutes || 0)

	const locale = options?.locale || 'en-US'
	const isPast = dt < now

	// Within 1 minute
	if (Math.abs(minutes) < 1) {
		return locale.startsWith('fr') ? 'Maintenant' : 'Now'
	}

	// Within 1 hour
	if (Math.abs(hours) < 1) {
		const prefix = isPast ? '' : 'In '
		const suffix = isPast ? ' ago' : ''
		return `${prefix}${Math.abs(minutes)}min${suffix}`
	}

	// Within 1 day
	if (Math.abs(days) < 1) {
		const prefix = isPast ? '' : 'In '
		const suffix = isPast ? ' ago' : ''
		return `${prefix}${Math.abs(hours)}h${suffix}`
	}

	// Days
	const prefix = isPast ? '' : 'In '
	const suffix = isPast ? ' ago' : ''
	return `${prefix}${Math.abs(days)}d${suffix}`
}

/**
 * Check if a date is in the past
 */
export function isPast(isoString: string | null): boolean {
	if (!isoString) return false
	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return false
	return dt < DateTime.local()
}

/**
 * Check if a date is in the future
 */
export function isFuture(isoString: string | null): boolean {
	if (!isoString) return false
	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return false
	return dt > DateTime.local()
}

/**
 * Check if a date is within the next N days
 */
export function isWithinDays(isoString: string | null, days: number): boolean {
	if (!isoString) return false
	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return false

	const now = DateTime.local()
	const future = now.plus({ days })

	return dt >= now && dt <= future
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
	return DateTime.local().zoneName
}

/**
 * Format date in user's locale
 */
export function formatInUserLocale(isoString: string | null): string {
	if (!isoString) return ''

	const dt = isoToLocal(isoString)
	if (!dt?.isValid) return 'Invalid date'

	// Use browser's locale
	const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'

	return dt.setLocale(locale).toLocaleString(DateTime.DATETIME_MED)
}

// ============================================================================
// DISPLAY FORMATTERS (merged from date-formatters.ts)
// ============================================================================

import { formatDistanceToNow } from 'date-fns'

/**
 * Format date for medium display (e.g., "Dec 14, 2024")
 * Replaces duplicated formatDate() in StoryDetail, chapter-detail, etc.
 */
export function formatMediumDate(iso?: string): string {
	if (!iso) return '-'
	try {
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
	} catch {
		return iso
	}
}

/**
 * Format scheduled date for display with time (e.g., "Dec 14, 2024, 10:30 AM")
 * Extracted from OriginalStoryDetail.component.tsx
 */
export function formatScheduledDate(dateString: string): string {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date)
}

/**
 * Format conversation date for SMS preview (e.g., "Saturday, December 14")
 * Used in phone-preview, unified-phone-preview, etc.
 */
export function formatConversationDate(conversationDate?: string | null): string | null {
	if (!conversationDate) return null

	const normalized = normalizePocketBaseDate(conversationDate)
	if (!normalized) return null

	const dt = DateTime.fromISO(normalized)
	if (!dt.isValid) return null

	return dt.toLocaleString({
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	})
}

/**
 * Format time ago from a date string (e.g., "5 min ago", "2 hrs ago")
 * Extracted from Featured.client.tsx
 */
export function timeAgo(dateString: string): string {
	try {
		const date = new Date(dateString)
		const diff = Date.now() - date.getTime()
		const seconds = Math.floor(diff / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		if (seconds < 60) return ` ${seconds} sec ago`
		if (minutes < 60) return ` ${minutes} min ago`
		if (hours < 24) return ` ${hours} hrs ago`
		return ` ${days} day ago`
	} catch {
		return dateString
	}
}

/**
 * Format save time for autosave indicators
 * Uses date-fns formatDistanceToNow
 */
export function formatSaveTimeDistance(lastSaved: Date | number | string): string {
	const date = typeof lastSaved === 'string' ? new Date(lastSaved) : lastSaved
	return formatDistanceToNow(date, { addSuffix: true })
}
