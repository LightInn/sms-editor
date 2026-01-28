/**
 * Export Actions
 * Server actions for exporting story content
 */

'use server'

import { auth } from 'sms-editor/lib/auth/auth.server'
import type { ExportPreviewResult } from 'sms-editor/services/exportService'
import { exportService } from 'sms-editor/services/exportService'

export async function getExportPreviewAction(storyId: string): Promise<ExportPreviewResult> {
	try {
		const session = await auth.api.getSession({
			headers: await import('next/headers').then(m => m.headers()),
		})

		if (!session?.user?.id) {
			return {
				success: false,
				error: 'Unauthorized',
				status: 401,
			}
		}

		return await exportService.getExportPreview(storyId, session.user.id)
	} catch (error) {
		console.error('[getExportPreviewAction] Error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to get export preview',
			status: 500,
		}
	}
}
