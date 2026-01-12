/**
 * Editor Navigation Hook
 * Manages editor navigation state (active chapter and block) in URL query parameters
 * This allows state persistence across page reloads and enables URL sharing
 */

'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

export interface EditorNavigationState {
	activeChapterId: string | null
	activeBlockId: string | null
}

export interface EditorNavigationActions {
	setActiveChapterId: (id: string | null) => void
	setActiveBlockId: (id: string | null) => void
	setNavigation: (state: Partial<EditorNavigationState>) => void
	clearNavigation: () => void
}

export interface UseEditorNavigationReturn extends EditorNavigationState, EditorNavigationActions {}

/**
 * Hook to manage editor navigation state via URL query parameters
 *
 * Usage:
 * ```tsx
 * const { activeChapterId, activeBlockId, setActiveChapterId, setActiveBlockId } = useEditorNavigation()
 * ```
 *
 * URL format: ?chapter=<chapterId>&block=<blockId>
 */
export function useEditorNavigation(): UseEditorNavigationReturn {
	// Use nuqs to manage chapter and block in URL query params
	const [navigation, setNavigationState] = useQueryStates(
		{
			chapter: parseAsString,
			block: parseAsString,
		},
		{
			// Use 'push' to add entries to history (allows back/forward navigation)
			history: 'push',
			// Shallow routing to avoid full page reload
			shallow: true,
			// Clear the URL when both values are null
			clearOnDefault: true,
		}
	)

	// Individual setters for backward compatibility with useState API
	// These are fire-and-forget (void) to match the original useState API
	const setActiveChapterId = useCallback(
		(id: string | null) => {
			void setNavigationState({ chapter: id })
		},
		[setNavigationState]
	)

	const setActiveBlockId = useCallback(
		(id: string | null) => {
			void setNavigationState({ block: id })
		},
		[setNavigationState]
	)

	// Batch setter for updating multiple values at once
	const setNavigation = useCallback(
		(state: Partial<EditorNavigationState>) => {
			const updates: { chapter?: string | null; block?: string | null } = {}
			if ('activeChapterId' in state) updates.chapter = state.activeChapterId ?? null
			if ('activeBlockId' in state) updates.block = state.activeBlockId ?? null
			void setNavigationState(updates)
		},
		[setNavigationState]
	)

	// Clear all navigation state
	const clearNavigation = useCallback(() => {
		void setNavigationState({ chapter: null, block: null })
	}, [setNavigationState])

	return {
		activeChapterId: navigation.chapter,
		activeBlockId: navigation.block,
		setActiveChapterId,
		setActiveBlockId,
		setNavigation,
		clearNavigation,
	}
}
