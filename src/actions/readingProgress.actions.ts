'use server'

import { headers } from 'next/headers'
import { auth, type ExtendedUser } from '@/lib/auth/auth.server'
import { pb } from '@/lib/pocketbase'

/**
 * Mark a chapter as read - one entry per chapter
 */
export async function markChapterAsRead(chapterId: string, storyId: string): Promise<{ success: boolean }> {
	try {
		const session = await auth.api.getSession({ headers: await headers() })
		const user = session?.user as ExtendedUser
		if (!user || user.subscription !== 'READER') {
			return { success: false }
		}

		// Check if already marked as read
		const existing = await pb
			.collection('c_reading_progress')
			.getFirstListItem(`user="${session.user.id}" && chapter="${chapterId}" && chapter.story="${storyId}"`)
			.catch(() => null)

		if (existing) {
			// Update timestamp
			await pb.collection('c_reading_progress').update(existing.id, {
				lastRead: new Date().toISOString(),
			})
		} else {
			// Create new entry
			await pb.collection('c_reading_progress').create({
				user: session.user.id,
				chapter: chapterId,
				story: storyId,
				lastRead: new Date().toISOString(),
			})
		}

		return { success: true }
	} catch (error) {
		console.error('Failed to mark chapter as read:', error)
		return { success: false }
	}
}

/**
 * Get all read chapters for a story
 */
export async function getReadChapters(storyId: string): Promise<Set<string>> {
	try {
		const session = await auth.api.getSession({ headers: await headers() })
		const user = session?.user as ExtendedUser
		if (!user || user.subscription !== 'READER') {
			return new Set()
		}

		const records = await pb.collection('c_reading_progress').getFullList({
			filter: `user="${user.id}" && chapter.story="${storyId}"`,
		})

		return new Set(records.map(r => r.chapter))
	} catch (error) {
		console.error('Failed to get read chapters:', error)
		return new Set()
	}
}

/**
 * Get all stories with reading progress (for My List page)
 */
export async function getAllStoriesWithProgress() {
	try {
		const session = await auth.api.getSession({ headers: await headers() })
		const user = session?.user as ExtendedUser
		if (!user || user.subscription !== 'READER') {
			return []
		}

		const records = await pb.collection('c_reading_progress').getFullList({
			filter: `user="${user.id}"`,
			sort: '-lastRead',
			expand: 'chapter,chapter.story',
		})

		// Group by story and get last read chapter
		const storiesMap = new Map()
		for (const record of records) {
			const chapter = record.expand?.chapter
			if (!chapter?.story) continue

			if (!storiesMap.has(chapter.story)) {
				storiesMap.set(chapter.story, {
					storyId: chapter.story,
					lastChapterId: chapter.id,
					lastRead: record.lastRead,
				})
			}
		}

		return Array.from(storiesMap.values())
	} catch (error) {
		console.error('Failed to get stories with progress:', error)
		return []
	}
}
