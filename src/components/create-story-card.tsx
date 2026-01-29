/**
 * Create Story Card Component
 * CTA card for creating a new story
 */

'use client'

import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export function CreateStoryCard() {
	return (
		<Link href="/editor/new" className="block h-full">
			<Card className="h-full min-h-[300px] border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer group">
				<CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
					<div className="rounded-full bg-primary/10 p-4 mb-4  transition-transform duration-200">
						<PlusCircle className="h-12 w-12 text-primary" />
					</div>
					<h3 className="text-lg font-semibold mb-2 text-primary">Create New Story</h3>
					<p className="text-sm text-muted-foreground max-w-xs">Start crafting your own SMS-based love story</p>
				</CardContent>
			</Card>
		</Link>
	)
}
