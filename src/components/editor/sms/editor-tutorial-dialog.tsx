/**
 * SMS Editor Tutorial Dialog
 * Explains how to use the inline SMS editor
 */

'use client'

import { Button } from '@smseditor/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@smseditor/components/ui/dialog'
import { Info } from 'lucide-react'
import { useState } from 'react'

export function EditorTutorialDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-2">
					<Info className="h-4 w-4" />
					How to use the editor?
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>SMS Editor Guide</DialogTitle>
					<DialogDescription>Create SMS conversations intuitively and quickly</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Step 1 */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
								1
							</span>
							Configure participants
						</h3>
						<p className="text-sm text-muted-foreground ml-8">
							Start by configuring at least <strong>2 participants</strong> in the section above. The first participant
							will be the conversation owner (messages on the right).
						</p>
					</div>

					{/* Step 2 */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
								2
							</span>
							Add messages
						</h3>
						<p className="text-sm text-muted-foreground ml-8">
							<strong>Hover</strong> over the left or right side of the phone to reveal the add buttons. Click on the
							desired side to create a message.
						</p>
						<ul className="text-sm text-muted-foreground ml-8 space-y-1 list-disc list-inside">
							<li>
								<strong>Left</strong>: Received messages (other participants)
							</li>
							<li>
								<strong>Right</strong>: Sent messages (owner)
							</li>
						</ul>
					</div>

					{/* Step 3 */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
								3
							</span>
							Keyboard shortcuts - Ultra-fast workflow!
						</h3>
						<p className="text-sm text-muted-foreground ml-8">Create conversations super quickly with arrow keys:</p>
						<div className="ml-8 space-y-2">
							<div className="text-sm text-muted-foreground">
								<strong>Start a message:</strong>
							</div>
							<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">←</kbd> (Arrow Left) for a received message
								</li>
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">→</kbd> (Arrow Right) for a sent message
								</li>
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">↑</kbd> (Arrow Up) to edit the last message
								</li>
							</ul>
							<div className="text-sm text-muted-foreground mt-2">
								<strong>While typing:</strong>
							</div>
							<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> saves and{' '}
									<strong>auto-opens the next message</strong> for the same person
								</li>
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift + Enter</kbd> for a new line
								</li>
								<li>
									<kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> to cancel
								</li>
							</ul>
						</div>
					</div>

					{/* Step 4 */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
								4
							</span>
							Edit or delete
						</h3>
						<p className="text-sm text-muted-foreground ml-8">
							Click on a message bubble to edit it, or use the <strong>⋮</strong> menu for more options.
						</p>
					</div>

					{/* Tip */}
					<div className="rounded-lg p-3 border">
						<p className="text-sm text-blue-50">
							<strong>💡 Pro Tip:</strong> Press <kbd className="px-1 py-0.5 text-xs bg-blue-900 rounded">→</kbd>→ type
							→ <kbd className="px-1 py-0.5 text-xs bg-blue-900 rounded">Enter</kbd> → type →
							<kbd className="px-1 py-0.5 text-xs bg-blue-900 rounded">Enter</kbd>... to create multiple messages in a
							row super fast! Press <kbd className="px-1 py-0.5 text-xs bg-blue-900 rounded">Esc</kbd> then
							<kbd className="px-1 py-0.5 text-xs bg-blue-900 rounded">←</kbd> to switch sides.
						</p>
					</div>
				</div>

				<div className="flex justify-end">
					<Button onClick={() => setOpen(false)}>Got it!</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
