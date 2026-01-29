/**
 * Story Card Component
 * Displays a creator story in the masonry grid
 */

'use client'

import type { StoryWithExpand } from '@sms-editor/types/creator-stories'
import { format } from 'date-fns'
import { Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from '@/components/global/image-fallback.component'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface StoryCardProps {
	story: StoryWithExpand
	coverImageUrl?: string | null
}

export function StoryCard({ story, coverImageUrl }: StoryCardProps) {
	// Use expand.chapters if available (contains full chapter objects), otherwise fallback to chapters array (IDs only)
	const chapterCount = story.expand?.chapters?.length ?? story.chapters?.length ?? 0

	return (
		<Link href={`/editor/${story.id}/edit`} className="block h-full">
			<Card className="pt-0 h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
				{/* Cover Image */}
				<div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
					<Image
						src={coverImageUrl}
						alt={story.title}
						className="object-cover group-hover:scale-105 transition-transform duration-200"
						fill
						sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					/>
					{/* Status Badge Overlay */}
					<div className="absolute top-2 right-2 flex gap-1">
						<Badge variant={story.isPublished ? 'default' : 'secondary'} className="text-xs">
							{story.isPublished ? 'Published' : 'Draft'}
						</Badge>
						{story.isCompleted && (
							<Badge variant="outline" className="text-xs bg-background/80">
								Completed
							</Badge>
						)}
					</div>
				</div>

				<CardHeader className="pb-3">
					<CardTitle className="text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
						{story.title}
					</CardTitle>
					{story.description && (
						<CardDescription
							className="text-xs md:text-sm line-clamp-2"
							dangerouslySetInnerHTML={{ __html: story.description }}
						/>
					)}
				</CardHeader>

				<CardContent className="space-y-3">
					{/* Categories */}
					{story.categories && story.categories.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{story.categories.slice(0, 3).map(category => (
								<Badge key={category} variant="outline" className="text-xs">
									{category}
								</Badge>
							))}
							{story.categories.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{story.categories.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* Stats */}
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<FileText className="h-3 w-3" />
							<span>
								{chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>{format(new Date(story.created), 'MMM d, yyyy')}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
