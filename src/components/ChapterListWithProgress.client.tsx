'use client'

import { getReadChapters } from '@sms-editor/actions/readingProgress.actions'
import type { ChapterWithExpand, CreatorStory } from '@sms-editor/types/creator-stories'
import { BookOpen, Crown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from '@/components/global/image-fallback.component'
import { Button } from '@/components/ui/button'
import { useIsSubscribed } from '@/hooks/use-subscription'
import { client } from '@/lib/auth/auth.client'

interface ChapterListWithProgressProps {
	story: CreatorStory
	chapters: ChapterWithExpand[]
}

export function ChapterListWithProgress({ story, chapters }: ChapterListWithProgressProps) {
	const { data: session } = client.useSession()
	const isSubscribed = useIsSubscribed()
	const [readChapters, setReadChapters] = useState<Set<string>>(new Set())

	useEffect(() => {
		if (isSubscribed) {
			getReadChapters(story.id).then(setReadChapters)
		}
	}, [isSubscribed, story.id])

	const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

	return (
		<div className="space-y-6">
			{/* Upgrade banner */}
			{!session && (
				<div className="bg-muted/50 border rounded-lg p-4">
					<div className="flex items-start gap-3">
						<BookOpen className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm font-medium">Track your reading progress</p>
							<p className="text-xs text-muted-foreground mt-1">Sign in and subscribe to save your progress</p>
						</div>
						<Button asChild size="sm" variant="outline">
							<Link href="/auth">Sign In</Link>
						</Button>
					</div>
				</div>
			)}

			{session && !isSubscribed && (
				<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Crown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm font-medium">Save your reading progress</p>
							<p className="text-xs text-muted-foreground mt-1">Upgrade to Reader to save your progress</p>
						</div>
						<Button asChild size="sm">
							<Link href="/premium">Upgrade</Link>
						</Button>
					</div>
				</div>
			)}

			{/* Chapter list */}
			<div className="space-y-3">
				{sortedChapters.map((chapter, index) => {
					const isRead = isSubscribed && readChapters.has(chapter.id)
					const isScheduled = chapter.programed && new Date(chapter.programed) > new Date()
					const coverImageUrl = chapter.expand?.coverImage
						? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/images/${chapter.expand.coverImage.id}/${chapter.expand.coverImage.image}`
						: null

					return (
						<Link
							key={chapter.id}
							href={isScheduled ? '#' : `/read/${story.slug}/${chapter.id}`}
							className={`block group rounded-lg border transition-all p-4 ${isScheduled ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:shadow-md'} ${isRead ? 'bg-muted/50 opacity-75' : 'bg-card'}`}
						>
							<div className="flex items-center gap-4">
								<div
									className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 font-semibold ${isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}
								>
									{index + 1}
								</div>

								{coverImageUrl && (
									<div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
										<Image
											src={coverImageUrl}
											alt={chapter.title}
											className="object-cover w-full h-full"
											width={100}
											height={100}
										/>
									</div>
								)}

								<div className="flex-1 min-w-0">
									<h3
										className={`font-semibold text-base truncate ${isRead ? 'text-muted-foreground' : 'group-hover:text-primary'}`}
									>
										{chapter.title}
									</h3>
									{isRead && (
										<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
											<span className="text-primary">✓ Read</span>
										</div>
									)}
								</div>

								{isRead && (
									<div className="shrink-0">
										<div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
											<svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									</div>
								)}
							</div>
						</Link>
					)
				})}
			</div>
		</div>
	)
}
