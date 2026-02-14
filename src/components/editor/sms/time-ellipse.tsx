/**
 * Time Ellipse Component
 * Displays a time gap indicator in SMS conversations (e.g., "2 hours later")
 */

'use client'

import { cn } from '@sms-editor/lib/utils'
import { Clock, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export interface TimeEllipseProps {
	content: string
	onDelete?: () => void
	onEdit?: () => void
	readonly?: boolean
}

export function TimeEllipse({ content, onDelete, onEdit, readonly = false }: TimeEllipseProps) {
	return (
		<div className={cn('flex items-center justify-center my-4', !readonly && 'group')}>
			<div className="relative flex items-center gap-2 bg-muted/80 text-muted-foreground text-sm px-4 py-2 rounded-full">
				<Clock className="h-3.5 w-3.5" />
				<span className="font-medium">{content}</span>

				{/* Actions menu for editor mode */}
				{!readonly && onDelete && onEdit && (
					<div className="absolute -right-2 top-1/2 -translate-y-1/2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-white shadow-sm"
								>
									<MoreVertical className="h-3 w-3 text-black" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="center">
								<DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
								<DropdownMenuItem onClick={onDelete} className="text-destructive">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>
		</div>
	)
}
