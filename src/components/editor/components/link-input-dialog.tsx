'use client'

import { Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@smseditor/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@smseditor/components/ui/dialog'
import { Input } from '@smseditor/components/ui/input'
import { Label } from '@smseditor/components/ui/label'

interface LinkInputDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialUrl?: string
	onSubmit: (url: string | null) => void
}

/**
 * Link Input Dialog
 * Replaces native window.prompt with a shadcn/ui dialog for URL input
 */
export function LinkInputDialog({ open, onOpenChange, initialUrl = '', onSubmit }: LinkInputDialogProps) {
	const [url, setUrl] = useState(initialUrl)

	// Reset URL when dialog opens with new initial value
	useEffect(() => {
		if (open) {
			setUrl(initialUrl)
		}
	}, [open, initialUrl])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(url.trim())
		onOpenChange(false)
	}

	const handleRemoveLink = () => {
		onSubmit('')
		onOpenChange(false)
	}

	const handleCancel = () => {
		onSubmit(null)
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5" />
						Insert Link
					</DialogTitle>
					<DialogDescription>Enter the URL for the link. Leave empty to remove an existing link.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="url">URL</Label>
							<Input
								id="url"
								type="url"
								placeholder="https://example.com"
								value={url}
								onChange={e => setUrl(e.target.value)}
								autoFocus
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						{initialUrl && (
							<Button type="button" variant="outline" onClick={handleRemoveLink} className="mr-auto">
								Remove Link
							</Button>
						)}
						<Button type="button" variant="ghost" onClick={handleCancel}>
							Cancel
						</Button>
						<Button type="submit">Apply Link</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
