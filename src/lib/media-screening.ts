/**
 * Media screening for this package's upload paths (M5-T2).
 *
 * The app added `/api/media/upload` as "the only way an image enters the
 * platform", and it was not true: this package writes to the `images` collection
 * from three places, all server-side, all bypassing it. Those uploads landed
 * with no `review_status`, which meant a creator's avatar and every media block
 * went public without anyone or anything looking at them.
 *
 * This delegates to the app's screening service rather than calling that HTTP
 * route. These are already server actions holding the same process and the same
 * PocketBase client, so an internal HTTP hop would buy nothing but a second
 * failure mode. The *policy* — which verdict publishes, what happens to a video,
 * what an outage means — stays in the app, in one place, unchanged.
 *
 * Importing from `@/` is the established direction here; this package already
 * imports `@/lib/pocketbase` and `@/lib/auth` in the same actions.
 */

import { screeningFields, screenUploadedFile } from '@/services/media-screening.service'

/**
 * Screen a file and append the resulting review fields to the FormData that is
 * about to create the record.
 *
 * Appending to the same FormData is deliberate: the verdict and the bytes reach
 * PocketBase in one write, so there is no window in which a row exists with no
 * review state. A screen-then-update sequence would leave exactly that gap, and
 * a crash inside it would leave an unreviewed row looking like a legacy one.
 *
 * Never throws — the app's service turns every screener failure into a held
 * upload, so an outage costs a creator a wait, not their file.
 */
export async function applyScreening(formData: FormData, file: File): Promise<void> {
	const screened = await screenUploadedFile(file)

	for (const [field, value] of Object.entries(screeningFields(screened))) {
		formData.append(field, value)
	}
}
