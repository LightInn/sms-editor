/**
 * Category Input Component
 * Allows adding and removing categories/tags
 */

'use client'

import { X } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sanitizeCategory } from '@/lib/sanitization'

export interface CategoryInputProps {
	categories: string[]
	onChange: (categories: string[]) => void
	suggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
	'romance',
	'drama',
	'comedy',
	'suspense',
	'modern',
	'long-distance',
	'heartbreak',
	'friendship',
]

export function CategoryInput({ categories, onChange, suggestions = DEFAULT_SUGGESTIONS }: CategoryInputProps) {
	const [inputValue, setInputValue] = useState('')

	const handleAdd = (category: string) => {
		const sanitized = sanitizeCategory(category)

		// Validate length
		if (!sanitized || sanitized.length < 2 || sanitized.length > 50) {
			return
		}

		// Check for duplicates
		if (categories.includes(sanitized)) {
			return
		}

		// Limit number of categories
		if (categories.length >= 20) {
			return
		}

		onChange([...categories, sanitized])
		setInputValue('')
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAdd(inputValue)
		}
	}

	const handleRemove = (category: string) => {
		onChange(categories.filter(c => c !== category))
	}

	const availableSuggestions = suggestions.filter(s => !categories.includes(s))

	return (
		<div className="space-y-3">
			{/* Input */}
			<div className="flex gap-2">
				<Input
					placeholder="Add a category..."
					value={inputValue}
					onChange={e => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<Button type="button" onClick={() => handleAdd(inputValue)} disabled={!inputValue.trim()}>
					Add
				</Button>
			</div>

			{/* Selected Categories */}
			{categories.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{categories.map(category => (
						<Badge key={category} variant="default" className="gap-1">
							{category}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-4 w-4 p-0 hover:bg-transparent"
								onClick={() => handleRemove(category)}
							>
								<X className="h-3 w-3" />
							</Button>
						</Badge>
					))}
				</div>
			)}

			{/* Suggestions */}
			{availableSuggestions.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">Suggestions:</p>
					<div className="flex flex-wrap gap-2">
						{availableSuggestions.map(suggestion => (
							<Badge
								key={suggestion}
								variant="outline"
								className="cursor-pointer hover:bg-muted"
								onClick={() => handleAdd(suggestion)}
							>
								{suggestion}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
