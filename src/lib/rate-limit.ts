/**
 * Rate limiting for this package's server actions.
 *
 * This was a stub that unconditionally returned `{ allowed: true }` while being
 * wired into `uploadMediaAction` — so the upload path *looked* rate-limited at
 * the call site and was not, at all. It then delegated to the app's in-memory
 * implementation, which was real but forgot every count on deploy.
 *
 * It now delegates to the app's **durable** limiter (M0-T9): counts survive a
 * restart and are shared between instances, because the bucket key is derived
 * from the clock rather than stored per user. That made the check asynchronous,
 * which is why this function is `async` and every caller awaits it.
 *
 * Kept as a thin wrapper rather than deleted so the default budget
 * (`mediaUpload`) lives in one place for this package's callers.
 */

import type { RateLimitType } from '@/lib/rate-limit'
import { checkRateLimit as checkAppRateLimit } from '@/services/rate-limit.service'

export type { RateLimitType }

export async function checkRateLimit(
	identifier: string,
	limitType: RateLimitType = 'mediaUpload'
): Promise<{ allowed: boolean; error?: string; remaining?: number }> {
	return checkAppRateLimit(identifier, limitType)
}
