/**
 * Image utilities for the Export system
 * Centralized functions for image processing and conversion
 */

import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ffmpeg from 'fluent-ffmpeg'
import sharp from 'sharp'

// ============================================================================
// IMAGE FETCHING & CONVERSION
// ============================================================================

/**
 * Fetch an image from URL and convert to base64 data URL
 * Automatically converts WebP to PNG for Satori compatibility
 */
export async function fetchImageAsBase64(url: string, logPrefix = '[ImageUtils]'): Promise<string | null> {
	try {
		console.log(`${logPrefix} Fetching image:`, url)
		const response = await fetch(url)
		if (!response.ok) {
			console.log(`${logPrefix} Failed to fetch image, status:`, response.status)
			return null
		}

		const buffer = await response.arrayBuffer()
		const mimeType = response.headers.get('content-type') || 'image/png'
		const isWebP = mimeType.includes('webp') || url.toLowerCase().includes('.webp')

		if (isWebP) {
			// Convert WebP to PNG using sharp
			console.log(`${logPrefix} Converting WebP to PNG...`)
			try {
				const pngBuffer = await sharp(Buffer.from(buffer)).png().toBuffer()
				const base64 = pngBuffer.toString('base64')
				console.log(`${logPrefix} WebP converted to PNG successfully`)
				return `data:image/png;base64,${base64}`
			} catch (sharpError) {
				console.log(`${logPrefix} Sharp conversion failed:`, sharpError)
				return null
			}
		}

		// For non-WebP images, just encode as base64
		const base64 = Buffer.from(buffer).toString('base64')
		return `data:${mimeType};base64,${base64}`
	} catch (error) {
		console.log(`${logPrefix} Failed to fetch image as base64:`, error)
		return null
	}
}

// ============================================================================
// VIDEO THUMBNAIL EXTRACTION
// ============================================================================

/**
 * Extract a thumbnail from a video URL and convert to base64
 * Uses ffmpeg to extract the first frame
 */
export async function fetchVideoThumbnailAsBase64(url: string, logPrefix = '[ImageUtils]'): Promise<string | null> {
	const tempId = Date.now().toString()
	const tempVideoPath = join(tmpdir(), `video_${tempId}.mp4`)
	const tempFramePath = join(tmpdir(), `frame_${tempId}.png`)

	try {
		console.log(`${logPrefix} Fetching video for thumbnail:`, url)

		// Download video to temp file
		const response = await fetch(url)
		if (!response.ok) {
			console.log(`${logPrefix} Failed to fetch video, status:`, response.status)
			return null
		}

		const videoBuffer = await response.arrayBuffer()
		await fs.writeFile(tempVideoPath, Buffer.from(videoBuffer))
		console.log(`${logPrefix} Video downloaded to temp:`, tempVideoPath)

		// Extract first frame using ffmpeg
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tempVideoPath)
				.screenshots({
					count: 1,
					folder: tmpdir(),
					filename: `frame_${tempId}.png`,
					timemarks: ['0'],
				})
				.on('end', () => {
					console.log(`${logPrefix} Frame extracted successfully`)
					resolve()
				})
				.on('error', (err: Error) => {
					console.log(`${logPrefix} FFmpeg error:`, err.message)
					reject(err)
				})
		})

		// Read the frame and convert to base64
		const frameBuffer = await fs.readFile(tempFramePath)
		const base64 = frameBuffer.toString('base64')
		console.log(`${logPrefix} Video thumbnail converted to base64`)

		// Cleanup temp files
		await fs.unlink(tempVideoPath).catch(() => {})
		await fs.unlink(tempFramePath).catch(() => {})

		return `data:image/png;base64,${base64}`
	} catch (error) {
		console.log(`${logPrefix} Failed to extract video thumbnail:`, error)
		// Cleanup on error
		await fs.unlink(tempVideoPath).catch(() => {})
		await fs.unlink(tempFramePath).catch(() => {})
		return null
	}
}

// ============================================================================
// AVATAR GENERATION
// ============================================================================

// Colors for initials avatars
const INITIALS_AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']

/**
 * Generate an SVG avatar with initials as a data URL
 */
export function generateInitialsAvatar(firstName: string, lastName: string): string {
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
	const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % INITIALS_AVATAR_COLORS.length
	const bgColor = INITIALS_AVATAR_COLORS[colorIndex]

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
		<circle cx="20" cy="20" r="20" fill="${bgColor}"/>
		<text x="20" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
	</svg>`

	return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Get character avatar as base64, or null if not available
 */
export async function getCharacterAvatarBase64(
	character: { avatar: string | null } | undefined
): Promise<string | null> {
	if (!character?.avatar) return null
	return fetchImageAsBase64(character.avatar)
}
