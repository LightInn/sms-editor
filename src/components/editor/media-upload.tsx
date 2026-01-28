/**
 * Media Upload Component
 * Drag & drop zone for uploading images and videos
 */

'use client'

import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadMediaAction } from 'sms-editor/actions/mediaActions'
import { cn } from 'sms-editor/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface MediaUploadProps {
	onUpload: (recordId: string, url: string, alt: string, type: 'image' | 'video') => void
	currentMediaUrl?: string
	currentMediaAlt?: string
	currentMediaType?: 'image' | 'video'
}

export function MediaUpload({ onUpload, currentMediaUrl, currentMediaAlt, currentMediaType }: MediaUploadProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [altText, setAltText] = useState(currentMediaAlt || '')
	const [previewUrl, setPreviewUrl] = useState(currentMediaUrl || '')
	const [mediaType, setMediaType] = useState<'image' | 'video'>(currentMediaType || 'image')

	// Sync state when props change (important for loading existing media)
	// Only update if the value ACTUALLY changed - preserve local state if parent passes undefined/same value
	useEffect(() => {
		// Only update previewUrl if a new non-empty URL is provided OR if explicitly cleared (empty string)
		// This prevents resetting to empty when parent re-renders without expand data
		if (currentMediaUrl !== undefined) {
			setPreviewUrl(prev => {
				// If new URL is provided and different, use it
				if (currentMediaUrl && currentMediaUrl !== prev) {
					return currentMediaUrl
				}
				// If explicitly cleared (empty string), clear it
				if (currentMediaUrl === '') {
					return ''
				}
				// Otherwise preserve existing URL
				return prev
			})
		}
	}, [currentMediaUrl])

	useEffect(() => {
		if (currentMediaAlt !== undefined) {
			setAltText(currentMediaAlt)
		}
	}, [currentMediaAlt])

	useEffect(() => {
		if (currentMediaType !== undefined) {
			setMediaType(currentMediaType)
		}
	}, [currentMediaType])

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			const file = acceptedFiles[0]
			if (!file) return

			// Determine media type
			const isVideo = file.type.startsWith('video/')
			const isImage = file.type.startsWith('image/')

			if (!isImage && !isVideo) {
				toast.error('Only images and videos are supported')
				return
			}

			// Check file size (max 50MB for all media)
			const maxSize = 50 * 1024 * 1024
			if (file.size > maxSize) {
				toast.error('File must be less than 50MB')
				return
			}

			setIsUploading(true)

			try {
				// Upload via server action
				const formData = new FormData()
				formData.append('file', file)
				formData.append('alt', altText || file.name)

				const result = await uploadMediaAction(formData)

				if (!result.success || !result.url || !result.recordId) {
					toast.error('error' in result ? result.error : 'Failed to upload media')
					return
				}

				setPreviewUrl(result.url)
				setMediaType(isVideo ? 'video' : 'image')
				onUpload(result.recordId, result.url, altText || file.name, isVideo ? 'video' : 'image')
				toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully!`)
			} catch (error) {
				console.error('Failed to upload media:', error)
				toast.error('Failed to upload media. Please try again.')
			} finally {
				setIsUploading(false)
			}
		},
		[altText, onUpload]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
			'video/*': ['.mp4', '.webm', '.ogg'],
		},
		maxFiles: 1,
		maxSize: 50 * 1024 * 1024, // 50MB
		disabled: isUploading,
	})

	const handleRemove = () => {
		setPreviewUrl('')
		setAltText('')
		setMediaType('image')
		// Notify parent component that media was removed
		onUpload('', '', '', 'image')
	}

	return (
		<div className="space-y-4">
			{/* Upload Zone */}
			{!previewUrl ? (
				<div
					{...getRootProps()}
					className={cn(
						'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
						isDragActive
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/25 hover:border-primary hover:bg-accent/50',
						isUploading && 'opacity-50 cursor-not-allowed'
					)}
				>
					<input {...getInputProps()} />
					<div className="flex flex-col items-center gap-4">
						{isUploading ? (
							<>
								<Loader2 className="h-12 w-12 text-primary animate-spin" />
								<p className="text-sm text-muted-foreground">Uploading media...</p>
							</>
						) : (
							<>
								<Upload className="h-12 w-12 text-muted-foreground" />
								<div className="space-y-2">
									<p className="text-sm font-medium">
										{isDragActive ? 'Drop the file here' : 'Drag & drop an image or video here'}
									</p>
									<p className="text-xs text-muted-foreground">or click to select from your computer</p>
									<p className="text-xs text-muted-foreground">
										Supported: Images (JPG, PNG, WebP, GIF) and Videos (MP4, WebM, OGG) up to 50MB
									</p>
								</div>
							</>
						)}
					</div>
				</div>
			) : (
				/* Preview */
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							{/* Media Preview */}
							<div className="relative rounded-lg overflow-hidden bg-muted">
								{mediaType === 'image' ? (
									<div className="relative w-full" style={{ maxHeight: '400px' }}>
										<Image
											src={previewUrl}
											alt={altText}
											width={1200}
											height={400}
											className="w-full h-auto max-h-[400px] object-contain"
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
											unoptimized={previewUrl.startsWith('http')}
										/>
									</div>
								) : (
									<video src={previewUrl} controls className="w-full h-auto max-h-[400px]">
										<track kind="captions" />
									</video>
								)}
								<Button
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2"
									onClick={handleRemove}
									type="button"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
