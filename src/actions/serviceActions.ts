'use server'

/**
 * Server actions that wrap service methods for client component usage
 * These actions ensure service methods run on the server
 */

import { creatorBlockService } from '../services/creatorBlockService'
import { creatorChapterService } from '../services/creatorChapterService'
import { creatorStoryService } from '../services/creatorStoryService'
import type {
	BlockWithExpand,
	ChapterWithExpand,
	CreateBlockData,
	CreateChapterData,
	Participant,
	StoryWithExpand,
	UpdateBlockData,
} from '../types/creator-stories'

// ============================================================================
// BLOCK ACTIONS
// ============================================================================

/**
 * Get a block by ID with expand
 */
export async function getBlockAction(blockId: string, expand = true) {
	return await creatorBlockService.getBlock(blockId, expand)
}

/**
 * Get blocks for a chapter
 */
export async function getChapterBlocksAction(chapterId: string) {
	return await creatorBlockService.getChapterBlocks(chapterId)
}

/**
 * Create a new block
 */
export async function createBlockAction(data: CreateBlockData) {
	return await creatorBlockService.createBlock(data)
}

/**
 * Delete a block
 */
export async function deleteBlockAction(blockId: string) {
	return await creatorBlockService.deleteBlock(blockId)
}

/**
 * Reorder blocks
 */
export async function reorderBlocksAction(blockIds: string[]) {
	return await creatorBlockService.reorderBlocks(blockIds)
}

/**
 * Find previous conversation data
 */
export async function findPreviousConversationDataAction(
	participants: Participant[],
	blockId: string,
	storyId: string
) {
	return await creatorBlockService.findPreviousConversationData(participants, blockId, storyId)
}

/**
 * Update a block
 */
export async function updateBlockAction(blockId: string, data: UpdateBlockData) {
	return await creatorBlockService.updateBlock(blockId, data)
}

// ============================================================================
// CHAPTER ACTIONS
// ============================================================================

/**
 * Get a chapter by ID with expand
 */
export async function getChapterAction(chapterId: string, expand = true) {
	return await creatorChapterService.getChapter(chapterId, expand)
}

/**
 * Create a new chapter
 */
export async function createChapterAction(data: CreateChapterData) {
	return await creatorChapterService.createChapter(data)
}

/**
 * Delete a chapter
 */
export async function deleteChapterAction(chapterId: string) {
	return await creatorChapterService.deleteChapter(chapterId)
}

/**
 * Reorder chapters
 */
export async function reorderChaptersAction(chapterIds: string[]) {
	return await creatorChapterService.reorderChapters(chapterIds)
}

/**
 * Get chapters for a story
 */
export async function getStoryChaptersAction(storyId: string, expandBlocks = false) {
	return await creatorChapterService.getStoryChapters(storyId, expandBlocks)
}

// ============================================================================
// STORY ACTIONS
// ============================================================================

/**
 * Get a story by ID with expand
 */
export async function getStoryAction(storyId: string, expand = true) {
	return await creatorStoryService.getStory(storyId, expand)
}
