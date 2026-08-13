/**
 * Who may upload and delete media.
 *
 * Pure so the rules can be asserted without a session or a database — the reason
 * the previous versions drifted into always returning true is that nothing could
 * test them.
 */

export type MediaActor = { admin?: boolean; banned?: boolean }

export type OwnedMedia = { uploader?: string }

/**
 * Not `emailVerified`: no verification flow exists on this side, so the column is
 * inherited from the SFW facade and means nothing for accounts created here.
 */
export function mayUploadMedia(actor: MediaActor | null): boolean {
	if (!actor) {
		return false
	}

	return actor.admin === true || actor.banned !== true
}

/** An absent `uploader` is the unowned scraped archive, never an open door. */
export function mayDeleteMedia(actor: MediaActor | null, actorId: string, media: OwnedMedia): boolean {
	if (!actor) {
		return false
	}

	if (actor.admin === true) {
		return true
	}

	if (actor.banned === true) {
		return false
	}

	return Boolean(media.uploader) && media.uploader === actorId
}
