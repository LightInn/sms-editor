/**
 * Block Sidebar Component
 * Displays list of blocks within a chapter with drag & drop reordering
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
import { cn } from '@sms-editor/lib/utils'
import { ChevronLeft, FileText, GripVertical, Image, MessageSquare, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar, SidebarBody } from '@/components/ui/sidebar'
import type { CreatorBlock } from '../../types/creator-stories'

export interface BlockSidebarProps {
	blocks: CreatorBlock[]
	activeBlockId: string | null
	onBlockSelect: (blockId: string) => void
	onBlockCreate: () => void
	onBlockDelete: (blockId: string) => void
	onReorder: (blocks: CreatorBlock[]) => void
	chapterTitle: string
	onBackToChapters: () => void
}

function SortableBlockItem({
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
			{/* Actions menu - positioned absolutely outside button */}
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
				{/* Drag handle - must be div for dnd-kit, cannot be button inside button */}
				{/* biome-ignore lint/a11y/useSemanticElements: Cannot use button element inside button parent */}
				<div
					role="button"
					tabIndex={-1}
					className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 bg-transparent border-0 p-0"
					{...attributes}
					{...listeners}
					onClick={e => e.stopPropagation()}
					onKeyDown={e => {
						// Keyboard navigation handled by dnd-kit KeyboardSensor
						e.stopPropagation()
					}}
					suppressHydrationWarning
				>
					<GripVertical className="h-4 w-4" />
				</div>

				{/* Icon */}
				<Icon className="h-4 w-4 text-muted-foreground shrink-0" />

				{/* Content */}
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

export function BlockSidebar({
	blocks,
	activeBlockId,
	onBlockSelect,
	onBlockCreate,
	onBlockDelete,
	onReorder,
	chapterTitle,
	onBackToChapters,
}: BlockSidebarProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			const oldIndex = blocks.findIndex(bl => bl.id === active.id)
			const newIndex = blocks.findIndex(bl => bl.id === over.id)

			const reordered = arrayMove(blocks, oldIndex, newIndex)
			onReorder(reordered)
		}
	}

	return (
		<Sidebar>
			<SidebarBody className="border-r bg-muted/30">
				<div className="flex flex-col h-full overflow-hidden">
					<BlockSidebarHeader
						blocksCount={blocks.length}
						chapterTitle={chapterTitle}
						onBlockCreate={onBlockCreate}
						onBackToChapters={onBackToChapters}
					/>

					{/* Blocks List */}
					<ScrollArea className="flex-1 py-4">
						{blocks.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No blocks yet</p>
								<p className="text-xs mt-1">Click "New Block" to get started</p>
							</div>
						) : (
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={blocks.map(bl => bl.id)} strategy={verticalListSortingStrategy}>
									{blocks.map(block => (
										<SortableBlockItem
											key={block.id}
											block={block}
											isActive={block.id === activeBlockId}
											onSelect={() => onBlockSelect(block.id)}
											onDelete={() => onBlockDelete(block.id)}
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

function BlockSidebarHeader({
	blocksCount,
	chapterTitle,
	onBlockCreate,
	onBackToChapters,
}: {
	blocksCount: number
	chapterTitle: string
	onBlockCreate: () => void
	onBackToChapters: () => void
}) {
	return (
		<div className="border-b bg-card">
			<div className="p-4">
				{/* Back to Chapters button */}
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start mb-3 text-foreground hover:bg-accent"
					onClick={onBackToChapters}
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back to Chapters
				</Button>

				<div className="flex items-center gap-2 mb-3">
					<FileText className="h-5 w-5 text-primary shrink-0" />
					<div className="flex-1 min-w-0">
						<h2 className="font-semibold text-sm text-foreground">BLOCKS</h2>
						<p className="text-xs text-muted-foreground truncate">{chapterTitle}</p>
					</div>
				</div>

				<div className="mb-3">
					<Badge variant="secondary" className="text-xs">
						{blocksCount} {blocksCount === 1 ? 'block' : 'blocks'}
					</Badge>
				</div>

				<Button onClick={onBlockCreate} className="w-full" size="sm">
					<Plus className="mr-2 h-4 w-4" />
					New Block
				</Button>
			</div>
		</div>
	)
}
