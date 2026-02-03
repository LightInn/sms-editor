/**
 * End of Story Modal
 * Displayed when user reaches the end of the last chapter
 */

'use client'

import { BookOpen, Lock, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface EndOfStoryModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	authorName?: string
	storyTitle?: string
}

export function EndOfStoryModal({ open, onOpenChange, authorName, storyTitle }: EndOfStoryModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex justify-center mb-4">
						<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
							<Lock className="h-8 w-8 text-primary" />
						</div>
					</div>
					<DialogTitle className="text-center text-2xl">End of Story</DialogTitle>
					<DialogDescription className="text-center text-base pt-2">
						{storyTitle ? (
							<>
								You've reached the end of all available chapters for <span className="font-semibold">{storyTitle}</span>
								.
							</>
						) : (
							<>You've reached the end of all available chapters for this story.</>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 pt-4">
					<Link href="/" className="block">
						<Button variant="default" size="lg" className="w-full gap-2">
							<BookOpen className="h-5 w-5" />
							Discover other stories
						</Button>
					</Link>

					{authorName && (
						<Link href={`${process.env.NEXT_PUBLIC_ORIGINAL_PREFIX}/author/${authorName}`} className="block">
							<Button variant="outline" size="lg" className="w-full gap-2">
								<User className="h-5 w-5" />
								View author's profile
							</Button>
						</Link>
					)}
				</div>

				<p className="text-xs text-muted-foreground text-center pt-4">Thank you for reading this story!</p>
			</DialogContent>
		</Dialog>
	)
}
