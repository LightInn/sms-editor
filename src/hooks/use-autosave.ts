/**
 * Autosave Hook
 * Automatically saves changes after a debounce delay
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseAutosaveOptions<T> {
	data: T
	onSave: (data: T) => Promise<void>
	interval?: number // Debounce interval in milliseconds (default: 2000)
	enabled?: boolean // Whether autosave is enabled (default: true)
	serverTimestamp?: string // ISO timestamp from the backend (e.g., block.updated)
}

export interface UseAutosaveReturn {
	isSaving: boolean
	isDirty: boolean
	lastSaved: Date | null
	error: Error | null
	manualSave: () => Promise<void>
}

export function useAutosave<T>({
	data,
	onSave,
	interval = 2000,
	enabled = true,
	serverTimestamp,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
	const [isSaving, setIsSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [lastSaved, setLastSaved] = useState<Date | null>(serverTimestamp ? new Date(serverTimestamp) : null)
	const [error, setError] = useState<Error | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const previousDataRef = useRef<T>(data)
	const isMountedRef = useRef(false)

	// Update lastSaved when serverTimestamp changes (e.g., after a save)
	useEffect(() => {
		if (serverTimestamp) {
			setLastSaved(new Date(serverTimestamp))
		}
	}, [serverTimestamp])

	const save = useCallback(async () => {
		if (!enabled) return

		setIsSaving(true)
		setError(null)

		try {
			await onSave(data)
			setLastSaved(new Date())
			previousDataRef.current = data
			setIsDirty(false) // Clear dirty state after successful save
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Failed to save'))
			console.error('Autosave failed:', err)
		} finally {
			setIsSaving(false)
		}
	}, [data, onSave, enabled])

	const manualSave = useCallback(async () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		await save()
	}, [save])

	useEffect(() => {
		// Skip on initial mount
		if (!isMountedRef.current) {
			isMountedRef.current = true
			previousDataRef.current = data
			return
		}

		if (!enabled) return

		// Check if data has changed
		const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current)

		// Update dirty state
		if (hasChanged !== isDirty) {
			setIsDirty(hasChanged)
		}

		if (!hasChanged) return

		// Clear existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		// Set new timeout for autosave
		timeoutRef.current = setTimeout(() => {
			save()
		}, interval)

		// Cleanup
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [data, enabled, interval, save, isDirty])

	return {
		isSaving,
		isDirty,
		lastSaved,
		error,
		manualSave,
	}
}
