import { mayDeleteMedia, mayUploadMedia } from '@sms-editor/lib/media/permissions'
import { describe, expect, it } from 'vitest'

describe('mayUploadMedia', () => {
	it('allows an ordinary authenticated account', () => {
		expect(mayUploadMedia({})).toBe(true)
	})

	it('refuses a banned account', () => {
		expect(mayUploadMedia({ banned: true })).toBe(false)
	})

	it('lets an admin through even when flagged banned', () => {
		expect(mayUploadMedia({ admin: true, banned: true })).toBe(true)
	})

	it('refuses when the account could not be read', () => {
		expect(mayUploadMedia(null)).toBe(false)
	})
})

describe('mayDeleteMedia', () => {
	it('allows the uploader', () => {
		expect(mayDeleteMedia({}, 'user_1', { uploader: 'user_1' })).toBe(true)
	})

	it('refuses someone else’s upload', () => {
		expect(mayDeleteMedia({}, 'user_2', { uploader: 'user_1' })).toBe(false)
	})

	/*
	 * The hole this closes: `images` had no owner column at all, so the check read
	 * undefined and passed. 13.5k scraped archive rows were deletable by anyone
	 * signed in.
	 */
	it('refuses an unowned record rather than treating it as ownerless-therefore-free', () => {
		expect(mayDeleteMedia({}, 'user_1', {})).toBe(false)
		expect(mayDeleteMedia({}, 'user_1', { uploader: '' })).toBe(false)
	})

	it('refuses a banned account its own upload', () => {
		expect(mayDeleteMedia({ banned: true }, 'user_1', { uploader: 'user_1' })).toBe(false)
	})

	it('allows an admin to delete anything, including unowned archive rows', () => {
		expect(mayDeleteMedia({ admin: true }, 'admin_1', {})).toBe(true)
		expect(mayDeleteMedia({ admin: true }, 'admin_1', { uploader: 'user_1' })).toBe(true)
	})

	it('refuses when the account could not be read', () => {
		expect(mayDeleteMedia(null, 'user_1', { uploader: 'user_1' })).toBe(false)
	})
})
