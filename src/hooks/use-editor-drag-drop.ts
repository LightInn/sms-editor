/**
 * useEditorDragDrop Hook
 * Encapsulates dnd-kit setup and drag/drop event handlers for the story editor
 * Extracted from story-editor-client.tsx for better maintainability
 */

'use client'

import { type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback } from 'react'
import type { ChapterWithExpand, CreatorBlock } from '../types/creator-stories'

// ============================================================================
// TYPES
// ============================================================================

interface UseEditorDragDropProps {
	chapters: ChapterWithExpand[]
	blocks: CreatorBlock[]
	onChapterReorder: (reordered: ChapterWithExpand[]) => Promise<void>
	onBlockReorder: (reordered: CreatorBlock[]) => Promise<void>
}

interface UseEditorDragDropReturn {
	sensors: ReturnType<typeof useSensors>
	handleChapterDragEnd: (event: DragEndEvent) => void
	handleBlockDragEnd: (event: DragEndEvent) => void
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditorDragDrop({
	chapters,
	blocks,
	onChapterReorder,
	onBlockReorder,
}: UseEditorDragDropProps): UseEditorDragDropReturn {
	// Configure sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	// Handle chapter drag end
	const handleChapterDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event

			if (over && active.id !== over.id) {
				const oldIndex = chapters.findIndex(ch => ch.id === active.id)
				const newIndex = chapters.findIndex(ch => ch.id === over.id)

				if (oldIndex !== -1 && newIndex !== -1) {
					const reordered = arrayMove(chapters, oldIndex, newIndex)
					onChapterReorder(reordered)
				}
			}
		},
		[chapters, onChapterReorder]
	)

	// Handle block drag end
	const handleBlockDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event

			if (over && active.id !== over.id) {
				const oldIndex = blocks.findIndex(bl => bl.id === active.id)
				const newIndex = blocks.findIndex(bl => bl.id === over.id)

				if (oldIndex !== -1 && newIndex !== -1) {
					const reordered = arrayMove(blocks, oldIndex, newIndex)
					onBlockReorder(reordered)
				}
			}
		},
		[blocks, onBlockReorder]
	)

	return {
		sensors,
		handleChapterDragEnd,
		handleBlockDragEnd,
	}
}
