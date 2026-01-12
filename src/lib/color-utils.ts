/**
 * Color utilities for the Export system
 * Handles conversion between Tailwind classes and hex colors
 */

// ============================================================================
// TAILWIND TO HEX COLOR MAPPING
// ============================================================================

/**
 * Mapping of common Tailwind classes to hex colors
 */
export const TAILWIND_COLOR_MAP: Record<string, string> = {
	// Backgrounds
	'bg-white': '#ffffff',
	'bg-gray-50': '#f9fafb',
	'bg-gray-100': '#f3f4f6',
	'bg-gray-200': '#e5e7eb',
	'bg-blue-500': '#3b82f6',
	'bg-blue-600': '#2563eb',
	'bg-green-500': '#22c55e',
	'bg-purple-500': '#a855f7',
	'bg-purple-600': '#9333ea',
	'bg-pink-500': '#ec4899',
	'bg-pink-600': '#db2777',
	'bg-yellow-50': '#fefce8',
	'bg-yellow-400': '#facc15',
	'bg-card': '#ffffff',
	'bg-muted': '#f3f4f6',
	// Text colors
	'text-black': '#000000',
	'text-white': '#ffffff',
	'text-foreground': '#0a0a0a',
	'text-muted-foreground': '#6b7280',
	// App-specific colors
	'bg-[#ECE5DD]': '#ECE5DD', // WhatsApp bg
	'bg-[#075E54]': '#075E54', // WhatsApp header
}

/**
 * Get hex color from a Tailwind class or class string
 * Handles single classes, space-separated classes, gradients, and arbitrary values
 */
export function getColorFromClass(className: string): string {
	if (!className) return '#ffffff'

	// Check for direct match
	if (TAILWIND_COLOR_MAP[className]) return TAILWIND_COLOR_MAP[className]

	// Handle space-separated classes (take the first bg- color found)
	const classes = className.split(' ')
	for (const cls of classes) {
		if (TAILWIND_COLOR_MAP[cls]) return TAILWIND_COLOR_MAP[cls]
		if (cls.startsWith('bg-[#')) {
			const match = cls.match(/bg-\[(#[0-9A-Fa-f]{6})\]/)
			if (match) return match[1]
		}
	}

	// Handle gradients (Instagram) - Simple fallback to purple for now as Satori gradients are complex
	if (className.includes('bg-gradient-to-r')) {
		if (className.includes('from-purple-600')) return '#9333ea' // Purple-600
		if (className.includes('from-purple-500')) return '#a855f7' // Purple-500
	}

	// Check for hex values in class
	const hexMatch = className.match(/#[0-9A-Fa-f]{6}/)
	if (hexMatch) return hexMatch[0]

	// Check for bg-[color] pattern
	const bracketMatch = className.match(/bg-\[([^\\]]+)\]/)
	if (bracketMatch) return bracketMatch[1]

	return '#ffffff'
}

/**
 * Check if a class string contains a white text color
 */
export function hasWhiteText(className: string): boolean {
	return className.includes('text-white')
}

/**
 * Get text color based on class string
 */
export function getTextColor(className: string): string {
	if (className.includes('text-white')) return '#ffffff'
	if (className.includes('text-black')) return '#000000'
	if (TAILWIND_COLOR_MAP[className]) return TAILWIND_COLOR_MAP[className]
	return '#000000'
}
