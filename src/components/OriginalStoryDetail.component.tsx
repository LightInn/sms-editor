import { formatMediumDate, formatScheduledDate, timeAgo } from '@sms-editor/lib/date-utils'
// import { formatMediumDate, formatScheduledDate, timeAgo } from '@sms-editor/lib/date-formatters'
import type { ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Clock, Lock, User } from 'lucide-react'
import Link from 'next/link'
import Image from '@/components/global/image-fallback.component'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface OriginalStoryDetailProps {
	story: StoryWithExpand
	chapters: ChapterWithExpand[]
}

/**
 * Get chapter publication status
 */
function getChapterStatusLocal(chapter: ChapterWithExpand): 'draft' | 'published' | 'scheduled' {
	if (!chapter.isPublished) return 'draft'
	if (chapter.programed) {
		const programedDate = new Date(chapter.programed)
		if (programedDate > new Date()) return 'scheduled'
	}
	return 'published'
}

/**
 * Get cover image URL for a chapter
 */
function getChapterCoverImageUrl(chapter: ChapterWithExpand): string | null {
	if (!chapter.expand?.coverImage) return null
	const { id, image } = chapter.expand.coverImage
	return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/images/${id}/${image}`
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
									<Link
										href={`${process.env.NEXT_PUBLIC_ORIGINAL_PREFIX}/author/${authorId}`}
										className="hover:underline"
									>
										{authorName}
									</Link>
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									{timeAgo(story.created)}
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
					<div className="space-y-3 w-full">
						{sortedChapters.map(chapter => {
							const status = getChapterStatusLocal(chapter)
							const chapterCoverUrl = getChapterCoverImageUrl(chapter)
							const isLocked = status === 'scheduled'

							return (
								<div key={chapter.id} className="rounded-md bg-background/40 p-4 w-full">
									<div className="flex items-start gap-4 w-full">
										{isLocked ? (
											// Locked chapter (scheduled)
											<div className="flex flex-1 items-start gap-4 w-full">
												<div className="h-20 w-16 min-w-16 relative shrink-0 rounded-md overflow-hidden bg-muted grayscale">
													{chapterCoverUrl ? (
														<Image src={chapterCoverUrl} alt={chapter.title} fill className="object-cover" />
													) : null}
													<div className="absolute inset-0 flex items-center justify-center bg-black/50">
														<Lock className="h-6 w-6 text-white" />
													</div>
												</div>
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<h4 className="font-medium opacity-70">
															{chapter.title || `Chapter ${chapter.order + 1}`}
														</h4>
														<Badge variant="secondary" className="text-xs">
															<Clock className="h-3 w-3 mr-1" />
															Scheduled
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground mt-1">
														Available {chapter.programed ? formatScheduledDate(chapter.programed) : 'soon'}
													</p>
												</div>
											</div>
										) : (
											// Published chapter (accessible) - Link to fullscreen reader
											<Link
												prefetch={false}
												href={`/read/${story.slug}/${chapter.id}`}
												className="group flex flex-1 items-start gap-4 focus:outline-none"
											>
												<div className="h-20 w-16 min-w-16 relative shrink-0 rounded-md overflow-hidden bg-muted">
													{chapterCoverUrl ? (
														<Image src={chapterCoverUrl} alt={chapter.title} fill className="object-cover" />
													) : null}
												</div>
												<div className="flex-1">
													<h4 className="font-medium transition-colors duration-150 group-hover:text-primary">
														{chapter.title || `Chapter ${chapter.order + 1}`}
													</h4>
													<p className="text-sm text-muted-foreground">{formatMediumDate(chapter.created)}</p>
												</div>
											</Link>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
