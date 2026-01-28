/**
 * Story Editor Client Component
 * Main client-side editor with hierarchical navigation (Story → Chapters → Blocks)
 */

'use client'

import { closestCenter, DndContext } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useEditorDragDrop } from '@smseditor/hooks/use-editor-drag-drop'
import { useEditorNavigation } from '@smseditor/hooks/use-editor-navigation'
import { useEditorSaveState } from '@smseditor/hooks/use-editor-save-state'
import { useMediaQuery } from '@smseditor/hooks/use-media-query'
import { useStoryEditorData } from '@smseditor/hooks/use-story-editor-data'
import { cn } from '@smseditor/lib/utils'
import {
	ArrowLeft,
	ChevronLeft,
	FileText,
	FolderOpen,
	GripVertical,
	Image,
	Menu,
	MessageSquare,
	MoreVertical,
	Plus,
	Settings,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { ChapterWithExpand, CreatorBlock, CreatorStory } from '../../types/creator-stories'
import { BlockSidebar } from './block-sidebar'
import { BlockTypeSelector } from './block-type-selector'
import { ChapterSettingsPanel } from './chapter-settings-panel'
import { ChapterSidebar } from './chapter-sidebar'
import { MediaChapterEditor } from './media-chapter-editor'
import { RichTextChapterEditor } from './rich-text-chapter-editor'
import { SmsChapterEditor } from './sms-chapter-editor'
import { StoryEditorHeader } from './story-editor-header'
import { StorySettingsPanel } from './story-settings-panel'

export interface StoryEditorClientProps {
	initialStory: CreatorStory
	initialChapters: ChapterWithExpand[]
}

// ============================================================================
// MOBILE SIDEBAR COMPONENTS (must be outside main component for hooks rules)
// ============================================================================

function MobileSortableChapterItem({
	chapter,
	isActive,
	onSelect,
	onDelete,
	onSettings,
	blockCount,
}: {
	chapter: ChapterWithExpand
	isActive: boolean
	onSelect: () => void
	onDelete: () => void
	onSettings: () => void
	blockCount?: number
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: chapter.id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'flex items-center gap-2 p-3 rounded-lg border mb-2 bg-background transition-colors w-full',
				isActive && 'border-primary bg-primary/5',
				isDragging && 'opacity-50',
				!isActive && 'hover:bg-muted'
			)}
		>
			<button
				type="button"
				className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 bg-transparent border border-transparent rounded-md p-1"
				{...attributes}
				{...listeners}
				onClick={event => event.stopPropagation()}
				suppressHydrationWarning
				aria-label="Reorder chapter"
			>
				<GripVertical className="h-4 w-4" />
			</button>

			<button
				type="button"
				onClick={onSelect}
				className="flex items-center gap-3 flex-1 min-w-0 text-left bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-md"
			>
				<FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">#{chapter.order + 1}</span>
						{blockCount !== undefined && (
							<Badge variant="secondary" className="text-xs">
								{blockCount} {blockCount === 1 ? 'block' : 'blocks'}
							</Badge>
						)}
					</div>
					<p className="text-sm font-medium truncate mt-1">{chapter.title || 'Untitled Chapter'}</p>
				</div>
			</button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild onClick={event => event.stopPropagation()}>
					<Button variant="ghost" size="icon" className="shrink-0">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={event => {
							event.stopPropagation()
							onSettings()
						}}
					>
						<Settings className="mr-2 h-4 w-4" />
						Chapter Settings
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={event => {
							event.stopPropagation()
							onDelete()
						}}
						className="text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

function MobileSortableBlockItem({
	block,
	isActive,
	onSelect,
	onDelete,
}: {
	block: CreatorBlock
	isActive: boolean
	onSelect: () => void
	onDelete: () => void
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: block.id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const getIcon = () => {
		switch (block.type) {
			case 'sms_conversation':
				return MessageSquare
			case 'media_content':
				return Image
			default:
				return FileText
		}
	}

	const getTypeLabel = () => {
		switch (block.type) {
			case 'sms_conversation':
				return 'SMS'
			case 'media_content':
				return 'Media'
			default:
				return 'Text'
		}
	}

	const Icon = getIcon()

	return (
		<div className="relative" ref={setNodeRef} style={style}>
			<div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="shrink-0">
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={e => {
								e.stopPropagation()
								onDelete()
							}}
							className="text-destructive"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<button
				type="button"
				className={cn(
					'flex items-center gap-2 p-3 rounded-lg border mb-2 bg-background cursor-pointer transition-colors rounded-r-none w-full text-left pr-10',
					isActive && 'border-primary bg-primary/5',
					isDragging && 'opacity-50',
					!isActive && 'hover:bg-muted'
				)}
				onClick={onSelect}
			>
				<button
					tabIndex={-1}
					className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 bg-transparent border-0 p-0"
					{...attributes}
					{...listeners}
					onClick={e => e.stopPropagation()}
					onKeyDown={e => {
						e.stopPropagation()
					}}
					suppressHydrationWarning
				>
					<GripVertical className="h-4 w-4" />
				</button>
				<Icon className="h-4 w-4 text-muted-foreground shrink-0" />

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">#{block.order + 1}</span>
						<Badge variant="outline" className="text-xs">
							{getTypeLabel()}
						</Badge>
					</div>
					<p className="text-sm font-medium truncate mt-1">{block.title || 'Untitled Block'}</p>
				</div>
			</button>
		</div>
	)
}

export function StoryEditorClient({ initialStory, initialChapters }: StoryEditorClientProps) {
	// Navigation state - managed via URL query parameters for persistence
	const { activeChapterId, activeBlockId, setActiveChapterId, setActiveBlockId } = useEditorNavigation()

	// Centralized CRUD operations via custom hook
	const {
		story,
		setStory,
		chapters,
		blocks,
		blockCounts,
		activeChapter,
		activeBlock,
		handleChapterCreate,
		handleChapterCreateConfirm,
		handleChapterDelete,
		handleChapterReorder,
		handleChapterUpdate,
		handleChaptersRefresh,
		handleBlockCreate,
		handleBlockTypeSelect,
		handleBlockDelete,
		handleBlockReorder,
		handleBlockSave,
		isCreatingChapter,
		setIsCreatingChapter,
		isCreatingBlock,
		setIsCreatingBlock,
		newChapterTitle,
		setNewChapterTitle,
	} = useStoryEditorData({
		initialStory,
		initialChapters,
		activeChapterId,
		activeBlockId,
		setActiveChapterId,
		setActiveBlockId,
	})

	// Drag and drop functionality via custom hook
	const { sensors, handleChapterDragEnd, handleBlockDragEnd } = useEditorDragDrop({
		chapters,
		blocks,
		onChapterReorder: handleChapterReorder,
		onBlockReorder: handleBlockReorder,
	})

	// Save state management via custom hook
	const { saveTracking, currentSaveFnRef, handleSaveStatusChange, handleSetSaveFunction } = useEditorSaveState({
		activeBlockId,
		blocks,
	})

	// Responsive sidebar state
	const isDesktop = useMediaQuery('(min-width: 768px)')
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	// ============================================================================
	// NAVIGATION HANDLERS
	// ============================================================================

	// Contextual back navigation
	const handleBack = () => {
		if (activeBlockId) {
			// If viewing a block, go back to blocks list
			setActiveBlockId(null)
		} else if (activeChapterId) {
			// If viewing blocks list (chapter selected), go back to chapters list
			setActiveChapterId(null)
			setActiveBlockId(null)
		} else {
			// If viewing chapters list, go back to stories list
			window.location.href = '/editor'
		}
	}

	// ============================================================================
	// RENDER
	// ============================================================================

	// Render the sidebar content for mobile (without Sidebar wrapper)
	const renderMobileSidebarContent = () => {
		if (!activeChapter) {
			// Chapter list for mobile
			return (
				<div className="flex flex-col h-full bg-muted">
					<div className="border-b bg-card p-4">
						<div className="flex items-center gap-2 mb-3">
							<FolderOpen className="h-5 w-5 text-primary shrink-0" />
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<h2 className="font-semibold text-sm text-foreground">CHAPTERS</h2>
								<Badge variant="secondary" className="text-xs">
									{chapters.length}
								</Badge>
							</div>
						</div>
						<Button onClick={handleChapterCreate} className="w-full" size="sm">
							<Plus className="mr-2 h-4 w-4" />
							New Chapter
						</Button>
					</div>
					<ScrollArea className="flex-1 p-4">
						{chapters.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								<FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No chapters yet</p>
								<p className="text-xs mt-1">Click "New Chapter" to get started</p>
							</div>
						) : (
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
								<SortableContext items={chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
									{chapters.map(chapter => (
										<MobileSortableChapterItem
											key={chapter.id}
											chapter={chapter}
											isActive={chapter.id === activeChapterId}
											onSelect={() => {
												setActiveChapterId(chapter.id)
												setActiveBlockId(null)
												setIsSidebarOpen(false)
											}}
											onDelete={() => handleChapterDelete(chapter.id)}
											onSettings={() => {
												setActiveChapterId(chapter.id)
												setActiveBlockId(null)
												setIsSidebarOpen(false)
											}}
											blockCount={blockCounts?.[chapter.id]}
										/>
									))}
								</SortableContext>
							</DndContext>
						)}
					</ScrollArea>
				</div>
			)
		}

		// Block list for mobile
		return (
			<div className="flex flex-col h-full bg-muted">
				<div className="border-b bg-card p-4">
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start mb-3 text-foreground hover:bg-accent"
						onClick={() => {
							setActiveChapterId(null)
							setActiveBlockId(null)
						}}
					>
						<ChevronLeft className="mr-2 h-4 w-4" />
						Back to Chapters
					</Button>
					<div className="flex items-center gap-2 mb-3">
						<FileText className="h-5 w-5 text-primary shrink-0" />
						<div className="flex-1 min-w-0">
							<h2 className="font-semibold text-sm text-foreground">BLOCKS</h2>
							<p className="text-xs text-muted-foreground truncate">{activeChapter.title}</p>
						</div>
					</div>
					<div className="mb-3">
						<Badge variant="secondary" className="text-xs">
							{blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
						</Badge>
					</div>
					<Button onClick={handleBlockCreate} className="w-full" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						New Block
					</Button>
				</div>
				<ScrollArea className="flex-1 py-4 pl-6">
					{blocks.length === 0 ? (
						<div className="text-center py-8 text-sm text-muted-foreground">
							<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
							<p>No blocks yet</p>
							<p className="text-xs mt-1">Click "New Block" to get started</p>
						</div>
					) : (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
							<SortableContext items={blocks.map(bl => bl.id)} strategy={verticalListSortingStrategy}>
								{blocks.map(block => (
									<MobileSortableBlockItem
										key={block.id}
										block={block}
										isActive={block.id === activeBlockId}
										onSelect={() => {
											setActiveBlockId(block.id)
											setIsSidebarOpen(false)
										}}
										onDelete={() => handleBlockDelete(block.id)}
									/>
								))}
							</SortableContext>
						</DndContext>
					)}
				</ScrollArea>
			</div>
		)
	}

	return (
		<div className="fixed inset-0 flex flex-col">
			{/* Header */}
			<StoryEditorHeader
				story={story}
				chapters={chapters}
				activeChapterId={activeChapterId}
				onUpdate={setStory}
				onChaptersUpdate={handleChaptersRefresh}
				globalSaveState={saveTracking.globalSaveState}
				onSave={currentSaveFnRef.current}
				onBack={handleBack}
			/>

			{/* Mobile menu button - only visible on mobile, below header */}
			{!isDesktop && (
				<div className="flex items-center gap-2 px-4 py-3 border-b bg-background md:hidden sticky top-0 z-10">
					<Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
						<SheetTrigger asChild>
							<Button variant="outline" size="sm" className="gap-2">
								<Menu className="h-4 w-4" />
								{activeChapter ? 'Blocks' : 'Chapters'}
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-full sm:w-[400px] p-0 flex flex-col bg-muted/30">
							{/* Custom back button */}
							<div className="flex items-center gap-2 p-4 border-b bg-card shrink-0">
								<Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="shrink-0">
									<ArrowLeft className="h-5 w-5" />
								</Button>
								<h3 className="font-semibold text-foreground">{activeChapter ? 'Blocks' : 'Chapters'}</h3>
							</div>
							<div className="flex-1 overflow-hidden">{renderMobileSidebarContent()}</div>
						</SheetContent>
					</Sheet>
					<div className="text-sm text-muted-foreground">
						{activeChapter ? `${activeChapter.title}` : 'Select a chapter'}
					</div>
				</div>
			)}

			{/* Main content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebars - Only visible on desktop (md and above) */}
				{isDesktop && !activeChapter && (
					<ChapterSidebar
						chapters={chapters}
						activeChapterId={activeChapterId}
						onChapterSelect={id => {
							setActiveChapterId(id)
							setActiveBlockId(null)
						}}
						onChapterCreate={handleChapterCreate}
						onChapterDelete={handleChapterDelete}
						onChapterSettings={id => {
							setActiveChapterId(id)
							setActiveBlockId(null)
						}}
						onReorder={handleChapterReorder}
						blockCounts={blockCounts}
					/>
				)}

				{isDesktop && activeChapter && (
					<BlockSidebar
						blocks={blocks}
						activeBlockId={activeBlockId}
						onBlockSelect={setActiveBlockId}
						onBlockCreate={handleBlockCreate}
						onBlockDelete={handleBlockDelete}
						onReorder={handleBlockReorder}
						chapterTitle={activeChapter.title}
						onBackToChapters={() => {
							setActiveChapterId(null)
							setActiveBlockId(null)
						}}
					/>
				)}

				{/* Editor area */}
				<div className="flex-1 overflow-auto">
					{activeBlock ? (
						// Render the appropriate editor based on block type
						activeBlock.type === 'rich_text_content' ? (
							<RichTextChapterEditor
								key={activeBlock.id}
								chapter={activeBlock}
								onSave={async updates => {
									await handleBlockSave(activeBlock.id, updates)
								}}
								onDelete={() => handleBlockDelete(activeBlock.id)}
								onBackToChapterSettings={() => setActiveBlockId(null)}
							/>
						) : activeBlock.type === 'media_content' ? (
							<MediaChapterEditor
								key={activeBlock.id}
								chapter={activeBlock}
								onSave={async updates => {
									await handleBlockSave(activeBlock.id, updates)
								}}
								onDelete={() => handleBlockDelete(activeBlock.id)}
								onBackToChapterSettings={() => setActiveBlockId(null)}
							/>
						) : (
							<div className="p-8">
								<SmsChapterEditor
									key={activeBlock.id}
									chapter={activeBlock}
									characters={story.characters}
									onSave={async updated => {
										return await handleBlockSave(activeBlock.id, {
											title: updated.title,
											conversationType: updated.conversationType,
											conversationTitle: updated.conversationTitle,
											conversationAvatar: updated.conversationAvatar,
											participants: updated.participants,
											appTarget: updated.appTarget,
											messages: updated.messages,
											content: { messages: updated.messages || [] },
										})
									}}
									onSaveStatusChange={handleSaveStatusChange}
									onSaveFunctionChange={handleSetSaveFunction}
									onDelete={() => handleBlockDelete(activeBlock.id)}
									onBackToChapterSettings={() => setActiveBlockId(null)}
								/>
							</div>
						)
					) : activeChapter ? (
						// Chapter selected but no block selected - show chapter settings panel
						<ChapterSettingsPanel
							chapter={activeChapter}
							onDelete={handleChapterDelete}
							onChapterUpdate={handleChapterUpdate}
						/>
					) : (
						// No chapter selected - show story settings panel
						<StorySettingsPanel story={story} onUpdate={setStory} />
					)}
				</div>
			</div>

			{/* Chapter Creation Dialog */}
			<Dialog open={isCreatingChapter} onOpenChange={setIsCreatingChapter}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Chapter</DialogTitle>
						<DialogDescription>Give your chapter a title to organize your story content</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="chapter-title">Chapter Title</Label>
							<Input
								id="chapter-title"
								placeholder="e.g., Introduction, Part 1, The Beginning..."
								value={newChapterTitle}
								onChange={e => setNewChapterTitle(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										handleChapterCreateConfirm()
									}
								}}
								autoFocus
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreatingChapter(false)}>
							Cancel
						</Button>
						<Button onClick={handleChapterCreateConfirm} disabled={!newChapterTitle.trim()}>
							Create Chapter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Block Type Selection Modal */}
			<BlockTypeSelector
				open={isCreatingBlock}
				onOpenChange={setIsCreatingBlock}
				onSelectType={handleBlockTypeSelect}
			/>
		</div>
	)
}
