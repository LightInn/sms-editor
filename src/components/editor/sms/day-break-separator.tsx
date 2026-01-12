/**
 * Day Break Separator Component
 * Displays a date separator between messages
 */

export interface DayBreakSeparatorProps {
	date: string
}

export function DayBreakSeparator({ date }: DayBreakSeparatorProps) {
	return (
		<div className="flex items-center justify-center my-4">
			<div className="bg-muted/80 text-muted-foreground text-xs px-3 py-1 rounded-full">{date}</div>
		</div>
	)
}
