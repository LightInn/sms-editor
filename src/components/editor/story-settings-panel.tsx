/**
 * Story Settings Panel Component
 * Displays story settings when no chapter is selected in the editor
 * Same content as StorySettingsDialog but displayed inline
 */

'use client'

import { HelpCircle, Save, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { pb } from '@/lib/pocketbase'
import { deleteStoryAction, updateStoryAction } from '../../actions/story'
import type { Character, CreatorStory, StoryWithExpand } from '../../types/creator-stories'
import { generateSlug } from '../../types/creator-stories'
import { CategoryInput } from '../category-input'
import { CharacterEditor } from './character-editor'
import { MediaUpload } from './media-upload'

export interface StorySettingsPanelProps {
	story: CreatorStory
	onUpdate: (story: CreatorStory) => void
}

export function StorySettingsPanel({ story, onUpdate }: StorySettingsPanelProps) {
	const router = useRouter()

	// Form state - initialize with story values
	const [title, setTitle] = useState(story.title)
	const [description, setDescription] = useState(story.description)
	const [slug, setSlug] = useState(story.slug)
	const [categories, setCategories] = useState<string[]>(story.categories)
	const [characters, setCharacters] = useState<Character[]>(story.characters)
	const [isCompleted, setIsCompleted] = useState(story.isCompleted)
	const [isPublished, setIsPublished] = useState(story.isPublished)
	const [isNsfw, setIsNsfw] = useState(story.nsfw ?? true)

	// UI state
	const [isSaving, setIsSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showHelpDialog, setShowHelpDialog] = useState(false)

	// Cover image state
	const [coverImage, setCoverImage] = useState<string>(story.coverImage || '')
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

	// Update state when story changes
	useEffect(() => {
		setTitle(story.title)
		setDescription(story.description)
		setSlug(story.slug)
		setCategories(story.categories)
		setCharacters(story.characters)
		setIsCompleted(story.isCompleted)
		setIsPublished(story.isPublished)
		setIsNsfw(story.nsfw ?? true)

		// Handle cover image - preserve URL if ID hasn't changed
		const newCoverImageId = story.coverImage || ''
		setCoverImage(prev => {
			// If the ID changed, update it
			if (prev !== newCoverImageId) {
				return newCoverImageId
			}
			return prev
		})

		// Extract coverImage URL from expand data if available
		const storyWithExpand = story as StoryWithExpand
		if (storyWithExpand.expand?.coverImage) {
			const imageRecord = storyWithExpand.expand.coverImage
			const url = `${pb.baseUrl}/api/files/images/${imageRecord.id}/${imageRecord.image}`
			setCoverImageUrl(url)
		} else if (!story.coverImage) {
			// Only reset URL if coverImage was actually removed
			setCoverImageUrl(null)
		}
		// If story.coverImage exists but no expand data, PRESERVE the existing coverImageUrl
		// This happens after save when the response doesn't include expand data

		setIsDirty(false)
	}, [story])

	// Auto-generate slug from title
	const handleTitleChange = (value: string) => {
		setTitle(value)
		setIsDirty(true)
		// Only auto-generate if slug matches current title's slug
		if (slug === generateSlug(story.title)) {
			setSlug(generateSlug(value))
		}
	}

	// Handle cover image upload
	const handleCoverImageUpload = (recordId: string, url: string, _alt: string, _type: 'image' | 'video') => {
		setCoverImage(recordId)
		setCoverImageUrl(url)
		setIsDirty(true)
	}

	// Track changes
	const handleDescriptionChange = (value: string) => {
		setDescription(value)
		setIsDirty(true)
	}

	const handleSlugChange = (value: string) => {
		setSlug(value.toLowerCase())
		setIsDirty(true)
	}

	const handleCategoriesChange = (value: string[]) => {
		setCategories(value)
		setIsDirty(true)
	}

	const handleCharactersChange = (value: Character[]) => {
		setCharacters(value)
		setIsDirty(true)
	}

	const handleCompletedChange = (value: boolean) => {
		setIsCompleted(value)
		setIsDirty(true)
	}

	const handlePublishedChange = (value: boolean) => {
		setIsPublished(value)
		setIsDirty(true)
	}

	const handleNsfwChange = (value: boolean) => {
		setIsNsfw(value)
		setIsDirty(true)
	}

	// Save handler
	const handleSave = async () => {
		if (!title.trim()) {
			toast.error('Story title is required')
			return
		}

		if (!slug.trim()) {
			toast.error('URL slug is required')
			return
		}

		setIsSaving(true)
		try {
			const result = await updateStoryAction(story.id, {
				title: title.trim(),
				description,
				slug: slug.trim(),
				categories,
				characters,
				isCompleted,
				isPublished,
				nsfw: isNsfw,
				coverImage: coverImage || null,
			})

			if (result.success && result.story) {
				setIsDirty(false)
				toast.success('Story settings saved!')
				onUpdate(result.story)
			} else {
				toast.error(result.error || 'Failed to save story settings')
			}
		} catch (error) {
			console.error('Failed to save story:', error)
			toast.error('Failed to save story settings')
		} finally {
			setIsSaving(false)
		}
	}

	// Delete handler
	const handleDelete = () => {
		setShowDeleteDialog(true)
	}

	const handleDeleteConfirm = async () => {
		try {
			const result = await deleteStoryAction(story.id)
			if (result.success) {
				toast.success('Story deleted')
				router.push('/editor')
			} else {
				toast.error(result.error || 'Failed to delete story')
			}
		} catch (error) {
			console.error('Failed to delete story:', error)
			toast.error('Failed to delete story')
		}
		setShowDeleteDialog(false)
	}

	return (
		<div className="flex items-start justify-center min-h-full p-8 overflow-y-auto">
			<div className="w-full max-w-2xl space-y-6 pb-8">
				{/* Header */}
				<div className="relative mb-8">
					{/* Help Button - Top Right */}
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-0 right-0"
						onClick={() => setShowHelpDialog(true)}
						title="How it works"
					>
						<HelpCircle className="h-5 w-5 text-muted-foreground" />
					</Button>

					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2">Story Settings</h1>
						<p className="text-muted-foreground">
							Configure your story's settings or select a chapter in the sidebar to start editing
						</p>
					</div>
				</div>

				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Basic Information</CardTitle>
						<CardDescription>Title, description, and URL slug</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Title */}
						<div className="space-y-2">
							<Label htmlFor="title" className="text-sm text-muted-foreground">
								Title *
							</Label>
							<Input
								id="title"
								className="bg-transparent border px-3 py-2 text-sm"
								placeholder="A Modern Love Story"
								value={title}
								onChange={e => handleTitleChange(e.target.value)}
								maxLength={200}
								required
								disabled={isSaving}
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description" className="text-sm text-muted-foreground">
								Description
							</Label>
							<Textarea
								id="description"
								className="min-h-[100px] resize-y text-sm bg-transparent border px-3 py-2"
								placeholder="A heartfelt story of love told through SMS messages..."
								value={description}
								onChange={e => handleDescriptionChange(e.target.value)}
								rows={4}
								maxLength={5000}
								disabled={isSaving}
							/>
							<p className="text-muted-foreground text-xs">This will be displayed on your story card</p>
						</div>

						{/* Slug */}
						<div className="space-y-2">
							<Label htmlFor="slug" className="text-sm text-muted-foreground">
								URL Slug *
							</Label>
							<Input
								id="slug"
								className="bg-transparent border px-3 py-2 text-sm"
								placeholder="a-modern-love-story"
								value={slug}
								onChange={e => handleSlugChange(e.target.value)}
								maxLength={200}
								required
								disabled={isSaving}
							/>
							<p className="text-muted-foreground text-xs">This will be used in the URL: /story/{slug}</p>
						</div>
					</CardContent>
				</Card>

				{/* Categories */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Categories</CardTitle>
						<CardDescription>Add tags to help readers find your story</CardDescription>
					</CardHeader>
					<CardContent>
						<CategoryInput categories={categories} onChange={handleCategoriesChange} />
					</CardContent>
				</Card>

				{/* Characters */}
				<CharacterEditor characters={characters} onChange={handleCharactersChange} />

				{/* Cover Image */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Cover Image</CardTitle>
						<CardDescription>Upload an image to display as the story cover</CardDescription>
					</CardHeader>
					<CardContent>
						<MediaUpload
							onUpload={handleCoverImageUpload}
							currentMediaUrl={coverImageUrl || undefined}
							currentMediaAlt="Story cover image"
							currentMediaType="image"
						/>
					</CardContent>
				</Card>

				{/* Story Status */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Story Status</CardTitle>
						<CardDescription>Control your story's visibility and completion status</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Published Toggle */}
						<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
							<div className="space-y-0.5">
								<Label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
									Publish story
								</Label>
								<p className="text-xs text-muted-foreground">
									{isPublished ? 'Story is visible to all readers' : 'Story is in draft mode'}
									<br />
									You can change the publication date for each chapter in the "Schedule" tab at the top of the page!
								</p>
							</div>
							<Switch
								id="isPublished"
								checked={isPublished}
								onCheckedChange={handlePublishedChange}
								disabled={isSaving}
							/>
						</div>

						{/* Completed Toggle */}
						<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
							<div className="space-y-0.5">
								<Label htmlFor="isCompleted" className="text-sm font-medium cursor-pointer">
									Mark as completed
								</Label>
								<p className="text-xs text-muted-foreground">
									{isCompleted ? 'Story shows a "Completed" badge' : 'Story is marked as ongoing'}
								</p>
							</div>
							<Switch
								id="isCompleted"
								checked={isCompleted}
								onCheckedChange={handleCompletedChange}
								disabled={isSaving}
							/>
						</div>

						{/* NSFW Toggle */}
						<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
							<div className="space-y-0.5">
								<Label htmlFor="isNsfw" className="text-sm font-medium cursor-pointer">
									NSFW Content
								</Label>
								<p className="text-xs text-muted-foreground">
									{isNsfw ? 'Story contains adult/mature content' : 'Story is safe for all audiences'}
								</p>
							</div>
							<Switch id="isNsfw" checked={isNsfw} onCheckedChange={handleNsfwChange} disabled={isSaving} />
						</div>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex items-center justify-between pt-4">
					<Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete Story
					</Button>

					<Button onClick={handleSave} disabled={isSaving || !isDirty}>
						<Save className="h-4 w-4 mr-2" />
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Story</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{story.title || 'this story'}"? This action cannot be undone and will
							also delete all chapters and blocks within this story.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteConfirm}>
							Delete Story
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Help Tutorial Dialog */}
			<Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>How Stories Work</DialogTitle>
						<DialogDescription>
							Learn how to create and organize your stories with chapters and blocks
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
							<Image
								src="/trust_the_process.jpg"
								alt="Story editor tutorial"
								fill
								className="object-contain"
								priority
							/>
						</div>
						<div className="mt-4 space-y-3 text-sm text-muted-foreground">
							<p>
								<strong className="text-foreground">Stories</strong> are the main container for your content. Each story
								has a title, description, cover image, and categories.
							</p>
							<p>
								<strong className="text-foreground">Chapters</strong> organize your story into sections. Each chapter
								can have its own cover image and scheduled publication date.
							</p>
							<p>
								<strong className="text-foreground">Blocks</strong> are the content units within chapters. You can add
								rich text, media (images/videos), or SMS-style conversations.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setShowHelpDialog(false)}>Got it!</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
