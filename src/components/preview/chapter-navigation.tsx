/**
 * Chapter Navigation Component
 * Sidebar for navigating between chapters and blocks in preview mode
 */

'use client'

import { creatorBlockService } from '@sms-editor'
import type { BlockWithExpand, CreatorChapter } from '@sms-editor/types/creator-stories'
import { BookOpen, ChevronDown, ChevronRight, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface ChapterNavigationProps {
	chapters: CreatorChapter[]
	currentChapterId: string | null
	onChapterSelect: (chapterId: string) => void
	onBlockSelect?: (blockId: string) => void
}

export function ChapterNavigation({ chapters, currentChapterId, onChapterSelect }: ChapterNavigationProps) {
	const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
	const [chapterBlocks, setChapterBlocks] = useState<Record<string, BlockWithExpand[]>>({})
	const [loadingBlocks, setLoadingBlocks] = useState<Set<string>>(new Set())

	// Auto-expand current chapter
	useEffect(() => {
		if (currentChapterId && !expandedChapters.has(currentChapterId)) {
			setExpandedChapters(prev => new Set([...prev, currentChapterId]))
		}
	}, [currentChapterId])

	// Fetch blocks when a chapter is expanded
	useEffect(() => {
		expandedChapters.forEach(chapterId => {
			if (!chapterBlocks[chapterId] && !loadingBlocks.has(chapterId)) {
				fetchChapterBlocks(chapterId)
			}
		})
	}, [expandedChapters])

	const fetchChapterBlocks = async (chapterId: string) => {
		setLoadingBlocks(prev => new Set([...prev, chapterId]))

		try {
			const blocks = await creatorBlockService.getChapterBlocks(chapterId)
			setChapterBlocks(prev => ({ ...prev, [chapterId]: blocks }))
		} catch (error) {
			console.error('Failed to fetch blocks for chapter:', chapterId, error)
		} finally {
			setLoadingBlocks(prev => {
				const newSet = new Set(prev)
				newSet.delete(chapterId)
				return newSet
			})
		}
	}

	const toggleChapter = (chapterId: string) => {
		setExpandedChapters(prev => {
			const newSet = new Set(prev)
			if (newSet.has(chapterId)) {
				newSet.delete(chapterId)
			} else {
				newSet.add(chapterId)
			}
			return newSet
		})
	}

	const getBlockIcon = (blockType: string) => {
		switch (blockType) {
			case 'sms_conversation':
				return <MessageSquare className="h-3.5 w-3.5" />
			case 'media_content':
				return <ImageIcon className="h-3.5 w-3.5" />
			case 'rich_text_content':
				return <FileText className="h-3.5 w-3.5" />
			default:
				return <FileText className="h-3.5 w-3.5" />
		}
	}

	const getBlockTitle = (block: BlockWithExpand, index: number) => {
		if (block.title) return block.title

		switch (block.type) {
			case 'sms_conversation':
				return `Conversation ${index + 1}`
			case 'media_content':
				return `Media ${index + 1}`
			case 'rich_text_content':
				return `Text ${index + 1}`
			default:
				return `Block ${index + 1}`
		}
	}

	const scrollToBlock = (blockId: string) => {
		const element = document.getElementById(`block-${blockId}`)
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	if (chapters.length === 0) {
		return (
			<div className="w-64 border-r border-border bg-card p-4">
				<div className="flex items-center gap-2 mb-6">
					<BookOpen className="h-5 w-5 text-primary" />
					<h2 className="font-semibold text-lg text-foreground">Table of Contents</h2>
				</div>
				<div className="text-center text-sm text-muted-foreground py-8">No chapters available</div>
			</div>
		)
	}

	return (
		<div className="w-72 border-r border-border bg-card flex flex-col h-full">
			<div className="p-4 border-b border-border">
				<div className="flex items-center gap-2">
					<BookOpen className="h-5 w-5 text-primary" />
					<h2 className="font-semibold text-lg text-foreground">Table of Contents</h2>
				</div>
				<p className="text-xs text-muted-foreground mt-1">
					{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
				</p>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{chapters.map((chapter, chapterIndex) => {
						const isActive = chapter.id === currentChapterId
						const isExpanded = expandedChapters.has(chapter.id)
						const blocks = chapterBlocks[chapter.id] || []
						const isLoading = loadingBlocks.has(chapter.id)

						return (
							<div key={chapter.id} className="space-y-0.5">
								{/* Chapter Button */}
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0 shrink-0"
										onClick={() => toggleChapter(chapter.id)}
									>
										{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
									</Button>
									<Button
										variant={isActive ? 'secondary' : 'ghost'}
										className={cn('flex-1 justify-start text-left h-auto py-2 px-2', isActive && 'bg-accent/20')}
										onClick={() => onChapterSelect(chapter.id)}
									>
										<div className="flex items-center gap-2 w-full">
											<div
												className={cn(
													'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold shrink-0',
													isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
												)}
											>
												{chapterIndex + 1}
											</div>
											<p
												className={cn(
													'text-sm font-medium truncate',
													isActive ? 'text-foreground' : 'text-foreground/80'
												)}
											>
												{chapter.title || `Chapter ${chapterIndex + 1}`}
											</p>
										</div>
									</Button>
								</div>

								{/* Blocks List */}
								{isExpanded && (
									<div className="ml-8 space-y-0.5 border-l border-border pl-2">
										{isLoading ? (
											<div className="py-2 px-3 text-xs text-muted-foreground">Loading...</div>
										) : blocks.length === 0 ? (
											<div className="py-2 px-3 text-xs text-muted-foreground">No content</div>
										) : (
											blocks.map((block, blockIndex) => (
												<Button
													key={block.id}
													variant="ghost"
													className="w-full justify-start text-left h-auto py-1.5 px-2 hover:bg-accent/10"
													onClick={() => {
														onChapterSelect(chapter.id)
														scrollToBlock(block.id)
													}}
												>
													<div className="flex items-center gap-2 w-full">
														<div className="text-muted-foreground shrink-0">{getBlockIcon(block.type)}</div>
														<p className="text-xs truncate text-muted-foreground">{getBlockTitle(block, blockIndex)}</p>
													</div>
												</Button>
											))
										)}
									</div>
								)}
							</div>
						)
					})}
				</div>
			</ScrollArea>
		</div>
	)
}
