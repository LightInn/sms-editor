/**
 * Security and Sanitization Utilities
 * Protects against XSS, injection attacks, and malicious input
 */

// ============================================================================
// STRING SANITIZATION
// ============================================================================

/**
 * Remove all HTML tags and dangerous characters from a string
 * Protects against XSS attacks
 */
export function sanitizeText(input: string): string {
	if (!input || typeof input !== 'string') return ''

	// Build regex for control characters (excluding \n and \t)
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for sanitization
	const controlCharRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

	return (
		input
			// Remove HTML tags
			.replace(/<[^>]*>/g, '')
			// Remove script tags specifically
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			// Remove null bytes
			.replace(/\0/g, '')
			// Remove control characters except newlines and tabs
			.replace(controlCharRegex, '')
			// Normalize whitespace
			.replace(/\s+/g, ' ')
			.trim()
	)
}

/**
 * Sanitize and limit text length
 */
export function sanitizeAndTruncate(input: string, maxLength: number): string {
	const sanitized = sanitizeText(input)
	return sanitized.slice(0, maxLength)
}

/**
 * Sanitize a name field (first name, last name, etc.)
 * Only allows letters, spaces, hyphens, and apostrophes
 */
export function sanitizeName(input: string): string {
	if (!input || typeof input !== 'string') return ''

	return (
		input
			.trim()
			// Remove anything that's not a letter, space, hyphen, or apostrophe
			.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '')
			// Remove multiple spaces
			.replace(/\s+/g, ' ')
			// Remove multiple hyphens
			.replace(/-+/g, '-')
			// Limit length
			.slice(0, 100)
			.trim()
	)
}

/**
 * Sanitize a category/tag
 * Only allows lowercase letters, numbers, spaces, and hyphens
 */
export function sanitizeCategory(input: string): string {
	if (!input || typeof input !== 'string') return ''

	return (
		input
			.toLowerCase()
			.trim()
			// Remove anything that's not alphanumeric, space, or hyphen
			.replace(/[^a-z0-9\s-]/g, '')
			// Replace spaces with hyphens
			.replace(/\s+/g, '-')
			// Remove multiple hyphens
			.replace(/-+/g, '-')
			// Remove leading/trailing hyphens
			.replace(/^-+|-+$/g, '')
			// Limit length
			.slice(0, 50)
	)
}

/**
 * Sanitize a slug (URL-safe identifier)
 */
export function sanitizeSlug(input: string): string {
	if (!input || typeof input !== 'string') return ''

	return (
		input
			.toLowerCase()
			.normalize('NFD')
			// Remove diacritics
			.replace(/[\u0300-\u036f]/g, '')
			// Remove anything that's not alphanumeric or hyphen
			.replace(/[^a-z0-9-]/g, '')
			// Remove multiple hyphens
			.replace(/-+/g, '-')
			// Remove leading/trailing hyphens
			.replace(/^-+|-+$/g, '')
			// Limit length
			.slice(0, 200)
	)
}

/**
 * Sanitize description/long text
 * Allows more characters but still protects against XSS
 */
export function sanitizeDescription(input: string): string {
	if (!input || typeof input !== 'string') return ''

	return (
		sanitizeText(input)
			// Limit length
			.slice(0, 5000)
	)
}

// ============================================================================
// URL VALIDATION AND SANITIZATION
// ============================================================================

/**
 * Validate and sanitize a URL
 * Protects against javascript:, data:, and other dangerous protocols
 */
export function sanitizeUrl(input: string): string | null {
	if (!input || typeof input !== 'string') return null

	const trimmed = input.trim()

	// Block dangerous protocols
	const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'blob:']

	const lowerUrl = trimmed.toLowerCase()
	for (const protocol of dangerousProtocols) {
		if (lowerUrl.startsWith(protocol)) {
			return null
		}
	}

	// Only allow http, https, and relative URLs
	if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
		return null
	}

	// Basic URL validation
	try {
		if (trimmed.startsWith('/')) {
			// Relative URL - just check for basic sanity
			if (trimmed.includes('..')) return null // Prevent path traversal
			return trimmed.slice(0, 2048)
		}

		// Absolute URL - validate with URL constructor
		const url = new URL(trimmed)

		// Only allow http and https
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return null
		}

		// Limit length
		return trimmed.slice(0, 2048)
	} catch {
		return null
	}
}

/**
 * Validate image URL
 * More strict than general URL validation
 */
export function sanitizeImageUrl(input: string): string | null {
	const sanitized = sanitizeUrl(input)
	if (!sanitized) return null

	// Check for common image extensions or API endpoints
	const validPatterns = [
		/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
		/\/api\/files\//i, // PocketBase files
		/pravatar\.cc/i, // Pravatar
		/unsplash\.com/i, // Unsplash
		/picsum\.photos/i, // Lorem Picsum
		/cloudinary\.com/i, // Cloudinary
		/imgur\.com/i, // Imgur
	]

	const hasValidPattern = validPatterns.some(pattern => pattern.test(sanitized))

	if (!hasValidPattern) {
		console.warn('Image URL does not match expected patterns:', sanitized)
	}

	return sanitized
}

// ============================================================================
// ARRAY SANITIZATION
// ============================================================================

/**
 * Sanitize an array of categories
 * Limits number of items and sanitizes each one
 */
export function sanitizeCategories(input: string[], maxItems = 20): string[] {
	if (!Array.isArray(input)) return []

	return input
		.map(cat => sanitizeCategory(cat))
		.filter(cat => cat.length > 0 && cat.length <= 50)
		.filter((cat, index, self) => self.indexOf(cat) === index) // Remove duplicates
		.slice(0, maxItems)
}

// ============================================================================
// OBJECT SANITIZATION
// ============================================================================

/**
 * Sanitize character data
 */
export interface SanitizedCharacter {
	id: string
	firstName: string
	lastName: string
	avatar: string | null
}

export function sanitizeCharacter(input: unknown): SanitizedCharacter | null {
	if (!input || typeof input !== 'object' || input === null) return null

	const obj = input as Record<string, unknown>

	const firstName = sanitizeName(typeof obj.firstName === 'string' ? obj.firstName : '')
	const lastName =
		typeof obj.lastName === 'string' && obj.lastName && obj.lastName !== '$undefined' ? sanitizeName(obj.lastName) : ''

	if (!firstName) return null

	return {
		id: typeof obj.id === 'string' ? obj.id : '',
		firstName,
		lastName,
		avatar: typeof obj.avatar === 'string' && obj.avatar ? sanitizeImageUrl(obj.avatar) : null,
	}
}

/**
 * Sanitize array of characters
 */
export function sanitizeCharacters(input: unknown[], maxItems = 50): SanitizedCharacter[] {
	if (!Array.isArray(input)) return []

	return input
		.map(char => sanitizeCharacter(char))
		.filter((char): char is SanitizedCharacter => char !== null)
		.slice(0, maxItems)
}

// ============================================================================
// HTML CONTENT SANITIZATION (for rich text)
// ============================================================================

/**
 * Sanitize HTML content from Tiptap editor
 * Allows safe HTML tags only
 */
export function sanitizeHtmlContent(input: string): string {
	if (!input || typeof input !== 'string') return ''

	// Allow only safe HTML tags from Tiptap
	const allowedTags = [
		'p',
		'br',
		'strong',
		'em',
		'u',
		's',
		'a',
		'h1',
		'h2',
		'h3',
		'ul',
		'ol',
		'li',
		'blockquote',
		'code',
		'pre',
	]

	const allowedTagsRegex = new RegExp(`<(?!/?(?:${allowedTags.join('|')})\\b)[^>]*>`, 'gi')

	return (
		input
			// Remove script tags
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			// Remove event handlers
			.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
			// Remove dangerous attributes
			.replace(/(<[^>]+)(onerror|onload|onclick|onmouseover|onfocus|onblur)\s*=\s*["'][^"']*["']/gi, '$1')
			// Remove style attributes (to prevent CSS injection)
			.replace(/(<[^>]+)style\s*=\s*["'][^"']*["']/gi, '$1')
			// Remove javascript: URLs
			.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
			// Remove data: URLs
			.replace(/href\s*=\s*["']data:[^"']*["']/gi, '')
			// Remove disallowed tags
			.replace(allowedTagsRegex, '')
			// Limit total length
			.slice(0, 100000)
	)
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if string contains only safe characters
 */
export function isSafeString(input: string): boolean {
	if (!input || typeof input !== 'string') return false

	// Check for null bytes
	if (input.includes('\0')) return false

	// Check for HTML tags
	if (/<[^>]*>/g.test(input)) return false

	// Check for script attempts
	if (/(<script|javascript:|on\w+\s*=)/gi.test(input)) return false

	return true
}

/**
 * Check if URL is safe
 */
export function isSafeUrl(input: string): boolean {
	const sanitized = sanitizeUrl(input)
	return sanitized !== null && sanitized === input
}

// ============================================================================
// ESCAPE HELPERS (for displaying user content)
// ============================================================================

/**
 * Escape HTML entities
 * Use this when displaying user content in HTML
 */
export function escapeHtml(input: string): string {
	if (!input || typeof input !== 'string') return ''

	const htmlEntities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'/': '&#x2F;',
	}

	return input.replace(/[&<>"'/]/g, char => htmlEntities[char] || char)
}

/**
 * Escape for JSON
 */
export function escapeJson(input: string): string {
	if (!input || typeof input !== 'string') return ''

	return input
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t')
}
