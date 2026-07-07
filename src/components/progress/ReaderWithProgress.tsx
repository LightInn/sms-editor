'use client'

import { markChapterAsRead } from '@sms-editor/actions/readingProgress.actions'
import { FullscreenStoryReader } from '@sms-editor/components/FullscreenStoryReader.client'
import type { ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useStoryView } from '@/hooks/use-story-view'
import { useIsSubscribed } from '@/hooks/use-subscription'

interface ReaderWithProgressProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
	initialChapterId: string
}

export function ReaderWithProgress({ story, chapters, initialChapterId }: ReaderWithProgressProps) {
	const isSubscribed = useIsSubscribed()

	// Track story view (throttled by localStorage)
	useStoryView('c_stories', story.id)

	useEffect(() => {
		if (isSubscribed) {
			markChapterAsRead(initialChapterId, story.id).catch(() => {
				toast.error('Failed to update reading progress')
			})
		}
	}, [isSubscribed, initialChapterId, story.id])

	return <FullscreenStoryReader story={story} chapters={chapters} initialChapterId={initialChapterId} />
}
