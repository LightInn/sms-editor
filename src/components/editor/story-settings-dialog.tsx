/**
 * Story Settings Dialog Component
 * Dialog for editing story metadata (title, description, categories, characters, etc.)
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CategoryInput } from '@smseditor/components/creator-stories/category-input'
import { Button } from '@smseditor/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smseditor/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@smseditor/components/ui/dialog'
import { Input } from '@smseditor/components/ui/input'
import { Label } from '@smseditor/components/ui/label'
import { Switch } from '@smseditor/components/ui/switch'
import { Textarea } from '@smseditor/components/ui/textarea'
import { pb } from '@smseditor/lib/pocketbase'
import { updateStoryAction } from '../../actions/story'
import type { Character, CreatorStory, StoryWithExpand } from '../../types/creator-stories'
import { generateSlug } from '../../types/creator-stories'
import { CharacterEditor } from './character-editor'
import { MediaUpload } from './media-upload'

export interface StorySettingsDialogProps {
	story: CreatorStory
	open: boolean
	onOpenChange: (open: boolean) => void
	onUpdate: (story: CreatorStory) => void
}

export function StorySettingsDialog({ story, open, onOpenChange, onUpdate }: StorySettingsDialogProps) {
	// Form state - initialize with story values
	const [title, setTitle] = useState(story.title)
	const [description, setDescription] = useState(story.description)
	const [slug, setSlug] = useState(story.slug)
	const [categories, setCategories] = useState<string[]>(story.categories)
	const [characters, setCharacters] = useState<Character[]>(story.characters)
	const [isCompleted, setIsCompleted] = useState(story.isCompleted)
	const [isPublished, setIsPublished] = useState(story.isPublished)
	const [isNsfw, setIsNsfw] = useState(story.nsfw ?? true)
	const [isSaving, setIsSaving] = useState(false)

	// Cover image state
	const [coverImage, setCoverImage] = useState<string>(story.coverImage || '') // Image record ID
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null) // URL for display

	// Update coverImage and URL when story changes
	useEffect(() => {
		const storyWithExpand = story as StoryWithExpand

		// Handle cover image - preserve URL if ID hasn't changed
		const newCoverImageId = story.coverImage || ''
		setCoverImage(prev => {
			if (prev !== newCoverImageId) {
				return newCoverImageId
			}
			return prev
		})

		// If we have expand data for coverImage, extract the URL
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
	}, [story])

	// Auto-generate slug from title
	const handleTitleChange = (value: string) => {
		setTitle(value)
		// Only auto-generate if slug matches current title's slug
		if (slug === generateSlug(story.title)) {
			setSlug(generateSlug(value))
		}
	}

	// Handle cover image upload
	const handleCoverImageUpload = (recordId: string, url: string, _alt: string, _type: 'image' | 'video') => {
		setCoverImage(recordId)
		setCoverImageUrl(url)
	}

	// Reset form when dialog opens/closes
	const handleOpenChange = (open: boolean) => {
		if (open) {
			// Reset to current story values when opening
			setTitle(story.title)
			setDescription(story.description)
			setSlug(story.slug)
			setCategories(story.categories)
			setCharacters(story.characters)
			setIsCompleted(story.isCompleted)
			setIsPublished(story.isPublished)
			setIsNsfw(story.nsfw ?? true)
			setCoverImage(story.coverImage || '')

			// Reset cover image URL from expand data
			const storyWithExpand = story as StoryWithExpand
			if (storyWithExpand.expand?.coverImage) {
				const imageRecord = storyWithExpand.expand.coverImage
				const url = `${pb.baseUrl}/api/files/images/${imageRecord.id}/${imageRecord.image}`
				setCoverImageUrl(url)
			} else {
				setCoverImageUrl(null)
			}
		}
		onOpenChange(open)
	}

	// Handle form submission
	const handleSave = async () => {
		setIsSaving(true)
		try {
			// Use server action for secure update
			const result = await updateStoryAction(story.id, {
				title,
				description,
				slug,
				categories,
				characters,
				isCompleted,
				isPublished,
				nsfw: isNsfw,
				coverImage, // Image record ID
			})

			if (result.success && result.story) {
				onUpdate(result.story)
				toast.success('Story settings updated!')
				onOpenChange(false)
			} else {
				toast.error(result.error || 'Failed to update story settings')
			}
		} catch (error) {
			console.error('Failed to update story:', error)
			toast.error('Failed to update story settings')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Story Settings</DialogTitle>
					<DialogDescription>Update your story's general information and metadata</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
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
									onChange={e => setDescription(e.target.value)}
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
									onChange={e => setSlug(e.target.value.toLowerCase())}
									maxLength={200}
									required
									disabled={isSaving}
								/>
								<p className="text-muted-foreground text-xs">This will be used in the URL: /editor/{slug}</p>
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
							<CategoryInput categories={categories} onChange={setCategories} />
						</CardContent>
					</Card>

					{/* Characters */}
					<CharacterEditor characters={characters} onChange={setCharacters} />

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
									</p>
								</div>
								<Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} disabled={isSaving} />
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
								<Switch id="isCompleted" checked={isCompleted} onCheckedChange={setIsCompleted} disabled={isSaving} />
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
								<Switch id="isNsfw" checked={isNsfw} onCheckedChange={setIsNsfw} disabled={isSaving} />
							</div>
						</CardContent>
					</Card>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
