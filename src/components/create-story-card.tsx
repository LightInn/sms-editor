/**
 * Create Story Card Component
 * CTA card for creating a new story
 */

'use client'

import { motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CardContent } from '@/components/ui/card'

export function CreateStoryCard() {
	const [isHovered, setIsHovered] = useState(false)

	// Shared spring config for buttery smooth animations
	const spring = { type: 'spring' as const, stiffness: 200, damping: 25 }

	return (
		<Link href="/editor/new" className="block h-full">
			<motion.div
				className="create-story-card h-full min-h-[300px] rounded-xl bg-card cursor-pointer relative"
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
			>
				{/* Layer 1 - Outer */}
				<motion.div
					className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/40"
					animate={{ scale: isHovered ? 0.96 : 1 }}
					transition={spring}
				/>
				{/* Layer 2 - Middle */}
				<motion.div
					className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/25"
					animate={{ scale: isHovered ? 0.89 : 1 }}
					transition={spring}
				/>
				{/* Layer 3 - Inner */}
				<motion.div
					className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/15"
					animate={{ scale: isHovered ? 0.82 : 1 }}
					transition={spring}
				/>

				<CardContent className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
					<motion.div
						className="rounded-full bg-primary/10 p-4 mb-4"
						animate={{
							scale: isHovered ? 1.05 : 1,
							backgroundColor: isHovered ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--primary) / 0.1)',
						}}
						transition={spring}
					>
						<motion.div animate={{ rotate: isHovered ? 90 : 0 }} transition={spring}>
							<PlusCircle className="h-12 w-12 text-primary" />
						</motion.div>
					</motion.div>
					<h3 className="text-lg font-semibold mb-2 text-primary">Create New Story</h3>
					<p className="text-sm text-muted-foreground max-w-xs">Start crafting your own SMS-based love story</p>
				</CardContent>
			</motion.div>
		</Link>
	)
}
