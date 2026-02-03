/**
 * Fullscreen Story Reader Client Component
 * Desktop: Navbar + sidebar + phone preview (like editor preview)
 * Mobile: Fullscreen experience (no phone frame, no header)
 */

'use client'

import { getChapterBlocksAction } from '@sms-editor/actions/serviceActions'
import type { BlockWithExpand, ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { AlertCircle, ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FullscreenBlockPreview } from './FullscreenBlockPreview.client'
import { PublicChapterNavigation } from './PublicChapterNavigation'
import { UnifiedPhonePreview } from './preview/unified-phone-preview'

export interface FullscreenStoryReaderProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
	initialChapterId?: string
}

export function FullscreenStoryReader({ story, chapters, initialChapterId }: FullscreenStoryReaderProps) {
	const characters = story.characters || []

	const [currentChapterId, setCurrentChapterId] = useState<string | null>(
		initialChapterId || (chapters.length > 0 ? chapters[0].id : null)
	)
	const [blocks, setBlocks] = useState<BlockWithExpand[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

	// Fetch blocks for current chapter using public endpoint
	useEffect(() => {
		if (!currentChapterId) {
			setBlocks([])
			return
		}

		const fetchBlocks = async () => {
			setLoading(true)
			setError(null)

			try {
				const data = await getChapterBlocksAction(currentChapterId)
				const blocksArray = Array.isArray(data) ? data : []
				setBlocks(blocksArray)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load chapter content')
				setBlocks([])
			} finally {
				setLoading(false)
			}
		}

		fetchBlocks()
	}, [currentChapterId])

	// Handle block selection from table of contents
	const handleBlockSelect = (blockId: string) => {
		setSelectedBlockId(blockId)
	}

	// Handle block change from preview (sync back to navigation)
	const handleBlockChange = (blockId: string) => {
		setSelectedBlockId(blockId)
	}

	// Handle chapter selection - reset selected block
	const handleChapterSelect = (chapterId: string) => {
		setCurrentChapterId(chapterId)
		setSelectedBlockId(null)
	}

	// Chapter navigation for mobile
	const currentChapterIndex = chapters.findIndex(c => c.id === currentChapterId)
	const hasPreviousChapter = currentChapterIndex > 0
	const hasNextChapter = currentChapterIndex < chapters.length - 1

	const goToPreviousChapter = () => {
		if (hasPreviousChapter) {
			const prevChapter = chapters[currentChapterIndex - 1]
			handleChapterSelect(prevChapter.id)
		}
	}

	const goToNextChapter = () => {
		if (hasNextChapter) {
			const nextChapter = chapters[currentChapterIndex + 1]
			handleChapterSelect(nextChapter.id)
		}
	}

	return (
		<>
			{/* ============ MOBILE: Fullscreen experience (no phone frame) ============ */}
			<div className="md:hidden h-screen w-full bg-background overflow-hidden">
				{loading && (
					<div className="flex items-center justify-center h-full">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center h-full">
						<div className="max-w-md px-6 text-center">
							<div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-4">
								<div className="flex items-center justify-center gap-2 text-destructive">
									<AlertCircle className="h-5 w-5" />
									<p className="text-sm font-medium">{error}</p>
								</div>
							</div>
							<Button onClick={() => setCurrentChapterId(currentChapterId)} variant="outline">
								Retry
							</Button>
						</div>
					</div>
				)}

				{!loading && !error && currentChapterId && (
					<FullscreenBlockPreview
						blocks={blocks}
						characters={characters}
						selectedBlockId={selectedBlockId}
						onBlockChange={handleBlockChange}
						hasPreviousChapter={hasPreviousChapter}
						hasNextChapter={hasNextChapter}
						onPreviousChapter={goToPreviousChapter}
						onNextChapter={goToNextChapter}
						authorId={story.expand?.author?.id}
						storyTitle={story.title}
					/>
				)}

				{!currentChapterId && chapters.length === 0 && (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">This story has no chapters yet.</p>
						</div>
					</div>
				)}
			</div>

			{/* ============ DESKTOP: Header + Sidebar + Phone Preview ============ */}
			<div className="hidden md:flex flex-col h-screen w-full bg-background">
				{/* Desktop Header */}
				<header className="border-b border-border bg-card sticky top-0 z-20">
					<div className="flex items-center justify-between px-4 py-3 gap-4 w-full">
						{/* Left: Back button and story title */}
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<Link href="/">
								<Button variant="ghost" size="icon" className="shrink-0">
									<ArrowLeft className="h-4 w-4" />
								</Button>
							</Link>
							<div className="min-w-0 flex-1">
								<h1 className="text-lg font-semibold truncate">{story.title}</h1>
								<p className="text-xs text-muted-foreground">by {story.expand?.author?.name || 'Unknown author'}</p>
							</div>
						</div>

						{/* Right: Story info */}
						<div className="flex items-center gap-2 shrink-0">
							<span className="text-sm text-muted-foreground">
								{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
							</span>
						</div>
					</div>
				</header>

				<div className="flex flex-1 overflow-hidden">
					{/* Desktop Sidebar - Chapter Navigation */}
					<aside className="flex">
						<PublicChapterNavigation
							chapters={chapters}
							currentChapterId={currentChapterId}
							onChapterSelect={handleChapterSelect}
							onBlockSelect={handleBlockSelect}
							selectedBlockId={selectedBlockId}
						/>
					</aside>

					{/* Main Content Area - Phone Preview */}
					<div className="flex-1 flex flex-col overflow-hidden">
						<ScrollArea className="flex-1">
							<div className="py-8 flex items-start justify-center min-h-full">
								{loading && (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-8 w-8 animate-spin text-primary" />
									</div>
								)}

								{error && (
									<div className="max-w-md px-6">
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

								{!loading && !error && currentChapterId && (
									<UnifiedPhonePreview
										blocks={blocks}
										characters={characters}
										selectedBlockId={selectedBlockId}
										onBlockChange={handleBlockChange}
										hasPreviousChapter={hasPreviousChapter}
										hasNextChapter={hasNextChapter}
										onPreviousChapter={goToPreviousChapter}
										onNextChapter={goToNextChapter}
										authorId={story.expand?.author?.id}
										storyTitle={story.title}
									/>
								)}

								{!currentChapterId && chapters.length === 0 && (
									<div className="text-center py-12">
										<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
										<p className="text-muted-foreground">This story has no chapters yet.</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</>
	)
}
