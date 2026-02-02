/**
 * Create Story Form Component
 * Form for creating a new story with all its metadata
 * Uses Server Actions with Better Auth for secure story creation
 */

'use client'

import { createStoryAction } from '@sms-editor/actions/story/crud.actions'
import type { Character } from '@sms-editor/types/creator-stories'
import { generateSlug } from '@sms-editor/types/creator-stories'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategoryInput } from './category-input'
import { CharacterEditor } from './character-editor'

export function CreateStoryForm() {
	// Form state management
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [slug, setSlug] = useState('')
	const [categories, setCategories] = useState<string[]>([])
	const [characters, setCharacters] = useState<Character[]>([])

	// Server Action state
	const [state, formAction, isPending] = useActionState(createStoryAction, { error: undefined })

	// Auto-generate slug from title
	const handleTitleChange = (value: string) => {
		setTitle(value)
		setSlug(generateSlug(value))
	}

	// Show toast on error
	if (state?.error) {
		toast.error(state.error)
	}

	return (
		<form action={formAction} className="space-y-6">
			{/* Hidden fields for categories and characters */}
			<input type="hidden" name="categories" value={JSON.stringify(categories)} />
			<input type="hidden" name="characters" value={JSON.stringify(characters)} />

			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Basic Information</CardTitle>
					<CardDescription>Give your story a title and description</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title" className="text-sm text-muted-foreground">
							Title *
						</Label>
						<Input
							id="title"
							name="title"
							className="bg-transparent border px-3 py-2 text-sm"
							placeholder="A Modern Love Story"
							value={title}
							onChange={e => handleTitleChange(e.target.value)}
							maxLength={200}
							required
							disabled={isPending}
						/>
						{state?.errors?.title && <p className="text-destructive text-sm">{state.errors.title[0]}</p>}
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description" className="text-sm text-muted-foreground">
							Description (Optional)
						</Label>
						<Textarea
							id="description"
							name="description"
							className="min-h-[100px] resize-y text-sm bg-transparent border px-3 py-2"
							placeholder="A heartfelt story of love told through SMS messages..."
							value={description}
							onChange={e => setDescription(e.target.value)}
							rows={4}
							maxLength={5000}
							disabled={isPending}
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
							name="slug"
							className="bg-transparent border px-3 py-2 text-sm"
							placeholder="a-modern-love-story"
							value={slug}
							onChange={e => setSlug(e.target.value.toLowerCase())}
							maxLength={200}
							required
							disabled={isPending}
						/>
						{state?.errors?.slug && <p className="text-destructive text-sm">{state.errors.slug[0]}</p>}
						<p className="text-muted-foreground text-xs">This will be used in the URL: /editor/{slug || 'your-slug'}</p>
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

			{/* Global Error */}
			{state?.error && !state.errors && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-destructive text-sm">{state.error}</p>
					</CardContent>
				</Card>
			)}

			{/* Submit */}
			<div className="flex gap-3">
				<Button type="button" variant="outline" className="flex-1" disabled={isPending}>
					Cancel
				</Button>
				<Button type="submit" className="flex-1" disabled={isPending}>
					{isPending ? 'Creating...' : 'Create Story'}
				</Button>
			</div>
		</form>
	)
}
