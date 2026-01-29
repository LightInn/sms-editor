/**
 * Story Preview Client Component
 * Main client component for story preview with chapter navigation
 */

'use client'

import { creatorBlockService } from '@sms-editor'
import type { BlockWithExpand, Character, CreatorChapter, CreatorStory } from '@sms-editor/types/creator-stories'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StoryEditorHeader } from '../editor/story-editor-header'
import { BlockRenderer } from './block-renderer'
import { ChapterNavigation } from './chapter-navigation'

export interface StoryPreviewClientProps {
	story: CreatorStory
	initialChapters: CreatorChapter[]
	characters: Character[]
}

export function StoryPreviewClient({ story, initialChapters, characters }: StoryPreviewClientProps) {
	console.log('[Preview] Initializing with', initialChapters.length, 'chapters')
	console.log(
		'[Preview] Chapters:',
		initialChapters.map(c => ({ id: c.id, title: c.title }))
	)

	const [chapters] = useState<CreatorChapter[]>(initialChapters)
	const [currentChapterId, setCurrentChapterId] = useState<string | null>(
		initialChapters.length > 0 ? initialChapters[0].id : null
	)
	const [blocks, setBlocks] = useState<BlockWithExpand[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	console.log('[Preview] Current chapter ID:', currentChapterId)

	// Fetch blocks for current chapter
	useEffect(() => {
		if (!currentChapterId) {
			console.log('[Preview] No chapter selected')
			setBlocks([])
			return
		}

		const fetchBlocks = async () => {
			console.log('[Preview] Fetching blocks for chapter:', currentChapterId)
			setLoading(true)
			setError(null)

			try {
				const blocksArray = await creatorBlockService.getChapterBlocks(currentChapterId)
				console.log('[Preview] Fetched blocks:', blocksArray.length, 'blocks')
				console.log('[Preview] Blocks data:', blocksArray)
				setBlocks(blocksArray)
			} catch (err) {
				console.error('[Preview] Error fetching blocks:', err)
				setError(err instanceof Error ? err.message : 'Failed to load chapter content')
				setBlocks([])
			} finally {
				setLoading(false)
			}
		}

		fetchBlocks()
	}, [currentChapterId])

	const currentChapter = chapters.find(c => c.id === currentChapterId)

	return (
		<div className="flex flex-col h-screen w-full bg-background">
			{/* Header with navigation */}
			<StoryEditorHeader story={story} chapters={chapters} onUpdate={() => {}} isPreviewMode={true} />

			<div className="flex flex-1 overflow-hidden">
				{/* Chapter Navigation Sidebar */}
				<ChapterNavigation
					chapters={chapters}
					currentChapterId={currentChapterId}
					onChapterSelect={setCurrentChapterId}
				/>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Chapter title */}
					{currentChapter && (
						<div className="border-b border-border bg-card px-6 py-3">
							<div className="max-w-4xl mx-auto">
								<p className="text-lg font-semibold text-foreground">
									{currentChapter.title || `Chapter ${chapters.findIndex(c => c.id === currentChapterId) + 1}`}
								</p>
							</div>
						</div>
					)}

					{/* Content */}
					<ScrollArea className="flex-1">
						<div className="py-8">
							{loading && (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							)}

							{error && (
								<div className="max-w-4xl mx-auto px-6">
									<div className="rounded-lg border border-destructive bg-destructive/10 p-4">
										<div className="flex items-center gap-2 text-destructive">
											<AlertCircle className="h-5 w-5" />
											<p className="text-sm font-medium">{error}</p>
										</div>
									</div>
									<div className="mt-4 text-center">
										<Button onClick={() => setCurrentChapterId(currentChapterId)} variant="outline">
											Retry
										</Button>
									</div>
								</div>
							)}

							{!loading && !error && blocks.length === 0 && currentChapterId && (
								<div className="max-w-4xl mx-auto px-6 text-center py-12">
									<p className="text-muted-foreground">This chapter has no content yet.</p>
								</div>
							)}

							{!loading && !error && blocks.length > 0 && (
								<div className="space-y-8">
									{blocks.map(block => (
										<BlockRenderer key={block.id} block={block} characters={characters} />
									))}
								</div>
							)}

							{!currentChapterId && chapters.length === 0 && (
								<div className="max-w-4xl mx-auto px-6 text-center py-12">
									<p className="text-muted-foreground">This story has no chapters yet.</p>
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	)
}
