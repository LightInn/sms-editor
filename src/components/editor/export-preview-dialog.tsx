/**
 * Export Preview Dialog Component
 * Modal for previewing story export with carousel of block images
 */

'use client'

import type { ExportPreviewData } from '../../services'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { getExportPreviewAction } from '@smseditor/actions/exportActions'
import { Button } from '@smseditor/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@smseditor/components/ui/dialog'
import { ScrollArea } from '@smseditor/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@smseditor/components/ui/tabs'
import { TypewriterLoader } from '@smseditor/components/ui/typewriter-loader'
import { cn } from '@smseditor/lib/utils'

type ExportPreviewResponse = ExportPreviewData

interface ExportPreviewDialogProps {
	storyId: string
	open: boolean
	onOpenChange: (open: boolean) => void
	onDownload: () => Promise<void>
}

export function ExportPreviewDialog({ storyId, open, onOpenChange, onDownload }: ExportPreviewDialogProps) {
	const [previewData, setPreviewData] = useState<ExportPreviewResponse | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isDownloading, setIsDownloading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const [imageKey, setImageKey] = useState(Date.now())

	const fetchPreview = useCallback(async () => {
		if (!storyId) return

		setIsLoading(true)
		setError(null)

		try {
			console.log('[ExportPreview] Fetching preview data for story:', storyId)
			const data = await getExportPreviewAction(storyId)

			if (!data.success) {
				throw new Error('error' in data ? data.error : 'Failed to fetch preview')
			}

			console.log('[ExportPreview] Preview data received:', data.totalImages, 'images from', data.totalBlocks, 'blocks')
			setPreviewData(data)
			setCurrentImageIndex(0)
			setImageKey(Date.now())
		} catch (err) {
			console.error('[ExportPreview] Error fetching preview:', err)
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}, [storyId])

	useEffect(() => {
		if (open) {
			fetchPreview()
		}
	}, [open, fetchPreview])

	const handleRefresh = () => {
		console.log('[ExportPreview] Manual refresh triggered')
		setImageKey(Date.now())
		fetchPreview()
	}

	const handleDownload = async () => {
		setIsDownloading(true)
		try {
			await onDownload()
		} finally {
			setIsDownloading(false)
		}
	}

	const goToPrevious = () => {
		if (currentImageIndex > 0) {
			setCurrentImageIndex(currentImageIndex - 1)
		}
	}

	const goToNext = () => {
		if (previewData && currentImageIndex < (previewData.totalImages || previewData.exportImageUrls.length) - 1) {
			setCurrentImageIndex(currentImageIndex + 1)
		}
	}

	const totalImages = previewData?.totalImages || previewData?.exportImageUrls?.length || 0
	const currentImageUrl = previewData?.exportImageUrls[currentImageIndex]

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
				{/* Download overlay with typewriter animation */}
				{isDownloading && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
						<TypewriterLoader message="Creating ZIP file..." />
					</div>
				)}

				<DialogHeader>
					<DialogTitle className="flex items-center justify-between pr-4">
						<span>Export Preview</span>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isDownloading}>
								<RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
								Refresh
							</Button>
							<Button size="sm" onClick={handleDownload} disabled={isDownloading}>
								{isDownloading ? 'Generating...' : 'Download All'}
							</Button>
						</div>
					</DialogTitle>
					<DialogDescription>Preview your story export - {totalImages} images to export</DialogDescription>
				</DialogHeader>

				{error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">Error: {error}</div>}

				<Tabs defaultValue="preview" className="flex-1 overflow-hidden">
					<TabsList>
						<TabsTrigger value="preview">Image Preview</TabsTrigger>
						<TabsTrigger value="story">Story Data</TabsTrigger>
						<TabsTrigger value="blocks">Blocks ({previewData?.totalBlocks || 0})</TabsTrigger>
					</TabsList>

					<TabsContent value="preview" className="flex-1 overflow-hidden">
						<div className="flex flex-col h-[60vh]">
							{/* Image carousel */}
							<div className="flex-1 flex items-center justify-center p-4 gap-4">
								{/* Previous button */}
								<Button
									variant="outline"
									size="icon"
									onClick={goToPrevious}
									disabled={currentImageIndex === 0 || isLoading}
									className="shrink-0"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>

								{/* Image */}
								<div className="flex-1 flex items-center justify-center">
									{isLoading ? (
										<div className="flex items-center justify-center h-full">
											<RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
										</div>
									) : currentImageUrl ? (
										<div className="relative w-[215px] h-[466px] border rounded-lg overflow-hidden shadow-lg bg-white">
											<Image
												key={`${imageKey}-${currentImageIndex}`}
												src={`${currentImageUrl}&key=${imageKey}`}
												alt={`Image ${currentImageIndex + 1} of ${totalImages}`}
												fill
												className="object-contain"
												unoptimized
											/>
										</div>
									) : (
										<div className="text-muted-foreground">No preview available</div>
									)}
								</div>

								{/* Next button */}
								<Button
									variant="outline"
									size="icon"
									onClick={goToNext}
									disabled={currentImageIndex >= totalImages - 1 || isLoading}
									className="shrink-0"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>

							{/* Navigation info */}
							<div className="flex flex-col items-center gap-2 pb-4">
								{/* Counter */}
								<span className="text-sm font-medium">
									{currentImageIndex + 1} / {totalImages}
								</span>

								{/* Dots - only show if reasonable number */}
								{totalImages <= 20 && (
									<div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
										{previewData?.exportImageUrls.map((url, idx) => (
											<button
												key={url}
												type="button"
												onClick={() => setCurrentImageIndex(idx)}
												className={cn(
													'w-2 h-2 rounded-full transition-all duration-200',
													idx === currentImageIndex
														? 'bg-primary w-4'
														: 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
												)}
												aria-label={`Go to image ${idx + 1}`}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="story" className="flex-1 overflow-hidden">
						<ScrollArea className="h-[60vh]">
							<pre className="p-4 text-xs bg-muted rounded-md overflow-auto">
								{previewData?.story ? JSON.stringify(previewData.story, null, 2) : 'Loading...'}
							</pre>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="blocks" className="flex-1 overflow-hidden">
						<ScrollArea className="h-[60vh]">
							<pre className="p-4 text-xs bg-muted rounded-md overflow-auto">
								{previewData?.blocks ? JSON.stringify(previewData.blocks, null, 2) : 'Loading...'}
							</pre>
						</ScrollArea>
					</TabsContent>
				</Tabs>

				{previewData && (
					<div className="text-xs text-muted-foreground pt-2 border-t">
						Last updated: {new Date(previewData.timestamp).toLocaleString()}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
