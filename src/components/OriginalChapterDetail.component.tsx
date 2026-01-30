import type { ChapterWithExpand, StoryWithExpand } from '@sms-editor/types/creator-stories'
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OriginalChapterContent } from './OriginalChapterContent.component'

interface OriginalChapterDetailProps {
	story: StoryWithExpand
	chapter: ChapterWithExpand
}

export default function OriginalChapterDetail({ story, chapter }: OriginalChapterDetailProps) {
	const authorName = story.expand?.author?.name || story.expand?.author?.email || 'Anonymous'

	// Find previous and next chapters
	const allChapters = story.expand?.chapters || []
	const sortedChapters = allChapters.sort((a, b) => a.order - b.order)
	const currentIndex = sortedChapters.findIndex(c => c.id === chapter.id)
	const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null
	const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null

	return (
		<div className="container max-w-4xl mx-auto py-8 px-4">
			{/* Navigation */}
			<div className="flex items-center justify-between mb-6">
				<Link href={`/story/${story.slug}`}>
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Back to Story
					</Button>
				</Link>

				<div className="flex items-center gap-2">
					{prevChapter && (
						<Link href={`/story/${story.slug}/${prevChapter.id}`}>
							<Button variant="outline" size="sm" className="gap-2">
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>
						</Link>
					)}
					{nextChapter && (
						<Link href={`/story/${story.slug}/${nextChapter.id}`}>
							<Button variant="outline" size="sm" className="gap-2">
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Chapter header */}
			<div className="mb-8">
				<div className="flex items-center gap-2 mb-2">
					<Badge variant="secondary">Original Story</Badge>
					<Badge variant="outline">Chapter {chapter.order + 1}</Badge>
				</div>
				<h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>From "{story.title}"</span>
					<span>by {authorName}</span>
				</div>
			</div>

			<Separator className="mb-8" />

			{/* Chapter content */}
			<div className="space-y-8">
				{chapter.expand?.blocks && chapter.expand.blocks.length > 0 ? (
					<OriginalChapterContent blocks={chapter.expand.blocks} story={story} />
				) : (
					<Card>
						<CardContent className="py-12 text-center">
							<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">This chapter has no content yet.</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Navigation footer */}
			{(prevChapter || nextChapter) && (
				<>
					<Separator className="my-8" />
					<div className="flex items-center justify-between">
						{prevChapter ? (
							<Link href={`/story/${story.slug}/${prevChapter.id}`}>
								<Button variant="outline" className="gap-2">
									<ChevronLeft className="h-4 w-4" />
									Previous: {prevChapter.title}
								</Button>
							</Link>
						) : (
							<div />
						)}

						{nextChapter ? (
							<Link href={`/story/${story.slug}/${nextChapter.id}`}>
								<Button variant="outline" className="gap-2">
									Next: {nextChapter.title}
									<ChevronRight className="h-4 w-4" />
								</Button>
							</Link>
						) : (
							<div />
						)}
					</div>
				</>
			)}
		</div>
	)
}
