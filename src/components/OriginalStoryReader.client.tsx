/**
 * Original Story Reader Client Component
 * Full-featured reader with phone preview and chapter navigation
 * Reuses existing preview components from creator-stories
 */

'use client'

import { getChapterBlocksAction } from '@sms-editor/actions/serviceActions'
import type { BlockWithExpand, ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { AlertCircle, ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PublicChapterNavigation } from './PublicChapterNavigation'
import { UnifiedPhonePreview } from './preview/unified-phone-preview'

export interface OriginalStoryReaderProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
	initialChapterId?: string
}

export function OriginalStoryReader({ story, chapters, initialChapterId }: OriginalStoryReaderProps) {
	const characters = story.characters || []

	const [currentChapterId, setCurrentChapterId] = useState<string | null>(
		initialChapterId || (chapters.length > 0 ? chapters[0].id : null)
	)
	const [blocks, setBlocks] = useState<BlockWithExpand[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
	const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

	const currentChapter = chapters.find(c => c.id === currentChapterId)

	// Handle block selection from table of contents
	const handleBlockSelect = (blockId: string) => {
		setSelectedBlockId(blockId)
		setMobileNavOpen(false)
	}

	// Handle block change from phone preview (sync back to navigation)
	const handleBlockChange = (blockId: string) => {
		setSelectedBlockId(blockId)
	}

	// Handle chapter selection - reset selected block
	const handleChapterSelect = (chapterId: string) => {
		setCurrentChapterId(chapterId)
		setSelectedBlockId(null)
		setMobileNavOpen(false)
	}

	// Chapter navigation
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
		<div className="flex flex-col h-screen w-full bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card px-4 py-3 shrink-0">
				<div className="flex items-center justify-between max-w-7xl mx-auto">
					<div className="flex items-center gap-4">
						<Link href={`/story/${story.slug}`}>
							<Button variant="ghost" size="sm" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								<span className="hidden sm:inline">Back to Story</span>
							</Button>
						</Link>
						<div className="hidden sm:block">
							<h1 className="text-sm font-semibold truncate max-w-[300px]">{story.title}</h1>
							<p className="text-xs text-muted-foreground">
								by {story.expand?.author?.name || story.expand?.author?.email || 'Anonymous'}
							</p>
						</div>
					</div>
					<Badge variant="secondary">Reading Mode</Badge>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				{/* Chapter Navigation Sidebar - Hidden on mobile */}
				<div className="hidden md:flex">
					<PublicChapterNavigation
						chapters={chapters}
						currentChapterId={currentChapterId}
						onChapterSelect={handleChapterSelect}
						onBlockSelect={handleBlockSelect}
						selectedBlockId={selectedBlockId}
					/>
				</div>

				{/* Mobile Table of Contents Sheet */}
				<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
					<SheetContent side="left" className="w-[300px] p-0">
						<SheetHeader className="sr-only">
							<SheetTitle>Table of Contents</SheetTitle>
						</SheetHeader>
						<PublicChapterNavigation
							chapters={chapters}
							currentChapterId={currentChapterId}
							onChapterSelect={handleChapterSelect}
							onBlockSelect={handleBlockSelect}
							selectedBlockId={selectedBlockId}
							isInSheet
						/>
					</SheetContent>
				</Sheet>

				{/* Main Content Area - Centered Phone Preview */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Chapter Navigation Bar */}
					{chapters.length > 0 && (
						<div className="border-b border-border bg-card px-4 py-3 shrink-0">
							<div className="flex items-center justify-between max-w-2xl mx-auto">
								{/* Mobile: Table of Contents Button */}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setMobileNavOpen(true)}
									className="md:hidden gap-1 text-muted-foreground hover:text-foreground"
								>
									<BookOpen className="h-4 w-4" />
								</Button>

								{/* Previous Chapter Button - Hidden on mobile */}
								<Button
									variant="ghost"
									size="sm"
									onClick={goToPreviousChapter}
									disabled={!hasPreviousChapter}
									className="hidden md:flex gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
								>
									<ChevronLeft className="h-4 w-4" />
									<span className="hidden sm:inline">Previous</span>
								</Button>

								{/* Chapter Title & Progress */}
								<div className="flex flex-col items-center gap-0.5 min-w-0 flex-1 px-2 md:px-4">
									<p className="text-sm md:text-base font-semibold text-foreground truncate max-w-full">
										{currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
									</p>
									<p className="text-xs text-muted-foreground">
										{currentChapterIndex + 1} / {chapters.length}
									</p>
								</div>

								{/* Next Chapter Button - Hidden on mobile */}
								<Button
									variant="ghost"
									size="sm"
									onClick={goToNextChapter}
									disabled={!hasNextChapter}
									className="hidden md:flex gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
								>
									<span className="hidden sm:inline">Next</span>
									<ChevronRight className="h-4 w-4" />
								</Button>

								{/* Mobile: Prev/Next compact buttons */}
								<div className="flex md:hidden items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={goToPreviousChapter}
										disabled={!hasPreviousChapter}
										className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={goToNextChapter}
										disabled={!hasNextChapter}
										className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Unified Phone Preview */}
					<ScrollArea className="flex-1">
						<div className="py-4 md:py-8 flex items-start justify-center min-h-full">
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
	)
}
