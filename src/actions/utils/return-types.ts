import type PocketBase from 'pocketbase'

export interface AuthenticatedPB {
	pb: PocketBase
	userId: string
}

export interface ActionResult<T = undefined> {
	success: boolean
	error?: string
	data?: T
}

// Ownership verification result types
export type ChapterOwnershipSuccess = {
	valid: true
	chapter: { id: string; story: string }
	story: { id: string; author: string }
}

export type ChapterOwnershipError = {
	valid: false
	error: string
}

export type ChapterOwnershipResult = ChapterOwnershipSuccess | ChapterOwnershipError

export type MultipleChaptersOwnershipSuccess = {
	valid: true
	chapters: Array<{ id: string; story: string }>
}

export type MultipleChaptersOwnershipError = {
	valid: false
	error: string
}

export type MultipleChaptersOwnershipResult = MultipleChaptersOwnershipSuccess | MultipleChaptersOwnershipError
