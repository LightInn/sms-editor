/**
 * Chapter Type Selector Component
 * Allows user to select the type of chapter to create
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Image, MessageSquare } from 'lucide-react'
import type { ChapterType } from '../../types/creator-stories'

export interface ChapterTypeSelectorProps {
	onSelectType: (type: ChapterType) => void
}

export function ChapterTypeSelector({ onSelectType }: ChapterTypeSelectorProps) {
	return (
		<div className="flex items-center justify-center min-h-[400px] p-8">
			<div className="max-w-4xl w-full">
				<div className="text-center mb-8">
					<h2 className="text-2xl font-semibold mb-2">Create a New Chapter</h2>
					<p className="text-muted-foreground text-sm">Choose the type of content you want to add to your story</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* SMS Conversation Card */}
					<Card
						className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
						onClick={() => onSelectType('sms_conversation')}
					>
						<CardHeader>
							<div className="flex justify-center mb-4">
								<div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
									<MessageSquare className="h-12 w-12 text-primary" />
								</div>
							</div>
							<CardTitle className="text-center text-lg">SMS Conversation</CardTitle>
							<CardDescription className="text-center text-sm">
								Create a conversation between characters
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Message exchanges between characters</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Support for duo and group conversations</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Multiple app styles (iMessage, WhatsApp, etc.)</span>
								</li>
							</ul>
						</CardContent>
					</Card>

					{/* Rich Text Content Card */}
					<Card
						className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
						onClick={() => onSelectType('rich_text_content')}
					>
						<CardHeader>
							<div className="flex justify-center mb-4">
								<div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
									<FileText className="h-12 w-12 text-primary" />
								</div>
							</div>
							<CardTitle className="text-center text-lg">Text Content</CardTitle>
							<CardDescription className="text-center text-sm">
								Write narrative context with rich formatting
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Rich text editor with full formatting</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Add headings, lists, quotes, and links</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Perfect for narrative context and descriptions</span>
								</li>
							</ul>
						</CardContent>
					</Card>

					{/* Media Content Card */}
					<Card
						className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
						onClick={() => onSelectType('media_content')}
					>
						<CardHeader>
							<div className="flex justify-center mb-4">
								<div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors">
									<Image className="h-12 w-12 text-primary" />
								</div>
							</div>
							<CardTitle className="text-center text-lg">Media Content</CardTitle>
							<CardDescription className="text-center text-sm">Upload images or videos as context</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Upload images or videos</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Drag and drop support</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-primary mt-1">•</span>
									<span>Visual resources for your story</span>
								</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
