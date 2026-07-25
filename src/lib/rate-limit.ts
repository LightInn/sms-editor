/**
 * Rate limiting for this package's server actions.
 *
 * This was a stub that unconditionally returned `{ allowed: true }` while being
 * wired into `uploadMediaAction` — so the upload path *looked* rate-limited at
 * the call site and was not, at all. Meanwhile the app already shipped a working
 * implementation, with a `mediaUpload` budget defined and no callers.
 *
 * This now delegates to that implementation rather than duplicating it. Importing
 * from `@/lib` is the established direction here (this package already imports
 * `@/lib/pocketbase` and `@/lib/auth` in the same actions).
 *
 * Caveat worth knowing: the underlying store is in-memory, so the budget is per
 * server instance and resets on restart. That is real protection against a single
 * client hammering an endpoint, not against a distributed abuser — moving the
 * store to Redis is the next step if uploads ever get abused for real.
 */

import { checkRateLimit as checkAppRateLimit, type RateLimitType } from '@/lib/rate-limit'

export type { RateLimitType }

export function checkRateLimit(
	identifier: string,
	limitType: RateLimitType = 'mediaUpload'
): { allowed: boolean; error?: string; remaining?: number } {
	return checkAppRateLimit(identifier, limitType)
}
