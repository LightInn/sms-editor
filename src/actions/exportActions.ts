/**
 * Export Actions
 * Server actions for exporting story content
 */

'use server'

import { auth } from '@sms-editor/lib/auth/auth.server'
import type { ExportPreviewResponse } from '@sms-editor/services/exportService'
import { exportService } from '@sms-editor/services/exportService'

export async function getExportPreviewAction(storyId: string): Promise<ExportPreviewResponse> {
	try {
		const session = await auth.api.getSession({
			headers: await import('next/headers').then(m => m.headers()),
		})

		if (!session?.user?.id) {
			throw new Error('Unauthorized: No valid session')
		}

		return await exportService.getExportPreview(storyId, session.user.id)
	} catch (error) {
		console.error('[getExportPreviewAction] Error:', error)
		throw error
	}
}
