/**
 * Chapter Sidebar Component
 * Displays list of chapters (containers) with drag & drop reordering
 */

'use client'

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FolderOpen, GripVertical, MoreVertical, Plus, Settings, Trash2 } from 'lucide-react'
import { cn } from 'sms-editor/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar, SidebarBody } from '@/components/ui/sidebar'
import type { CreatorChapter } from '../../types/creator-stories'

export interface ChapterSidebarProps {
	chapters: CreatorChapter[]
	activeChapterId: string | null
	onChapterSelect: (chapterId: string) => void
	onChapterCreate: () => void
	onChapterDelete: (chapterId: string) => void
	onChapterSettings: (chapterId: string) => void
	onReorder: (chapters: CreatorChapter[]) => void
	blockCounts?: Record<string, number> // Optional: display block count per chapter
}

function SortableChapterItem({
	chapter,
	isActive,
	onSelect,
	onDelete,
	onSettings,
	blockCount,
}: {
	chapter: CreatorChapter
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

export function ChapterSidebar({
	chapters,
	activeChapterId,
	onChapterSelect,
	onChapterCreate,
	onChapterDelete,
	onChapterSettings,
	onReorder,
	blockCounts,
}: ChapterSidebarProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			const oldIndex = chapters.findIndex(ch => ch.id === active.id)
			const newIndex = chapters.findIndex(ch => ch.id === over.id)

			const reordered = arrayMove(chapters, oldIndex, newIndex)
			onReorder(reordered)
		}
	}

	return (
		<Sidebar>
			<SidebarBody className="border-r bg-muted/30">
				<div className="flex flex-col h-full overflow-hidden">
					<ChapterSidebarHeader chaptersCount={chapters.length} onChapterCreate={onChapterCreate} />

					{/* Chapters List */}
					<ScrollArea className="flex-1 p-4">
						{chapters.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								<FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No chapters yet</p>
								<p className="text-xs mt-1">Click "New Chapter" to get started</p>
							</div>
						) : (
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
									{chapters.map(chapter => (
										<SortableChapterItem
											key={chapter.id}
											chapter={chapter}
											isActive={chapter.id === activeChapterId}
											onSelect={() => onChapterSelect(chapter.id)}
											onDelete={() => onChapterDelete(chapter.id)}
											onSettings={() => onChapterSettings(chapter.id)}
											blockCount={blockCounts?.[chapter.id]}
										/>
									))}
								</SortableContext>
							</DndContext>
						)}
					</ScrollArea>
				</div>
			</SidebarBody>
		</Sidebar>
	)
}

function ChapterSidebarHeader({
	chaptersCount,
	onChapterCreate,
}: {
	chaptersCount: number
	onChapterCreate: () => void
}) {
	return (
		<div className="border-b bg-card">
			<div className="p-4">
				<div className="flex items-center gap-2 mb-3">
					<FolderOpen className="h-5 w-5 text-primary shrink-0" />
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<h2 className="font-semibold text-sm text-foreground">CHAPTERS</h2>
						<Badge variant="secondary" className="text-xs">
							{chaptersCount}
						</Badge>
					</div>
				</div>

				<Button onClick={onChapterCreate} className="w-full" size="sm">
					<Plus className="mr-2 h-4 w-4" />
					New Chapter
				</Button>
			</div>
		</div>
	)
}
