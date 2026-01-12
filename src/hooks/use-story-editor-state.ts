/**
 * Story Editor URL State Management
 * Uses nuqs to sync editor state with URL params for:
 * - State persistence on reload
 * - Shareable links to specific editor states
 * - Browser back/forward navigation
 */

import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs'

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to manage story editor state via URL params
 *
 * URL params managed:
 * - chapter: Active chapter ID
 * - creating: Whether user is creating a new chapter
 * - settings: Whether settings dialog is open
 *
 * @example
 * const { state, updateState } = useStoryEditorState()
 *
 * // Set active chapter
 * updateState({ chapter: 'chapter-123' })
 *
 * // Open settings
 * updateState({ settings: true })
 */
export function useStoryEditorState() {
	const [state, setState] = useQueryStates(
		{
			// Active chapter ID
			chapter: parseAsString.withDefault(''),

			// Creating new chapter flag
			creating: parseAsBoolean.withDefault(false),

			// Settings dialog open state
			settings: parseAsBoolean.withDefault(false),
		},
		{
			// Use shallow routing to avoid full page reload
			shallow: true,
			// Clear defaults from URL to keep it clean
			clearOnDefault: true,
		}
	)

	/**
	 * Update multiple state values at once
	 */
	const updateState = (updates: Partial<typeof state>) => {
		setState(updates)
	}

	/**
	 * Reset to initial state (no chapter selected)
	 */
	const resetState = () => {
		setState({
			chapter: '',
			creating: false,
			settings: false,
		})
	}

	/**
	 * Set active chapter and reset other states
	 */
	const setActiveChapter = (chapterId: string | null) => {
		setState({
			chapter: chapterId || '',
			creating: false,
		})
	}

	/**
	 * Start creating a new chapter
	 */
	const startCreatingChapter = () => {
		setState({
			chapter: '',
			creating: true,
		})
	}

	/**
	 * Cancel creating a new chapter
	 */
	const cancelCreatingChapter = () => {
		setState({
			creating: false,
		})
	}

	/**
	 * Toggle settings dialog
	 */
	const toggleSettings = (open?: boolean) => {
		setState({
			settings: open ?? !state.settings,
		})
	}

	return {
		// Current state
		state,

		// Individual state values for convenience
		activeChapterId: state.chapter || null,
		isCreatingChapter: state.creating,
		isSettingsOpen: state.settings,

		// Update functions
		updateState,
		resetState,
		setActiveChapter,
		startCreatingChapter,
		cancelCreatingChapter,
		toggleSettings,
	}
}
