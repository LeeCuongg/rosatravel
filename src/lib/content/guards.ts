import type { MediaAsset, VideoAsset } from './schema'

/** Phân biệt ảnh với video ở phía component mà không cần ép kiểu. */
export function isVideoAsset(media: MediaAsset): media is VideoAsset {
  return 'kind' in media && media.kind === 'video'
}
