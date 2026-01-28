/**
 * Save Status Utilities
 * Centralized save status formatting extracted from editor components
 */

import { formatSaveTimeDistance } from './date-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface SaveStatusInfo {
	isSaving: boolean
	isDirty?: boolean
	lastSaved?: Date | number | string | null
	error?: Error | null
}

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format autosave status text for display
 * Extracted from rich-text-chapter-editor.tsx and media-chapter-editor.tsx
 */
export function getAutosaveStatus(status: SaveStatusInfo): string {
	const { isSaving, error, lastSaved } = status

	if (isSaving) return 'Saving...'
	if (error) return 'Failed to save'
	if (lastSaved) return `Saved ${formatSaveTimeDistance(lastSaved)}`
	return 'Not saved yet'
}

/**
 * Get item label for save indicator
 * Extracted from save-indicator.tsx
 */
export function getItemLabel(itemInfo?: { type: 'block' | 'chapter'; title?: string }): string {
	if (!itemInfo) return ''
	const typeLabel = itemInfo.type === 'block' ? 'Block' : 'Chapter'
	const titleLabel = itemInfo.title ? ` "${itemInfo.title}"` : ''
	return `${typeLabel}${titleLabel}`
}
