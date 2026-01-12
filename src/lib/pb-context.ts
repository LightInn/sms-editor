/**
 * PocketBase Context for Editor Package
 *
 * This module provides a centralized way to manage PocketBase instances
 * across the editor package. Each consuming application initializes
 * PocketBase once, and all services use the configured instance.
 */

import type PocketBase from 'pocketbase'

let pbInstance: PocketBase | null = null

/**
 * Initialize the PocketBase instance for the editor package
 * This should be called once at application startup
 *
 * @example
 * ```typescript
 * // In your app initialization (e.g., lib/pocketbase.ts)
 * import { initializePocketBase } from 'sms-stories/editor/lib'
 * import PocketBase from 'pocketbase'
 *
 * const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
 * initializePocketBase(pb)
 * ```
 */
export function initializePocketBase(pb: PocketBase): void {
	if (pbInstance) {
		console.warn('[Editor Package] PocketBase already initialized. Overwriting existing instance.')
	}
	pbInstance = pb
}

/**
 * Get the configured PocketBase instance
 * Throws an error if PocketBase has not been initialized
 *
 * @throws {Error} If PocketBase has not been initialized via initializePocketBase
 */
export function getPocketBase(): PocketBase {
	if (!pbInstance) {
		throw new Error(
			'[Editor Package] PocketBase not initialized. Call initializePocketBase(pb) before using editor services.'
		)
	}
	return pbInstance
}

/**
 * Check if PocketBase has been initialized
 */
export function isPocketBaseInitialized(): boolean {
	return pbInstance !== null
}

/**
 * Reset PocketBase instance (useful for testing)
 * @internal
 */
export function resetPocketBase(): void {
	pbInstance = null
}
