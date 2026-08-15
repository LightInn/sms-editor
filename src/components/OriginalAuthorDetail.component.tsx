import type { StoryWithExpand } from '@sms-editor/types/creator-stories'
import { ArrowLeft, BookOpen, Calendar, CheckCircle, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import Image from '@/components/global/image-fallback.component'
import FollowButton from '@/components/social/follow-button.client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentSession } from '@/lib/auth/session'
import { pbFileUrl } from '@/lib/cover-url'
import { timeAgo } from '@/lib/datetime'
import type { FollowTarget } from '@/lib/social/follow-target'
import { isFollowing } from '@/services/follow.service'

export async function OriginalAuthorDetail({ stories }: { stories: StoryWithExpand[] }) {
	// Get author info from first story (assuming all stories have same author)
	const authorInfo = stories[0]?.expand?.author
	const authorName = authorInfo?.name || authorInfo?.email || 'Anonymous Author'
	const authorBio = authorInfo?.bio
	const authorLink = authorInfo?.link

	const authorId = stories[0]?.author
	const followTarget: FollowTarget | null = authorId ? { kind: 'creator', userId: authorId } : null
	const session = await getCurrentSession()
	const following = followTarget ? await isFollowing(followTarget, session?.user.id ?? null) : false

	return (
		<div className="container max-w-6xl mx-auto py-8 px-4">
			{/* Back navigation */}
			<div className="mb-6">
				<Link href="/original">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Back to Original Stories
					</Button>
				</Link>
			</div>

			{/* Author header */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
						<User className="h-8 w-8 text-muted-foreground" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">{authorName}</h1>
						<div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
							<div className="flex items-center gap-1">
								<BookOpen className="h-4 w-4" />
								{stories.length} {stories.length === 1 ? 'story' : 'stories'}
							</div>
							{stories.length > 0 && (
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									Active since {timeAgo(stories[stories.length - 1]?.created)}
								</div>
							)}
						</div>
					</div>
				</div>

				{followTarget && (
					<div className="mb-4">
						<FollowButton following={following} target={followTarget} />
					</div>
				)}

				{/* Bio section */}
				{authorBio && (
					<Card className="mb-4">
						<CardContent className="pt-6">
							<p className="text-muted-foreground whitespace-pre-wrap">{authorBio}</p>
						</CardContent>
					</Card>
				)}

				{/* Author link */}
				{authorLink && (
					<div className="mb-4">
						<a href={authorLink} target="_blank" rel="noopener noreferrer">
							<Button variant="outline" size="sm" className="gap-2">
								<ExternalLink className="h-4 w-4" />
								Visit {new URL(authorLink).hostname}
							</Button>
						</a>
					</div>
				)}
			</div>

			{/* Stories grid */}
			<div className="space-y-6">
				<h2 className="text-2xl font-semibold">Published Stories</h2>

				{stories.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No published stories yet.</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{stories.map(story => (
							<StoryCard key={story.id} story={story} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function StoryCard({ story }: { story: StoryWithExpand }) {
	// These are original stories; `/story/{slug}` is the Reddit catalogue and 404s
	// here — the same wrong-route bug M0-T5 fixed on the category pages.
	const href = `/original/story/${story.slug}`

	return (
		<Card className="hover:shadow-md transition-shadow">
			<Link href={href} className="block">
				{/* Cover image */}
				{story.coverImage && (
					<div className="aspect-4/3 relative overflow-hidden rounded-t-lg bg-muted">
						<Image
							src={story.expand?.coverImage ? pbFileUrl(story.expand.coverImage, story.expand.coverImage.image) : ''}
							alt={story.title}
							fill
							className="object-cover transition-transform duration-300 ease-out hover:scale-105"
							sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
						/>
					</div>
				)}

				<CardHeader className="pb-3">
					<CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="h-4 w-4" />
						{timeAgo(story.created)}
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					{story.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{story.description}</p>}

					{/* Categories */}
					{story.categories && story.categories.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-3">
							{story.categories.slice(0, 2).map(category => (
								<Badge key={category} variant="secondary" className="text-xs">
									#{category}
								</Badge>
							))}
							{story.categories.length > 2 && (
								<Badge variant="outline" className="text-xs">
									+{story.categories.length - 2}
								</Badge>
							)}
						</div>
					)}

					{/* Status badges */}
					<div className="flex items-center gap-2">
						{story.isCompleted && (
							<Badge variant="default" className="text-xs">
								<CheckCircle className="h-3 w-3 mr-1" />
								Completed
							</Badge>
						)}
						<Badge variant="outline" className="text-xs">
							{story.expand?.chapters?.length || 0} chapters
						</Badge>
					</div>
				</CardContent>
			</Link>
		</Card>
	)
}
