/**
 * SMS Chapter Editor Component (Refactored)
 * Simplified editor for SMS conversation chapters
 */

'use client'

import { uploadCharacterAvatar } from '@sms-editor/actions/media'
import { useManualSave } from '@sms-editor/hooks/use-manual-save'
import { cn } from '@sms-editor/lib/utils'
import { Info, Loader2, Settings, Trash2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	findPreviousConversationDataAction,
	getBlockAction,
	getChapterAction,
	getStoryAction,
} from '../../actions/serviceActions'
import type {
	AppTarget,
	ChapterWithExpand,
	Character,
	ConversationType,
	CreatorBlock,
	Message,
	Participant,
	RecoveredConversationData,
	SMSContent,
} from '../../types/creator-stories'
import { ConversationConfig } from './sms/conversation-config'
import { EditorTutorialDialog } from './sms/editor-tutorial-dialog'
import { PhonePreview } from './sms/phone-preview'

export interface SmsChapterEditorProps {
	chapter: CreatorBlock
	characters: Character[]
	onSave: (block: CreatorBlock) => Promise<CreatorBlock>
	onSaveStatusChange?: (status: {
		isSaving: boolean
		isDirty: boolean
		lastSaved: Date | null
		error: Error | null
	}) => void
	onSaveFunctionChange?: (saveFn: (() => Promise<void>) | null) => void
	onDelete?: (blockId: string) => Promise<void>
	onBackToChapterSettings?: () => void
}

export function SmsChapterEditor({
	chapter,
	characters,
	onSave,
	onSaveStatusChange,
	onSaveFunctionChange,
	onDelete,
	onBackToChapterSettings,
}: SmsChapterEditorProps) {
	// Chapter metadata
	const [conversationTitle, setConversationTitle] = useState(chapter.conversationTitle)
	const [conversationAvatar, setConversationAvatar] = useState(chapter.conversationAvatar) // Image record ID
	const [conversationAvatarUrl, setConversationAvatarUrl] = useState<string | null>(null) // URL for display
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

	// Delete dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// Auto-recovery state
	const [recoveredData, setRecoveredData] = useState<RecoveredConversationData | null>(null)
	const [_isLoadingRecovery, setIsLoadingRecovery] = useState(false)
	const [showRecoveryIndicator, setShowRecoveryIndicator] = useState(false)

	// Update conversation settings when chapter changes
	useEffect(() => {
		setConversationType(chapter.conversationType || 'duo')
		setAppTarget(chapter.appTarget || 'imessage')
		setParticipants(chapter.participants || [])
	}, [chapter.conversationType, chapter.appTarget, chapter.participants])

	// Conversation settings
	const [conversationDate, setConversationDate] = useState(() => {
		// Initialize with today's date in YYYY-MM-DD format
		const today = new Date()
		return today.toISOString().split('T')[0]
	})
	const [conversationType, setConversationType] = useState<ConversationType>(chapter.conversationType || 'duo')
	const [appTarget, setAppTarget] = useState<AppTarget>(chapter.appTarget || 'imessage')
	const [participants, setParticipants] = useState<Participant[]>(chapter.participants || [])
	// groupName removed in favor of conversationTitle

	// Auto-recovery: Fetch previous conversation data when participants change
	useEffect(() => {
		// Only trigger if we have at least 2 participants
		if (!participants || participants.length < 2) {
			setRecoveredData(null)
			setShowRecoveryIndicator(false)
			return
		}

		// Only fetch if we don't already have custom data (avoid overriding user input)
		if (conversationTitle || conversationAvatar) {
			// User already has custom data, don't fetch
			return
		}

		const fetchPreviousData = async () => {
			setIsLoadingRecovery(true)
			try {
				// Get the block with chapter expand
				const block = await getBlockAction(chapter.id, true)
				const chapterData: ChapterWithExpand | undefined =
					block.expand?.chapter ?? (await getChapterAction(block.chapter, true))

				if (!chapterData) {
					console.error('[SmsChapterEditor] Chapter not found')
					return
				}

				// Get the story
				const story = chapterData.expand?.story ?? (await getStoryAction(chapterData.story))

				if (!story) {
					console.error('[SmsChapterEditor] Story not found')
					return
				}

				// Find previous conversation data
				const recoveredData = await findPreviousConversationDataAction(participants, chapter.id, story.id)

				if (recoveredData) {
					// Found previous data - pre-fill the fields
					setRecoveredData(recoveredData)

					// Pre-fill only if current values are empty
					if (!conversationTitle && recoveredData.conversationTitle) {
						setConversationTitle(recoveredData.conversationTitle)
					}

					if (!conversationAvatar && recoveredData.conversationAvatar) {
						setConversationAvatar(recoveredData.conversationAvatar)
						if (recoveredData.conversationAvatarUrl) {
							setConversationAvatarUrl(recoveredData.conversationAvatarUrl)
						}
					}

					// Show indicator
					setShowRecoveryIndicator(true)
				} else {
					setRecoveredData(null)
					setShowRecoveryIndicator(false)
				}
			} catch (error) {
				console.error('[SmsChapterEditor] Error fetching previous conversation data:', error)
			} finally {
				setIsLoadingRecovery(false)
			}
		}

		fetchPreviousData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [participants, chapter.id]) // Only depend on participants and chapter ID

	// Messages - Load from chapter.messages or chapter.content.messages
	const [messages, setMessages] = useState<Message[]>(() => {
		// Try chapter.messages first (shorthand), then content.messages
		if (chapter.messages && chapter.messages.length > 0) {
			return chapter.messages
		}
		if (chapter.content && 'messages' in chapter.content) {
			return chapter.content.messages
		}
		return []
	})

	// Avatar upload handler
	const onAvatarDrop = useCallback(async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0]
		if (!file) return

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Avatar must be less than 5MB')
			return
		}

		setIsUploadingAvatar(true)

		try {
			// Create FormData for server action
			const uploadFormData = new FormData()
			uploadFormData.append('file', file)
			uploadFormData.append('firstName', 'conversation')
			uploadFormData.append('lastName', 'avatar')

			// Upload via server action (creates record in images collection)
			const result = await uploadCharacterAvatar(uploadFormData)

			if (result.success && result.recordId && result.url) {
				// Store the ID (for relation) and URL (for display)
				setConversationAvatar(result.recordId)
				setConversationAvatarUrl(result.url)
				toast.success('Avatar uploaded successfully!')
			} else {
				console.error('[SmsChapterEditor] AVATAR UPLOAD FAILED:', result.error)
				toast.error(result.error || 'Failed to upload avatar')
			}
		} catch (error) {
			console.error('[SmsChapterEditor] AVATAR UPLOAD ERROR:', error)
			toast.error('Failed to upload avatar. Please try again.')
		} finally {
			setIsUploadingAvatar(false)
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: onAvatarDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
		},
		maxFiles: 1,
		maxSize: 5 * 1024 * 1024, // 5MB
		disabled: isUploadingAvatar,
	})

	const handleRemoveAvatar = () => {
		setConversationAvatar(null)
		setConversationAvatarUrl(null)
	}

	// Create chapter data object for saving
	// Note: We only include state values, not metadata fields (created, updated)
	// This prevents infinite loops and false dirty states when the chapter reference changes after save
	const blockData = useMemo(() => {
		const data = {
			id: chapter.id,
			chapter: chapter.chapter,
			type: chapter.type,
			order: chapter.order,
			title: null, // Block titles are no longer used
			content: { messages } as SMSContent,
			conversationType,
			appTarget,
			participants,
			messages,
			conversationTitle,
			conversationAvatar,
		}
		return data
	}, [
		chapter.id,
		chapter.chapter,
		chapter.type,
		chapter.order,
		conversationType,
		appTarget,
		participants,
		messages,
		conversationTitle,
		conversationAvatar,
	])

	// Manual save hook with change detection
	const { isSaving, isDirty, lastSavedAt, error, save } = useManualSave({
		data: blockData,
		onSave: async data => {
			// Call the parent's onSave and expect the updated block back
			const savedBlock = await onSave(data as CreatorBlock)
			// Return the saved block with server timestamp, ensuring it matches the data type
			return {
				...data,
				...savedBlock,
			} as typeof data
		},
		serverTimestamp: chapter.updated, // Pass the backend timestamp
		onSaveSuccess: () => {
			// Reconciliation: Update local state with server response if needed
			// The parent component has already updated the block in its state
			// We can use this callback for additional UI updates if needed
		},
	})

	// Notify parent of save status changes
	useEffect(() => {
		onSaveStatusChange?.({ isSaving, isDirty, lastSaved: lastSavedAt ? new Date(lastSavedAt) : null, error })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSaving, isDirty, lastSavedAt, error]) // onSaveStatusChange is stable via useCallback

	// Expose save function to parent using a ref to avoid infinite loops
	const saveRef = useRef(save)
	saveRef.current = save

	useEffect(() => {
		// Create a stable wrapper function
		const stableSave = () => saveRef.current()
		onSaveFunctionChange?.(stableSave)

		// Cleanup when component unmounts
		return () => {
			onSaveFunctionChange?.(null)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onSaveFunctionChange]) // Only depend on the callback, not on save

	// Message handlers - simplified for inline editing
	const handleMessageAdd = useCallback((messageData: Omit<Message, 'id'>, insertIndex: number) => {
		const newMessage: Message = {
			...messageData,
			id: uuidv4(),
		}
		setMessages(prev => {
			const newMessages = [...prev]
			newMessages.splice(insertIndex, 0, newMessage)
			return newMessages
		})
	}, [])

	const handleMessageEdit = useCallback((messageId: string, content: string) => {
		setMessages(prev =>
			prev.map(msg =>
				msg.id === messageId
					? {
							...msg,
							content,
						}
					: msg
			)
		)
	}, [])

	const handleMessageDelete = useCallback((messageId: string) => {
		setMessages(prev => prev.filter(msg => msg.id !== messageId))
	}, [])

	// Handle block deletion
	const handleDelete = async () => {
		if (!onDelete) return

		setIsDeleting(true)
		try {
			await onDelete(chapter.id)
			toast.success('Block deleted')
			setDeleteDialogOpen(false)
		} catch (error) {
			console.error('Failed to delete block:', error)
			toast.error('Failed to delete block')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header with Chapter Settings, Save Now, and Delete Button */}
			<div className="flex items-center justify-end px-1 gap-2">
				{onBackToChapterSettings && (
					<Button variant="outline" size="sm" onClick={onBackToChapterSettings} className="mr-2">
						<Settings className="h-4 w-4 mr-2" />
						Chapter Settings
					</Button>
				)}
				<Button variant="outline" size="sm" onClick={save} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Now'}
				</Button>
				{onDelete && (
					<Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete Block
					</Button>
				)}
			</div>

			{/* Main Layout: Editor on left, Config on right (desktop) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Column: Phone Preview */}
				<div className="flex flex-col items-center lg:items-start">
					<PhonePreview
						appTarget={appTarget}
						messages={messages}
						participants={participants}
						characters={characters}
						conversationTitle={conversationTitle}
						conversationAvatar={conversationAvatarUrl || undefined}
						conversationDate={conversationDate}
						onMessageAdd={handleMessageAdd}
						onMessageEdit={handleMessageEdit}
						onMessageDelete={handleMessageDelete}
					/>

					{/* Info message if no participants */}
					{participants.length === 0 && (
						<p className="text-sm text-muted-foreground text-center lg:text-left mt-4">
							Configure participants on the right to start creating messages.
						</p>
					)}
					{participants.length === 1 && (
						<p className="text-sm text-muted-foreground text-center lg:text-left mt-4">
							Add at least 2 participants to create a conversation.
						</p>
					)}
				</div>

				{/* Right Column: Configuration Cards */}
				<div className="space-y-6">
					{/* Editor Tutorial Card */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex flex-col items-center text-center space-y-3">
								<h3 className="text-sm font-medium">How to use the editor</h3>
								<p className="text-xs text-muted-foreground">
									Learn keyboard shortcuts and editing tips to create conversations faster
								</p>
								<EditorTutorialDialog />
							</div>
						</CardContent>
					</Card>

					{/* Conversation Configuration Card */}
					<ConversationConfig
						conversationDate={conversationDate}
						conversationType={conversationType}
						appTarget={appTarget}
						participants={participants}
						characters={characters}
						hasMessages={messages.length > 0}
						onConversationDateChange={setConversationDate}
						onConversationTypeChange={setConversationType}
						onAppTargetChange={setAppTarget}
						onParticipantsChange={setParticipants}
					/>

					{/* Conversation Settings Card */}
					<Card>
						<CardContent className="pt-6 space-y-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="conversationTitle" className="text-sm text-muted-foreground">
										Conversation title (optional)
									</Label>
									<span className="text-xs text-muted-foreground">{(conversationTitle || '').length}/50</span>
								</div>
								<Input
									id="conversationTitle"
									className="bg-transparent border"
									placeholder="Custom conversation title"
									value={conversationTitle || ''}
									onChange={e => {
										const value = e.target.value
										if (value.length <= 50) {
											setConversationTitle(value || null)
										}
									}}
									onBlur={e => {
										// Trim on blur to clean up whitespace
										const trimmed = e.target.value.trim()
										setConversationTitle(trimmed || null)
									}}
									maxLength={50}
								/>
								<p className="text-xs text-muted-foreground">Leave empty to auto-generate from participants</p>
							</div>

							{/* Auto-recovery indicator */}
							{showRecoveryIndicator && recoveredData && (
								<div className="border rounded-lg p-3">
									<div className="flex items-start gap-2">
										<Info className="h-4 w-4 mt-0.5 shrink-0" />
										<div className="flex-1 space-y-1">
											<p className="text-sm font-medium">Auto-retrieved from previous conversation</p>
											<p className="text-xs">
												{recoveredData.conversationTitle && recoveredData.conversationAvatar
													? 'Title and avatar'
													: recoveredData.conversationTitle
														? 'Title'
														: 'Avatar'}{' '}
												loaded from "{recoveredData.sourceBlockTitle || 'Untitled'}"
											</p>
											<button
												type="button"
												onClick={() => setShowRecoveryIndicator(false)}
												className="text-xs hover:underline"
											>
												Dismiss
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Conversation Avatar */}
							<div className="space-y-2">
								<Label className="text-sm text-muted-foreground">Conversation avatar (optional)</Label>
								<p className="text-xs text-muted-foreground mb-2">
									Custom avatar for this conversation (e.g., how one participant appears to another)
								</p>

								{/* Avatar Preview - Only show if we have an avatar */}
								{conversationAvatarUrl ? (
									<div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
										<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 relative">
											<Image src={conversationAvatarUrl} alt="Conversation avatar" fill className="object-cover" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium">Avatar Preview</p>
											<p className="text-xs text-muted-foreground">
												This avatar will appear in the conversation header
											</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={handleRemoveAvatar}
											disabled={isUploadingAvatar}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								) : (
									/* Avatar Upload - Only show if no avatar */
									<div
										{...getRootProps()}
										className={cn(
											'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
											isUploadingAvatar && 'opacity-50 cursor-not-allowed',
											isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
										)}
									>
										<input {...getInputProps()} />
										{isUploadingAvatar ? (
											<>
												<Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
												<p className="text-sm text-muted-foreground">Uploading avatar...</p>
											</>
										) : (
											<>
												<Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
												{isDragActive ? (
													<p className="text-sm text-muted-foreground">Drop the image here...</p>
												) : (
													<>
														<p className="text-sm text-muted-foreground mb-1">
															Drag & drop an avatar image, or click to select
														</p>
														<p className="text-xs text-muted-foreground">Max 5MB • JPG, PNG, WebP, GIF</p>
													</>
												)}
											</>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{onDelete && (
				<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this block?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete this block and all its content.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDelete}
								disabled={isDeleting}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{isDeleting ? 'Deleting...' : 'Delete Block'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	)
}
