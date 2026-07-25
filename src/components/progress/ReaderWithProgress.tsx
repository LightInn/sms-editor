'use client'

import { markChapterAsRead } from '@sms-editor/actions/readingProgress.actions'
import { FullscreenStoryReader } from '@sms-editor/components/FullscreenStoryReader.client'
import type { ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useIsAuthenticated } from '@/hooks/use-authenticated'
import { useStoryView } from '@/hooks/use-story-view'

interface ReaderWithProgressProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
	initialChapterId: string
}

export function ReaderWithProgress({ story, chapters, initialChapterId }: ReaderWithProgressProps) {
	// Progress is free for any account (M2-T1). This guard only spares anonymous
	// readers a pointless round-trip; the action authorises from the session.
	const isAuthenticated = useIsAuthenticated()

	// Track story view (throttled by localStorage)
	useStoryView('c_stories', story.id)

	useEffect(() => {
		if (isAuthenticated) {
			markChapterAsRead(initialChapterId, story.id).catch(() => {
				toast.error('Failed to update reading progress')
			})
		}
	}, [isAuthenticated, initialChapterId, story.id])

	return <FullscreenStoryReader story={story} chapters={chapters} initialChapterId={initialChapterId} />
}
