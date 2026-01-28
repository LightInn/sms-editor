/**
 * useStoryEditorData Hook
 * Centralizes CRUD operations for chapters and blocks in the story editor
 * Extracted from story-editor-client.tsx for better maintainability
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { creatorBlockService, creatorChapterService } from '../services'
import type {
	BlockType,
	ChapterWithExpand,
	CreatorBlock,
	CreatorChapter,
	CreatorStory,
	MediaContent,
	RichTextContent,
	SMSContent,
	UpdateBlockData,
} from '../types/creator-stories'

// ============================================================================
// TYPES
// ============================================================================

interface UseStoryEditorDataProps {
	initialStory: CreatorStory
	initialChapters: ChapterWithExpand[]
	activeChapterId: string | null
	activeBlockId: string | null
	setActiveChapterId: (id: string | null) => void
	setActiveBlockId: (id: string | null) => void
}

interface UseStoryEditorDataReturn {
	// State
	story: CreatorStory
	setStory: React.Dispatch<React.SetStateAction<CreatorStory>>
	chapters: ChapterWithExpand[]
	setChapters: React.Dispatch<React.SetStateAction<ChapterWithExpand[]>>
	blocks: CreatorBlock[]
	setBlocks: React.Dispatch<React.SetStateAction<CreatorBlock[]>>
	blockCounts: Record<string, number>

	// Active items
	activeChapter: ChapterWithExpand | undefined
	activeBlock: CreatorBlock | undefined

	// Chapter handlers
	handleChapterCreate: () => void
	handleChapterCreateConfirm: () => Promise<void>
	handleChapterDelete: (chapterId: string) => Promise<void>
	handleChapterReorder: (reordered: ChapterWithExpand[]) => Promise<void>
	handleChapterUpdate: (updatedChapter: ChapterWithExpand) => void
	handleChaptersRefresh: (
		updates?: Array<{ chapterId: string; programed: string | null; isPublished?: boolean }>
	) => Promise<void>

	// Block handlers
	handleBlockCreate: () => void
	handleBlockTypeSelect: (type: BlockType) => Promise<void>
	handleBlockDelete: (blockId: string) => Promise<void>
	handleBlockReorder: (reordered: CreatorBlock[]) => Promise<void>
	handleBlockSave: (blockId: string, data: Partial<CreatorBlock>) => Promise<CreatorBlock>

	// Modal state
	isCreatingChapter: boolean
	setIsCreatingChapter: React.Dispatch<React.SetStateAction<boolean>>
	isCreatingBlock: boolean
	setIsCreatingBlock: React.Dispatch<React.SetStateAction<boolean>>
	newChapterTitle: string
	setNewChapterTitle: React.Dispatch<React.SetStateAction<string>>
}

// ============================================================================
// HOOK
// ============================================================================

export function useStoryEditorData({
	initialStory,
	initialChapters,
	activeChapterId,
	activeBlockId,
	setActiveChapterId,
	setActiveBlockId,
}: UseStoryEditorDataProps): UseStoryEditorDataReturn {
	// Core state
	const [story, setStory] = useState(initialStory)
	const [chapters, setChapters] = useState<ChapterWithExpand[]>(initialChapters)
	const [blocks, setBlocks] = useState<CreatorBlock[]>([])
	const [blockCounts, setBlockCounts] = useState<Record<string, number>>({})

	// Modal state
	const [isCreatingChapter, setIsCreatingChapter] = useState(false)
	const [isCreatingBlock, setIsCreatingBlock] = useState(false)
	const [newChapterTitle, setNewChapterTitle] = useState('')

	// Derived state
	const activeChapter = chapters.find(ch => ch.id === activeChapterId)
	const activeBlock = blocks.find(bl => bl.id === activeBlockId)

	// ============================================================================
	// EFFECTS: Fetch blocks and counts
	// ============================================================================

	useEffect(() => {
		if (!activeChapterId) {
			setBlocks([])
			setActiveBlockId(null)
			return
		}

		const fetchBlocks = async () => {
			try {
				const response = await creatorBlockService.getChapterBlocks(activeChapterId)
				setBlocks(response)
			} catch (error) {
				console.error('Failed to fetch blocks:', error)
				toast.error('Failed to load blocks')
			}
		}

		fetchBlocks()
	}, [activeChapterId, setActiveBlockId])

	useEffect(() => {
		const fetchBlockCounts = async () => {
			const counts: Record<string, number> = {}
			for (const chapter of chapters) {
				try {
					const response = await creatorBlockService.getChapterBlocks(chapter.id)
					counts[chapter.id] = response.length
				} catch {
					counts[chapter.id] = 0
				}
			}
			setBlockCounts(counts)
		}

		if (chapters.length > 0) {
			fetchBlockCounts()
		}
	}, [chapters])

	// ============================================================================
	// CHAPTER HANDLERS
	// ============================================================================

	const handleChapterCreate = useCallback(() => {
		setIsCreatingChapter(true)
		setNewChapterTitle('')
	}, [])

	const handleChapterCreateConfirm = useCallback(async () => {
		if (!newChapterTitle.trim()) {
			toast.error('Chapter title is required')
			return
		}

		try {
			const newChapter = await creatorChapterService.createChapter({
				story: story.id,
				title: newChapterTitle,
				order: chapters.length,
			})

			setChapters(prev => [...prev, newChapter as ChapterWithExpand])
			setActiveChapterId(newChapter.id)
			setActiveBlockId(null)
			setIsCreatingChapter(false)
			setNewChapterTitle('')
			toast.success('Chapter created!')
		} catch (error) {
			console.error('Failed to create chapter:', error)
			toast.error('Failed to create chapter')
		}
	}, [newChapterTitle, story.id, chapters.length, setActiveChapterId, setActiveBlockId])

	const handleChapterDelete = useCallback(
		async (chapterId: string) => {
			try {
				await creatorChapterService.deleteChapter(chapterId)
				setChapters(prev => prev.filter(ch => ch.id !== chapterId))

				if (activeChapterId === chapterId) {
					setActiveChapterId(null)
					setActiveBlockId(null)
				}

				toast.success('Chapter deleted')
			} catch (error) {
				console.error('Failed to delete chapter:', error)
				toast.error('Failed to delete chapter')
			}
		},
		[activeChapterId, setActiveChapterId, setActiveBlockId]
	)

	const handleChapterReorder = useCallback(
		async (reordered: ChapterWithExpand[]) => {
			const previousChapters = chapters
			setChapters(reordered)

			try {
				const chapterIds = reordered.map(ch => ch.id)
				const updatedChapters = await creatorChapterService.reorderChapters(chapterIds)
				const mergedChapters = updatedChapters.map(updated => {
					const existing = reordered.find(ch => ch.id === updated.id)
					return existing ? { ...existing, ...updated } : (updated as ChapterWithExpand)
				})
				setChapters(mergedChapters)
				toast.success('Chapter order updated')
			} catch (error) {
				console.error('Failed to reorder chapters:', error)
				toast.error('Failed to reorder chapters')
				setChapters(previousChapters)
			}
		},
		[chapters, story.id]
	)

	const handleChapterUpdate = useCallback((updatedChapter: ChapterWithExpand) => {
		setChapters(prev => prev.map(ch => (ch.id === updatedChapter.id ? updatedChapter : ch)))
	}, [])

	const handleChaptersRefresh = useCallback(
		async (updates?: Array<{ chapterId: string; programed: string | null; isPublished?: boolean }>) => {
			if (updates && updates.length > 0) {
				// Optimized: apply partial updates without full refetch
				setChapters(prev =>
					prev.map(ch => {
						const update = updates.find(u => u.chapterId === ch.id)
						if (update) {
							return {
								...ch,
								programed: update.programed,
								isPublished: update.isPublished ?? ch.isPublished,
							}
						}
						return ch
					})
				)
			} else {
				// Full refetch
				try {
					const refreshedChapters = await creatorChapterService.getStoryChapters(story.id)
					setChapters(refreshedChapters)
				} catch (error) {
					console.error('Failed to refresh chapters:', error)
					toast.error('Failed to refresh chapters')
				}
			}
		},
		[story.id]
	)

	// ============================================================================
	// BLOCK HANDLERS
	// ============================================================================

	const handleBlockCreate = useCallback(() => {
		setIsCreatingBlock(true)
	}, [])

	const handleBlockTypeSelect = useCallback(
		async (type: BlockType) => {
			if (!activeChapterId) return

			// Prepare default content based on block type
			let content: SMSContent | RichTextContent | MediaContent
			switch (type) {
				case 'sms_conversation':
					content = { messages: [] }
					break
				case 'rich_text_content':
					content = { plateJson: '' }
					break
				case 'media_content':
					content = {
						mediaAlt: '',
						mediaType: 'image' as const,
					}
					break
				default:
					content = { plateJson: '' }
			}

			try {
				const newBlock = await creatorBlockService.createBlock({
					chapter: activeChapterId,
					type,
					order: blocks.length,
					content,
				})

				setBlocks(prev => [...prev, newBlock])
				setActiveBlockId(newBlock.id)
				setIsCreatingBlock(false)
				toast.success('Block created!')
			} catch (error) {
				console.error('Failed to create block:', error)
				toast.error('Failed to create block')
			}
		},
		[activeChapterId, blocks.length, setActiveBlockId]
	)

	const handleBlockDelete = useCallback(
		async (blockId: string) => {
			try {
				await creatorBlockService.deleteBlock(blockId)
				setBlocks(prev => prev.filter(bl => bl.id !== blockId))

				if (activeBlockId === blockId) {
					setActiveBlockId(null)
				}

				toast.success('Block deleted')
			} catch (error) {
				console.error('Failed to delete block:', error)
				toast.error('Failed to delete block')
			}
		},
		[activeBlockId, setActiveBlockId]
	)

	const handleBlockReorder = useCallback(
		async (reordered: CreatorBlock[]) => {
			if (!activeChapterId) return

			const previousBlocks = blocks
			setBlocks(reordered)

			try {
				const blockIds = reordered.map(bl => bl.id)
				const updatedBlocks = await creatorBlockService.reorderBlocks(blockIds)
				setBlocks(updatedBlocks)
				toast.success('Block order updated')
			} catch (error) {
				console.error('Failed to reorder blocks:', error)
				toast.error('Failed to reorder blocks')
				setBlocks(previousBlocks)
			}
		},
		[activeChapterId, blocks]
	)

	const handleBlockSave = useCallback(async (blockId: string, data: Partial<CreatorBlock>): Promise<CreatorBlock> => {
		const payload: UpdateBlockData = {}

		if ('title' in data) payload.title = data.title ?? undefined
		if ('content' in data && data.content) payload.content = data.content as SMSContent | RichTextContent | MediaContent
		if ('conversationType' in data) payload.conversationType = data.conversationType ?? undefined
		if ('conversationTitle' in data) payload.conversationTitle = data.conversationTitle ?? undefined
		// Explicitly preserve null for conversationAvatar to allow deletion
		if ('conversationAvatar' in data)
			payload.conversationAvatar = data.conversationAvatar === null ? '' : data.conversationAvatar
		if ('participants' in data) payload.participants = data.participants ?? undefined
		if ('appTarget' in data) payload.appTarget = data.appTarget ?? undefined
		// Explicitly preserve null for media to allow deletion
		if ('media' in data) payload.media = data.media === null ? '' : data.media
		if ('order' in data && typeof data.order === 'number') payload.order = data.order
		if ('type' in data && data.type) payload.type = data.type

		// SMS blocks provide shorthand messages array
		if ('messages' in data) {
			payload.content = { messages: data.messages ?? [] }
		}

		const updated = await creatorBlockService.updateBlock(blockId, payload)

		setBlocks(prev => prev.map(bl => (bl.id === updated.id ? updated : bl)))

		return updated
	}, [])

	return {
		// State
		story,
		setStory,
		chapters,
		setChapters,
		blocks,
		setBlocks,
		blockCounts,

		// Active items
		activeChapter,
		activeBlock,

		// Chapter handlers
		handleChapterCreate,
		handleChapterCreateConfirm,
		handleChapterDelete,
		handleChapterReorder,
		handleChapterUpdate,
		handleChaptersRefresh,

		// Block handlers
		handleBlockCreate,
		handleBlockTypeSelect,
		handleBlockDelete,
		handleBlockReorder,
		handleBlockSave,

		// Modal state
		isCreatingChapter,
		setIsCreatingChapter,
		isCreatingBlock,
		setIsCreatingBlock,
		newChapterTitle,
		setNewChapterTitle,
	}
}
