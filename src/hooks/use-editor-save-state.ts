/**
 * useEditorSaveState Hook
 * Manages save status and save function references for the active block
 * Extracted from story-editor-client.tsx for better maintainability
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CreatorBlock } from '../types/creator-stories'
import { useSaveTracking } from './use-save-tracking'

// ============================================================================
// TYPES
// ============================================================================

export interface SaveStatus {
	isSaving: boolean
	isDirty: boolean
	lastSaved: Date | null
	error: Error | null
}

interface UseEditorSaveStateProps {
	activeBlockId: string | null
	blocks: CreatorBlock[]
}

interface UseEditorSaveStateReturn {
	saveStatus: SaveStatus
	saveTracking: ReturnType<typeof useSaveTracking>
	currentSaveFnRef: React.MutableRefObject<(() => Promise<void>) | null>
	handleSaveStatusChange: (status: SaveStatus) => void
	handleSetSaveFunction: (saveFn: (() => Promise<void>) | null) => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditorSaveState({ activeBlockId, blocks }: UseEditorSaveStateProps): UseEditorSaveStateReturn {
	// Centralized save tracking
	const saveTracking = useSaveTracking()

	// Save status for the current block
	const [saveStatus, setSaveStatus] = useState<SaveStatus>({
		isSaving: false,
		isDirty: false,
		lastSaved: null,
		error: null,
	})

	// Current save function for the active block/chapter - using ref to avoid re-renders
	const currentSaveFnRef = useRef<(() => Promise<void>) | null>(null)

	// Memoized save status change handler to prevent infinite loops
	const handleSaveStatusChange = useCallback(
		(status: SaveStatus) => {
			setSaveStatus(status)
			// Update centralized save tracking
			if (activeBlockId) {
				const blockTitle = blocks.find(bl => bl.id === activeBlockId)?.title
				saveTracking.updateBlockSaveState(activeBlockId, status, blockTitle || undefined)
			}
		},
		[activeBlockId, blocks, saveTracking]
	)

	// Handler to register the save function from the active editor
	const handleSetSaveFunction = useCallback((saveFn: (() => Promise<void>) | null) => {
		currentSaveFnRef.current = saveFn
	}, [])

	// Reset save function when active block changes
	useEffect(() => {
		currentSaveFnRef.current = null
	}, [activeBlockId])

	return {
		saveStatus,
		saveTracking,
		currentSaveFnRef,
		handleSaveStatusChange,
		handleSetSaveFunction,
	}
}
