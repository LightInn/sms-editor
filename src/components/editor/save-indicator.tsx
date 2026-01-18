/**
 * Save Indicator Component
 * Displays the current save status with unsaved changes detection
 */

'use client'

import { cn } from '@smseditor/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, Check, Circle, Loader2 } from 'lucide-react'

export interface SaveIndicatorProps {
	isSaving: boolean
	isDirty: boolean
	lastSaved: Date | null
	error: Error | null
	className?: string
	itemInfo?: {
		type: 'block' | 'chapter'
		title?: string
	}
}

export function SaveIndicator({ isSaving, isDirty, lastSaved, error, className, itemInfo }: SaveIndicatorProps) {
	const getItemLabel = () => {
		if (!itemInfo) return ''
		const typeLabel = itemInfo.type === 'block' ? 'Block' : 'Chapter'
		const titleLabel = itemInfo.title ? ` "${itemInfo.title}"` : ''
		return `${typeLabel}${titleLabel}`
	}

	if (error) {
		return (
			<div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
				<AlertCircle className="h-4 w-4" />
				<span>Failed to save: {error.message}</span>
			</div>
		)
	}

	if (isSaving) {
		return (
			<div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>Saving...</span>
			</div>
		)
	}

	if (isDirty) {
		return (
			<div className={cn('flex items-center gap-2 text-sm text-orange-600', className)}>
				<Circle className="h-3 w-3 fill-current animate-pulse" />
				<span>Unsaved changes</span>
			</div>
		)
	}

	if (lastSaved) {
		const itemLabel = getItemLabel()
		return (
			<div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
				<Check className="h-4 w-4 text-green-600" />
				<span>
					{itemLabel && `${itemLabel} saved `}
					{formatDistanceToNow(lastSaved, { addSuffix: true })}
				</span>
			</div>
		)
	}

	return null
}
