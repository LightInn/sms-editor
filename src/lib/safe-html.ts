/**
 * Safe HTML Rendering Utilities
 * Uses DOMPurify to sanitize HTML before rendering with dangerouslySetInnerHTML
 */

import DOMPurify from 'isomorphic-dompurify'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * DOMPurify configuration for rich text content
 * Allows safe HTML tags commonly used in rich text editors
 */
const RICH_TEXT_CONFIG = {
	ALLOWED_TAGS: [
		'p',
		'br',
		'strong',
		'b',
		'em',
		'i',
		'u',
		's',
		'strike',
		'a',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'ul',
		'ol',
		'li',
		'blockquote',
		'code',
		'pre',
		'span',
		'div',
		'img',
	],
	ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
	ALLOW_DATA_ATTR: false,
	ADD_ATTR: ['target'],
	// Force links to open in new tab safely
	FORCE_BODY: true,
	// Ensure we get string back, not TrustedHTML
	RETURN_TRUSTED_TYPE: false as const,
}

/**
 * Strict configuration for simple text with minimal formatting
 */
const STRICT_CONFIG = {
	ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i'],
	ALLOWED_ATTR: [] as string[],
	ALLOW_DATA_ATTR: false,
	RETURN_TRUSTED_TYPE: false as const,
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize rich text HTML content
 * Use this for content from rich text editors (Tiptap, etc.)
 */
export function sanitizeRichTextHtml(html: string): string {
	if (!html || typeof html !== 'string') return ''
	return DOMPurify.sanitize(html, RICH_TEXT_CONFIG)
}

/**
 * Sanitize HTML with strict rules (minimal tags)
 * Use this for user descriptions or simple text fields
 */
export function sanitizeStrictHtml(html: string): string {
	if (!html || typeof html !== 'string') return ''
	return DOMPurify.sanitize(html, STRICT_CONFIG)
}

/**
 * Strip all HTML tags completely
 * Use this when you need plain text only
 */
export function stripHtml(html: string): string {
	if (!html || typeof html !== 'string') return ''
	return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], RETURN_TRUSTED_TYPE: false as const })
}

/**
 * Create props for dangerouslySetInnerHTML with sanitized content
 * This is a helper to make usage cleaner in components
 *
 * @example
 * <div {...safeHtml(richTextContent)} />
 */
export function safeHtml(html: string, strict = false) {
	const sanitized = strict ? sanitizeStrictHtml(html) : sanitizeRichTextHtml(html)
	return { dangerouslySetInnerHTML: { __html: sanitized } }
}
