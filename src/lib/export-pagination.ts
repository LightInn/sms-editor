import type { Message } from '../types/creator-stories'

// Image dimensions
export const IMG_WIDTH = 430
export const IMG_HEIGHT = 932

// Layout constants
export const HEADER_HEIGHT = 72
export const CONTENT_PADDING = 32
export const MESSAGE_GAP = 8
export const TEXT_MESSAGE_HEIGHT = 60
export const MEDIA_MESSAGE_HEIGHT = 220
export const BASE_AVAILABLE_HEIGHT = IMG_HEIGHT - HEADER_HEIGHT - CONTENT_PADDING

// Text constants
export const CHARS_PER_PAGE = 1200

// Helper to estimate message height
export function estimateMessageHeight(msg: Message): number {
	if (msg.type === 'image' || msg.type === 'video') {
		return MEDIA_MESSAGE_HEIGHT
	}
	const textLength = msg.content?.length || 0
	// Approximate wrap calculation
	const lines = Math.ceil(textLength / 35) // ~35 chars per line
	return Math.max(TEXT_MESSAGE_HEIGHT, 30 + lines * 22)
}

// Core pagination logic for SMS
export function paginateMessages(messages: Message[]): Message[][] {
	const pages: Message[][] = []
	let currentPage: Message[] = []
	let currentHeight = 0

	// 1. Greedy grouping
	for (const msg of messages) {
		const msgHeight = estimateMessageHeight(msg) + MESSAGE_GAP
		const isMedia = msg.type === 'image' || msg.type === 'video'
		const safetyBuffer = isMedia ? 20 : 0

		if (currentHeight + msgHeight + safetyBuffer > BASE_AVAILABLE_HEIGHT && currentPage.length > 0) {
			pages.push(currentPage)
			currentPage = [msg]
			currentHeight = msgHeight
		} else {
			currentPage.push(msg)
			currentHeight += msgHeight
		}
	}

	if (currentPage.length > 0) {
		pages.push(currentPage)
	}

	// 2. Balance last two pages if needed
	if (pages.length >= 2) {
		const lastPageIndex = pages.length - 1
		const prevPageIndex = pages.length - 2

		const lastPage = pages[lastPageIndex]
		const prevPage = pages[prevPageIndex]

		// If last page is very small compared to available space (e.g. just 1 or 2 messages), try to balance
		// Actually, let's just always try to balance the last two pages for aesthetic consistency
		// unless the previous page is totally full of a single huge item (unlikely with these limits).

		const combinedMessages = [...prevPage, ...lastPage]

		// Calculate total height of combined messages
		let totalCombinedHeight = 0
		const messageHeights = combinedMessages.map(msg => {
			const h = estimateMessageHeight(msg) + MESSAGE_GAP
			totalCombinedHeight += h
			return h
		})

		const targetHeight = totalCombinedHeight / 2

		// Find split point that gets closest to targetHeight without exceeding limit
		let bestSplitIndex = prevPage.length // default to original split
		let currentAccumulatedHeight = 0
		let smallestDiff = Number.MAX_VALUE

		// We only scan reasonable split points
		// (we can't put everything in page 1 if it exceeds limit)
		// (we can't put everything in page 2 if page 1 becomes empty - logic handles this naturally)

		for (let i = 0; i < combinedMessages.length; i++) {
			const msgHeight = messageHeights[i]
			const isMedia = combinedMessages[i].type === 'image' || combinedMessages[i].type === 'video'
			const safetyBuffer = isMedia ? 20 : 0

			if (currentAccumulatedHeight + msgHeight + safetyBuffer <= BASE_AVAILABLE_HEIGHT) {
				currentAccumulatedHeight += msgHeight
				const diff = Math.abs(currentAccumulatedHeight - targetHeight)

				if (diff < smallestDiff) {
					smallestDiff = diff
					bestSplitIndex = i + 1 // split after this message
				}
			} else {
				// Can't fit more on first page
				break
			}
		}

		// Apply new split if it's different
		if (bestSplitIndex !== prevPage.length) {
			pages[prevPageIndex] = combinedMessages.slice(0, bestSplitIndex)
			pages[lastPageIndex] = combinedMessages.slice(bestSplitIndex)
		}
	}

	return pages
}

// Logic for Text pagination (Context blocks)
// Greedy approach: fill pages to capacity, respect word boundaries
export function paginateText(text: string): string[] {
	if (!text || text.length === 0) {
		return ['']
	}

	// If text fits on one page, return as-is
	if (text.length <= CHARS_PER_PAGE) {
		return [text]
	}

	const pages: string[] = []
	let remaining = text.trim()

	while (remaining.length > 0) {
		// If remaining text fits on this page, add it and we're done
		if (remaining.length <= CHARS_PER_PAGE) {
			pages.push(remaining)
			break
		}

		// Find a good break point (at word boundary)
		let breakPoint = CHARS_PER_PAGE

		// Look backwards for a space (word boundary)
		// Search within the last ~50 chars to find a natural break
		const searchStart = Math.max(0, CHARS_PER_PAGE - 50)
		let foundSpace = false

		for (let i = CHARS_PER_PAGE; i >= searchStart; i--) {
			if (remaining[i] === ' ' || remaining[i] === '\n') {
				breakPoint = i
				foundSpace = true
				break
			}
		}

		// If no space found, look forward instead (avoid cutting mid-word)
		if (!foundSpace) {
			for (let i = CHARS_PER_PAGE; i < Math.min(remaining.length, CHARS_PER_PAGE + 30); i++) {
				if (remaining[i] === ' ' || remaining[i] === '\n') {
					breakPoint = i
					break
				}
			}
		}

		// Add the page content (trim whitespace)
		const pageContent = remaining.slice(0, breakPoint).trim()
		if (pageContent.length > 0) {
			pages.push(pageContent)
		}

		// Move to next chunk
		remaining = remaining.slice(breakPoint).trim()
	}

	return pages.length > 0 ? pages : ['']
}
