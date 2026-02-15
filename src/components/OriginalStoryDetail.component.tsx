import { timeAgo } from '@sms-editor/lib/date-utils'
import type { ChapterWithExpand, CreatorStory, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Eye, User } from 'lucide-react'
import Link from 'next/link'
import Image from '@/components/global/image-fallback.component'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChapterListWithProgress } from './ChapterListWithProgress.client'

interface OriginalStoryDetailProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
}

export default function OriginalStoryDetail({ story, chapters }: OriginalStoryDetailProps) {
	const authorName = story.expand?.author?.name || story.expand?.author?.email || 'Anonymous'
	const authorId = story.author
	const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

	// Construct proper cover image URL from expanded image record
	const coverImageUrl = story.expand?.coverImage
		? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/images/${story.expand.coverImage.id}/${story.expand.coverImage.image}`
		: null

	// Count all displayed chapters (published + scheduled, excludes drafts)
	const displayedChaptersCount = sortedChapters.length

	return (
		<div className="container max-w-4xl mx-auto py-8 px-4">
			{/* Back navigation */}
			<div className="mb-6">
				<Link href="/explore">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Back to Original Stories
					</Button>
				</Link>
			</div>

			{/* Story header */}
			<div className="space-y-6 mb-8">
				<div className="flex flex-col lg:flex-row gap-6">
					{/* Cover image */}
					{coverImageUrl && (
						<div className="w-full lg:w-1/3 shrink-0">
							<div className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-muted">
								<Image
									src={coverImageUrl}
									alt={story.expand?.coverImage?.alt || story.title}
									fill
									className="object-cover"
									sizes="(max-width: 1024px) 100vw, 33vw"
								/>
							</div>
						</div>
					)}

					{/* Story info */}
					<div className="flex-1 space-y-4">
						<div>
							<Badge variant="secondary" className="mb-2">
								Original Story
							</Badge>
							<h1 className="text-3xl lg:text-4xl font-bold">{story.title}</h1>
							<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<User className="h-4 w-4" />
									<Link href={`/author/${authorId}`} className="hover:underline">
										{authorName}
									</Link>
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									{timeAgo(story.created)}
								</div>
								<div className="flex items-center gap-1">
									<Eye className="h-4 w-4" />
									{story.views || 0} views
								</div>
								{story.isCompleted && (
									<div className="flex items-center gap-1">
										<CheckCircle className="h-4 w-4" />
										Completed
									</div>
								)}
							</div>
						</div>

						{story.description && (
							<div className="prose prose-sm max-w-none">
								<p className="text-foreground">{story.description}</p>
							</div>
						)}

						{/* Categories */}
						{story.categories && story.categories.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{story.categories.map(category => (
									<Badge key={category} variant="outline">
										#{category}
									</Badge>
								))}
							</div>
						)}

						{/* Characters */}
						{story.characters && story.characters.length > 0 && (
							<div>
								<h3 className="text-sm font-medium mb-2">Characters</h3>
								<div className="flex flex-wrap gap-2">
									{story.characters.map(character => (
										<Badge key={character.id} variant="secondary">
											{character.firstName} {character.lastName}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<Separator className="my-8" />

			{/* Chapters */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<BookOpen className="h-5 w-5" />
					<h2 className="text-2xl font-semibold">Chapters</h2>
					<Badge variant="outline">{displayedChaptersCount}</Badge>
				</div>

				{sortedChapters.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center">
							<p className="text-muted-foreground">No chapters have been published yet.</p>
						</CardContent>
					</Card>
				) : (
					<ChapterListWithProgress story={story as CreatorStory} chapters={sortedChapters} />
				)}
			</div>
		</div>
	)
}
