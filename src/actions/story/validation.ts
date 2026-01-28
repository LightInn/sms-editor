/**
 * Story Validation Schemas and Helpers
 * Centralized validation logic for story-related actions
 */

import {
	sanitizeCategories,
	sanitizeCharacters,
	sanitizeDescription,
	sanitizeSlug,
	sanitizeText,
} from 'sms-editor/lib/sanitization'
import * as v from 'valibot'
import type { Character } from '../../types/creator-stories'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const createStoryFormSchema = v.object({
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Title required'),
		v.maxLength(200, 'Title must be less than 200 characters')
	),
	description: v.optional(v.pipe(v.string(), v.maxLength(5000, 'Description too long'))),
	slug: v.pipe(
		v.string(),
		v.minLength(1, 'Slug required'),
		v.maxLength(200, 'Slug too long'),
		v.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
	),
	categories: v.optional(v.string()), // JSON string
	characters: v.optional(v.string()), // JSON string
})

// ============================================================================
// PARSING HELPERS
// ============================================================================

/**
 * Parse and sanitize categories from JSON string
 */
export function parseCategoriesFromFormData(categoriesJson?: string): string[] {
	if (!categoriesJson) return []

	try {
		const parsed = JSON.parse(categoriesJson)
		if (!Array.isArray(parsed)) return []
		return sanitizeCategories(parsed)
	} catch {
		return []
	}
}

/**
 * Parse and sanitize characters from JSON string
 */
export function parseCharactersFromFormData(charactersJson?: string): Character[] {
	if (!charactersJson) return []

	try {
		const parsed = JSON.parse(charactersJson)
		if (!Array.isArray(parsed)) return []
		return sanitizeCharacters(parsed)
	} catch {
		return []
	}
}

// ============================================================================
// FIELD VALIDATION HELPERS
// ============================================================================

/**
 * Validate and sanitize title
 */
export function validateTitle(title: string): { valid: true; sanitized: string } | { valid: false; error: string } {
	const sanitized = sanitizeText(title)
	if (!sanitized || sanitized.length < 1 || sanitized.length > 200) {
		return { valid: false, error: 'Title must be between 1 and 200 characters' }
	}
	return { valid: true, sanitized }
}

/**
 * Validate and sanitize description
 */
export function validateDescription(
	description: string
): { valid: true; sanitized: string } | { valid: false; error: string } {
	const sanitized = sanitizeDescription(description)
	if (sanitized.length > 5000) {
		return { valid: false, error: 'Description must be less than 5000 characters' }
	}
	return { valid: true, sanitized }
}

/**
 * Validate and sanitize slug
 */
export function validateSlug(slug: string): { valid: true; sanitized: string } | { valid: false; error: string } {
	const sanitized = sanitizeSlug(slug)
	if (!sanitized || sanitized.length < 1 || sanitized.length > 200) {
		return { valid: false, error: 'Slug must be between 1 and 200 characters' }
	}
	return { valid: true, sanitized }
}
