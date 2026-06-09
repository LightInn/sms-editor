/**
 * HTML to Satori Parser
 * Converts Tiptap HTML to Satori-compatible JSX with inline styles
 *
 * Satori (used by ImageResponse) requires inline styles, not CSS classes.
 * This parser handles common Tiptap HTML elements and converts them to
 * React elements with the appropriate inline styles.
 */

import type { ReactNode } from 'react'

// Theme colors matching the dark theme in renderers.tsx
const THEME = {
	text: '#f8e8e8',
	textMuted: '#d99393',
	primary: '#f4d06f',
	bg: '#12242e',
	card: '#1c2e38',
	border: '#3d5a6e',
	code: '#24272b',
}

// Style definitions for each HTML element
const ELEMENT_STYLES: Record<string, React.CSSProperties> = {
	// Text formatting - use explicit values for better Satori support
	strong: { fontWeight: 'bold' as const },
	b: { fontWeight: 'bold' as const },
	em: { fontStyle: 'italic' as const },
	i: { fontStyle: 'italic' as const },
	u: { textDecoration: 'underline' as const },
	s: { textDecoration: 'line-through' as const },
	strike: { textDecoration: 'line-through' as const },

	// Code - inline
	code: {
		fontFamily: 'monospace',
		backgroundColor: THEME.code,
		padding: '2px 6px',
		borderRadius: '4px',
		fontSize: '14px',
	},

	// Paragraphs - block with full width
	p: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		marginBottom: '12px',
	},

	// Headings - block with full width
	h1: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '28px',
		fontWeight: 700,
		marginBottom: '16px',
	},
	h2: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '24px',
		fontWeight: 700,
		marginBottom: '14px',
	},
	h3: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '20px',
		fontWeight: 600,
		marginBottom: '12px',
	},
	h4: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '18px',
		fontWeight: 600,
		marginBottom: '10px',
	},
	h5: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '16px',
		fontWeight: 600,
		marginBottom: '8px',
	},
	h6: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		fontSize: '14px',
		fontWeight: 600,
		marginBottom: '8px',
	},

	// Blockquote - block
	blockquote: {
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		borderLeftWidth: '4px',
		borderLeftStyle: 'solid' as const,
		borderLeftColor: THEME.primary,
		paddingLeft: '16px',
		marginLeft: '0',
		marginTop: '8px',
		marginBottom: '8px',
		fontStyle: 'italic',
		color: THEME.textMuted,
	},

	// Lists - block
	ul: {
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		paddingLeft: '20px',
		marginBottom: '12px',
	},
	ol: {
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		paddingLeft: '20px',
		marginBottom: '12px',
	},
	li: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		width: '100%',
		marginBottom: '4px',
	},

	// Links - inline
	a: {
		color: THEME.primary,
		textDecoration: 'underline',
	},

	// Line break
	br: {},
}

/**
 * Simple HTML parser that converts HTML string to Satori-compatible JSX
 * This is a lightweight parser for Tiptap output, not a full HTML parser
 */
export function parseHtmlToSatori(html: string): ReactNode {
	// Clean up the HTML
	const cleanHtml = html.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

	console.log('[Export] Parsing HTML:', cleanHtml.substring(0, 1500) + (cleanHtml.length > 200 ? '...' : ''))

	if (!cleanHtml) {
		return null
	}

	// Parse and convert
	return parseNode(cleanHtml, 0)
}

/**
 * Parse a node (text or element) from HTML string
 */
function parseNode(html: string, keyIndex: number): ReactNode {
	const nodes: ReactNode[] = []
	let remaining = html
	let currentKey = keyIndex

	while (remaining.length > 0) {
		// Check for opening tag
		const tagMatch = remaining.match(/^<(\w+)([^>]*)>/)

		if (tagMatch) {
			const [fullMatch, tagName, _attributes] = tagMatch
			const lowerTagName = tagName.toLowerCase()
			remaining = remaining.slice(fullMatch.length)

			// Handle self-closing tags
			if (lowerTagName === 'br') {
				nodes.push(<span key={`br-${currentKey++}`} style={{ display: 'flex', width: '100%', height: '8px' }} />)
				continue
			}

			// Find closing tag
			const closingTag = `</${tagName}>`
			const closingIndex = findClosingTagIndex(remaining, tagName)

			if (closingIndex === -1) {
				// No closing tag found, treat rest as text
				if (remaining.trim()) {
					nodes.push(
						<span key={`text-${currentKey++}`} style={{ display: 'flex' }}>
							{remaining}
						</span>
					)
				}
				break
			}

			const innerHtml = remaining.slice(0, closingIndex)
			remaining = remaining.slice(closingIndex + closingTag.length)

			// Get styles for this element
			const baseStyle = ELEMENT_STYLES[lowerTagName] || {}

			// Inline formatting elements should not add display:flex wrapper
			const inlineElements = ['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'a']
			const isInline = inlineElements.includes(lowerTagName)

			const style: React.CSSProperties = isInline
				? { display: 'flex', ...baseStyle }
				: { display: 'flex', flexWrap: 'wrap' as const, ...baseStyle }

			// Parse children recursively
			const children = parseNode(innerHtml, currentKey * 100)

			// Special handling for list items - add bullet point
			if (lowerTagName === 'li') {
				nodes.push(
					<span key={`li-${currentKey++}`} style={style}>
						<span style={{ display: 'flex', marginRight: '8px', color: '#f4d06f' }}>•</span>
						<span style={{ display: 'flex', flexWrap: 'wrap' as const, flex: 1 }}>{children}</span>
					</span>
				)
			} else {
				// Create element with inline styles
				nodes.push(
					<span key={`${lowerTagName}-${currentKey++}`} style={style}>
						{children}
					</span>
				)
			}
		} else {
			// Text node - find next tag or end
			const nextTagIndex = remaining.indexOf('<')

			if (nextTagIndex === -1) {
				// Rest is text
				if (remaining.trim()) {
					nodes.push(
						<span key={`text-${currentKey++}`} style={{ display: 'flex' }}>
							{remaining}
						</span>
					)
				}
				break
			} else if (nextTagIndex > 0) {
				// Text before next tag
				const text = remaining.slice(0, nextTagIndex)
				if (text.trim()) {
					nodes.push(
						<span key={`text-${currentKey++}`} style={{ display: 'flex' }}>
							{text}
						</span>
					)
				}
				remaining = remaining.slice(nextTagIndex)
			} else {
				// Edge case: starts with < but not a valid tag
				remaining = remaining.slice(1)
			}
		}
	}

	if (nodes.length === 0) {
		return null
	}

	if (nodes.length === 1) {
		return nodes[0]
	}

	// Wrap multiple nodes in a flex container
	return (
		<span key={`wrapper-${keyIndex}`} style={{ display: 'flex', flexWrap: 'wrap' as const }}>
			{nodes}
		</span>
	)
}

/**
 * Find the index of the closing tag, accounting for nested tags of same type
 */
function findClosingTagIndex(html: string, tagName: string): number {
	const openTag = `<${tagName}`
	const closeTag = `</${tagName}>`
	let depth = 1
	let index = 0

	while (depth > 0 && index < html.length) {
		const nextOpen = html.indexOf(openTag, index)
		const nextClose = html.indexOf(closeTag, index)

		if (nextClose === -1) {
			return -1 // No closing tag found
		}

		if (nextOpen !== -1 && nextOpen < nextClose) {
			// Found another opening tag first
			depth++
			index = nextOpen + openTag.length
		} else {
			// Found closing tag
			depth--
			if (depth === 0) {
				return nextClose
			}
			index = nextClose + closeTag.length
		}
	}

	return -1
}

/**
 * Estimate content weight for pagination
 * Elements that take more vertical space add extra "weight"
 * Returns an estimated character count adjusted for layout
 */
export function estimateContentWeight(html: string): number {
	// Start with plain text character count
	const plainText = html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

	let weight = plainText.length

	// Add weight for elements that take extra vertical space
	// Blockquotes: add ~80 chars equivalent per blockquote (padding, border, margins)
	const blockquoteCount = (html.match(/<blockquote/gi) || []).length
	weight += blockquoteCount * 80

	// Headings: add weight based on size
	weight += (html.match(/<h1/gi) || []).length * 100
	weight += (html.match(/<h2/gi) || []).length * 80
	weight += (html.match(/<h3/gi) || []).length * 60
	weight += (html.match(/<h[4-6]/gi) || []).length * 40

	// Line breaks: add ~30 chars equivalent per break
	const brCount = (html.match(/<br/gi) || []).length
	weight += brCount * 30

	// Paragraphs: add ~20 chars for margin
	const pCount = (html.match(/<p/gi) || []).length
	weight += pCount * 20

	// Lists: add weight for list markers and spacing
	const liCount = (html.match(/<li/gi) || []).length
	weight += liCount * 25

	// Code blocks: add ~40 chars for padding
	const codeCount = (html.match(/<code/gi) || []).length
	weight += codeCount * 40

	return weight
}

/**
 * Split HTML into pages at block-level element boundaries
 * Returns the HTML content for the specified page index
 */
export function paginateHtml(
	html: string,
	pageIndex: number,
	maxWeightPerPage = 1300
): {
	pageHtml: string
	totalPages: number
} {
	// Extract block-level elements (paragraphs, blockquotes, headings, lists, etc.)
	const blocks = extractBlocks(html)

	if (blocks.length === 0) {
		return { pageHtml: html, totalPages: 1 }
	}

	// Group blocks into pages based on weight
	const pages: string[][] = []
	let currentPage: string[] = []
	let currentWeight = 0

	for (const block of blocks) {
		const blockWeight = estimateBlockWeight(block)

		// If adding this block would exceed the page weight and we have content,
		// start a new page (unless it's the first block on an empty page)
		if (currentWeight + blockWeight > maxWeightPerPage && currentPage.length > 0) {
			pages.push(currentPage)
			currentPage = []
			currentWeight = 0
		}

		currentPage.push(block)
		currentWeight += blockWeight
	}

	// Don't forget the last page
	if (currentPage.length > 0) {
		pages.push(currentPage)
	}

	// Ensure we have at least one page
	if (pages.length === 0) {
		return { pageHtml: html, totalPages: 1 }
	}

	// Get the requested page
	const safePageIndex = Math.min(pageIndex, pages.length - 1)
	const pageHtml = pages[safePageIndex].join('')

	return { pageHtml, totalPages: pages.length }
}

/**
 * Extract block-level elements from HTML
 * Splits at paragraph boundaries to create natural page breaks
 */
function extractBlocks(html: string): string[] {
	if (!html?.trim()) {
		return []
	}

	// First, try splitting by paragraphs (most common in Tiptap)
	const paragraphSplit = html.split('</p>')

	if (paragraphSplit.length > 1) {
		const blocks: string[] = []
		for (let i = 0; i < paragraphSplit.length; i++) {
			let block = paragraphSplit[i].trim()
			if (!block) continue

			// Add closing tag back (except for last empty part)
			if (i < paragraphSplit.length - 1) {
				block += '</p>'
			}

			if (block.trim()) {
				blocks.push(block)
			}
		}
		return blocks.length > 0 ? blocks : [html]
	}

	// If no paragraphs, try other block elements
	const blockTags = ['blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'div']
	for (const tag of blockTags) {
		const closeTag = `</${tag}>`
		if (html.includes(closeTag)) {
			const parts = html.split(closeTag)
			const blocks: string[] = []
			for (let i = 0; i < parts.length; i++) {
				let part = parts[i].trim()
				if (!part) continue
				if (i < parts.length - 1) {
					part += closeTag
				}
				if (part.trim()) {
					blocks.push(part)
				}
			}
			if (blocks.length > 0) return blocks
		}
	}

	// Fallback: return entire HTML as single block
	return [html.trim()]
}

/**
 * Estimate weight of a single block
 */
function estimateBlockWeight(block: string): number {
	const plainText = block
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim()

	let weight = plainText.length

	// Add extra weight for special elements
	if (/<blockquote/i.test(block)) weight += 80
	if (/<h1/i.test(block)) weight += 100
	if (/<h2/i.test(block)) weight += 80
	if (/<h3/i.test(block)) weight += 60
	if (/<h[4-6]/i.test(block)) weight += 40
	if (/<br/gi.test(block)) weight += (block.match(/<br/gi) || []).length * 30
	if (/<li/gi.test(block)) weight += (block.match(/<li/gi) || []).length * 25
	if (/<code/i.test(block)) weight += 40

	// Minimum weight per block for spacing
	return Math.max(weight, 50)
}
