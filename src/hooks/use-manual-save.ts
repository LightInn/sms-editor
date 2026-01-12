/**
 * Manual Save Hook
 * Detects changes and provides manual save functionality with robust change tracking
 * No automatic saving - user has full control
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseManualSaveOptions<T> {
	data: T
	onSave: (data: T) => Promise<T> // Changed: now returns the saved data with updated timestamp
	enabled?: boolean // Whether saving is enabled (default: true)
	serverTimestamp?: string // ISO timestamp from the backend (e.g., chapter.updated)
	onSaveSuccess?: (savedData: T) => void // Callback when save succeeds with server response
}

export interface UseManualSaveReturn {
	isSaving: boolean
	isDirty: boolean // Has unsaved changes
	lastSavedAt: string | null // ISO timestamp from backend
	error: Error | null
	save: () => Promise<void>
	reset: () => void // Reset dirty state without saving
	markAsSaved: (timestamp?: string) => void // Manually mark as saved (e.g., when parent updates)
}

/**
 * Deep equality comparison with normalization for better change detection
 * Handles common edge cases like:
 * - Undefined vs null
 * - Empty arrays vs undefined
 * - Date string comparisons
 */
function normalizeForComparison(obj: unknown): unknown {
	if (obj === null || obj === undefined) return null
	if (typeof obj !== 'object') return obj
	if (Array.isArray(obj)) {
		if (obj.length === 0) return null // Treat empty arrays as null
		return obj.map(normalizeForComparison)
	}
	const normalized: Record<string, unknown> = {}
	const objRecord = obj as Record<string, unknown>
	for (const key of Object.keys(objRecord).sort()) {
		// Skip metadata fields that shouldn't affect dirty state
		if (key === 'created' || key === 'updated' || key === 'id') continue
		const value = objRecord[key]
		if (value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0)) {
			normalized[key] = normalizeForComparison(value)
		}
	}
	return normalized
}

export function useManualSave<T>({
	data,
	onSave,
	enabled = true,
	serverTimestamp,
	onSaveSuccess,
}: UseManualSaveOptions<T>): UseManualSaveReturn {
	const [isSaving, setIsSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(serverTimestamp || null)
	const [error, setError] = useState<Error | null>(null)

	// Store the normalized snapshot of saved data
	const savedDataSnapshotRef = useRef<string | null>(null)
	const isMountedRef = useRef(false)
	const serverTimestampRef = useRef<string | null>(serverTimestamp || null)

	// Update server timestamp when it changes from parent
	useEffect(() => {
		if (serverTimestamp && serverTimestamp !== serverTimestampRef.current) {
			serverTimestampRef.current = serverTimestamp
			setLastSavedAt(serverTimestamp)
		}
	}, [serverTimestamp])

	// Detect changes using normalized comparison
	useEffect(() => {
		const normalizedData = normalizeForComparison(data)
		const currentDataString = JSON.stringify(normalizedData)

		// Initialize on first mount
		if (!isMountedRef.current) {
			isMountedRef.current = true
			savedDataSnapshotRef.current = currentDataString
			return
		}

		// Compare normalized current data with saved snapshot
		const hasChanged = currentDataString !== savedDataSnapshotRef.current

		// Only update if the state actually needs to change
		if (hasChanged !== isDirty) {
			setIsDirty(hasChanged)
		}
	}, [data, isDirty])

	// Manual save function
	const save = useCallback(async () => {
		if (!enabled) {
			return
		}
		if (!isDirty) {
			return
		}

		setIsSaving(true)
		setError(null)

		try {
			// Call the save function and expect the updated data back
			const savedData = await onSave(data)

			// Update the saved snapshot with normalized version
			const normalizedData = normalizeForComparison(data)
			savedDataSnapshotRef.current = JSON.stringify(normalizedData)

			// Extract timestamp from saved data if available
			let newTimestamp: string | null = null
			if (
				savedData &&
				typeof savedData === 'object' &&
				'updated' in savedData &&
				typeof savedData.updated === 'string'
			) {
				newTimestamp = savedData.updated
			} else {
				// Fallback to current time
				newTimestamp = new Date().toISOString()
			}

			serverTimestampRef.current = newTimestamp
			setLastSavedAt(newTimestamp)
			setIsDirty(false)

			// Notify parent with the saved data for reconciliation
			onSaveSuccess?.(savedData)
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to save')
			setError(error)
			console.error('[useManualSave] Save failed:', err)
			throw error
		} finally {
			setIsSaving(false)
		}
	}, [data, onSave, enabled, isDirty, onSaveSuccess])

	// Reset dirty state without saving (discard changes)
	const reset = useCallback(() => {
		const normalizedData = normalizeForComparison(data)
		savedDataSnapshotRef.current = JSON.stringify(normalizedData)
		setIsDirty(false)
	}, [data])

	// Manually mark as saved (for external updates)
	const markAsSaved = useCallback(
		(timestamp?: string) => {
			const normalizedData = normalizeForComparison(data)
			savedDataSnapshotRef.current = JSON.stringify(normalizedData)
			setIsDirty(false)
			if (timestamp) {
				serverTimestampRef.current = timestamp
				setLastSavedAt(timestamp)
			}
		},
		[data]
	)

	return {
		isSaving,
		isDirty,
		lastSavedAt,
		error,
		save,
		reset,
		markAsSaved,
	}
}
