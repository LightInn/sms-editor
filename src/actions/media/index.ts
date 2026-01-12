/**
 * Media Actions - Re-exports
 * Central export point for all media-related server actions
 */

// Types
export type { UploadAvatarResult } from './avatar.actions'
// Avatar Actions
export { uploadCharacterAvatar, uploadMessageMedia } from './avatar.actions'
export type { UploadMediaResult } from './upload.actions'
// Upload Actions
export { deleteMediaAction, uploadMediaAction } from './upload.actions'

// Validation (for reuse)
export {
	ALLOWED_IMAGE_TYPES,
	ALLOWED_VIDEO_TYPES,
	MAX_AVATAR_SIZE,
	MAX_IMAGE_SIZE,
	MAX_VIDEO_SIZE,
	validateAvatarFile,
	validateMediaFile,
} from './validation'
