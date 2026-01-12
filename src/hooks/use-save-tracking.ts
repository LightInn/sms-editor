/**
 * Save Tracking Hook
 * Centralized tracking of save states for blocks and chapters
 * Provides a global view of the most recent save across the entire story
 */

import { useCallback, useMemo, useState } from 'react'

export interface SaveState {
	isSaving: boolean
	isDirty: boolean
	lastSaved: Date | null
	error: Error | null
}

export interface BlockSaveState extends SaveState {
	blockId: string
	blockTitle?: string
}

export interface ChapterSaveState extends SaveState {
	chapterId: string
	chapterTitle?: string
}

export interface GlobalSaveState {
	// Most recent save across all blocks and chapters
	lastGlobalSave: Date | null
	// Any block currently saving
	isAnySaving: boolean
	// Any block with unsaved changes
	isAnyDirty: boolean
	// Most recent error
	lastError: Error | null
	// Details of the most recently saved item
	lastSavedItem: {
		type: 'block' | 'chapter'
		id: string
		title?: string
		timestamp: Date
	} | null
}

export interface UseSaveTrackingReturn {
	// Track save state for a specific block
	updateBlockSaveState: (blockId: string, state: SaveState, blockTitle?: string) => void
	// Track save state for a specific chapter
	updateChapterSaveState: (chapterId: string, state: SaveState, chapterTitle?: string) => void
	// Get save state for a specific block
	getBlockSaveState: (blockId: string) => BlockSaveState | undefined
	// Get save state for a specific chapter
	getChapterSaveState: (chapterId: string) => ChapterSaveState | undefined
	// Get global save state
	globalSaveState: GlobalSaveState
	// Clear save state for a block (when it's deleted)
	clearBlockSaveState: (blockId: string) => void
	// Clear save state for a chapter (when it's deleted)
	clearChapterSaveState: (chapterId: string) => void
}

export function useSaveTracking(): UseSaveTrackingReturn {
	const [blockSaveStates, setBlockSaveStates] = useState<Map<string, BlockSaveState>>(new Map())
	const [chapterSaveStates, setChapterSaveStates] = useState<Map<string, ChapterSaveState>>(new Map())

	// Update block save state
	const updateBlockSaveState = useCallback((blockId: string, state: SaveState, blockTitle?: string) => {
		setBlockSaveStates(prev => {
			const newMap = new Map(prev)
			newMap.set(blockId, {
				blockId,
				blockTitle,
				...state,
			})
			return newMap
		})
	}, [])

	// Update chapter save state
	const updateChapterSaveState = useCallback((chapterId: string, state: SaveState, chapterTitle?: string) => {
		setChapterSaveStates(prev => {
			const newMap = new Map(prev)
			newMap.set(chapterId, {
				chapterId,
				chapterTitle,
				...state,
			})
			return newMap
		})
	}, [])

	// Get block save state
	const getBlockSaveState = useCallback(
		(blockId: string) => {
			return blockSaveStates.get(blockId)
		},
		[blockSaveStates]
	)

	// Get chapter save state
	const getChapterSaveState = useCallback(
		(chapterId: string) => {
			return chapterSaveStates.get(chapterId)
		},
		[chapterSaveStates]
	)

	// Clear block save state
	const clearBlockSaveState = useCallback((blockId: string) => {
		setBlockSaveStates(prev => {
			const newMap = new Map(prev)
			newMap.delete(blockId)
			return newMap
		})
	}, [])

	// Clear chapter save state
	const clearChapterSaveState = useCallback((chapterId: string) => {
		setChapterSaveStates(prev => {
			const newMap = new Map(prev)
			newMap.delete(chapterId)
			return newMap
		})
	}, [])

	// Compute global save state
	const globalSaveState = useMemo((): GlobalSaveState => {
		const allStates = [
			...Array.from(blockSaveStates.values()).map(s => ({
				type: 'block' as const,
				...s,
				id: s.blockId,
				title: s.blockTitle,
			})),
			...Array.from(chapterSaveStates.values()).map(s => ({
				type: 'chapter' as const,
				...s,
				id: s.chapterId,
				title: s.chapterTitle,
			})),
		]

		// Check if any item is saving
		const isAnySaving = allStates.some(s => s.isSaving)

		// Check if any item is dirty
		const isAnyDirty = allStates.some(s => s.isDirty)

		// Find most recent error
		const lastError = allStates.reduce((latestError: Error | null, state) => {
			if (state.error) {
				return state.error
			}
			return latestError
		}, null)

		// Find most recent save
		const savedItems = allStates.filter(s => s.lastSaved !== null)
		const lastSavedItem = savedItems.reduce<GlobalSaveState['lastSavedItem']>((latest, state) => {
			if (!state.lastSaved) return latest
			if (!latest || state.lastSaved > latest.timestamp) {
				return {
					type: state.type,
					id: state.id,
					title: state.title,
					timestamp: state.lastSaved,
				}
			}
			return latest
		}, null)

		const lastGlobalSave = lastSavedItem?.timestamp || null

		return {
			lastGlobalSave,
			isAnySaving,
			isAnyDirty,
			lastError,
			lastSavedItem,
		}
	}, [blockSaveStates, chapterSaveStates])

	return {
		updateBlockSaveState,
		updateChapterSaveState,
		getBlockSaveState,
		getChapterSaveState,
		globalSaveState,
		clearBlockSaveState,
		clearChapterSaveState,
	}
}
