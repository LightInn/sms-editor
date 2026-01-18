/**
 * Autosave Indicator Component
 * Displays the current autosave status
 */

'use client'

import { cn } from '@smseditor/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

export interface AutosaveIndicatorProps {
	isSaving: boolean
	lastSaved: Date | null
	error: Error | null
	className?: string
}

export function AutosaveIndicator({ isSaving, lastSaved, error, className }: AutosaveIndicatorProps) {
	if (error) {
		return (
			<div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
				<AlertCircle className="h-4 w-4" />
				<span>Failed to save</span>
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

	if (lastSaved) {
		return (
			<div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
				<Check className="h-4 w-4 text-green-600" />
				<span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
			</div>
		)
	}

	return null
}
