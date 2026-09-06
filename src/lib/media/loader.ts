export const MEDIA_WIDTHS = [640, 1024, 1600, 2400] as const

const VARIANT_SUFFIX = new RegExp(`-(${MEDIA_WIDTHS.join('|')})\\.[a-z0-9]+$`, 'i')

interface LoaderArgs {
  src: string
  width: number
  quality?: number
}

/**
 * Custom loader cho next/image.
 *
 * Ảnh đã được sinh sẵn nhiều kích thước lúc build (scripts/build-media.ts), nên
 * loader chỉ việc ánh xạ bề rộng yêu cầu sang tên file có sẵn. Vercel không phải
 * biến đổi ảnh nào, chi phí image optimization bằng không.
 */
export default function mediaLoader({ src, width }: LoaderArgs): string {
  if (/^https?:\/\//.test(src)) return src
  if (VARIANT_SUFFIX.test(src)) return src

  const target = MEDIA_WIDTHS.find((w) => w >= width) ?? MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1]

  const lastDot = src.lastIndexOf('.')
  if (lastDot === -1 || lastDot < src.lastIndexOf('/')) return src

  return `${src.slice(0, lastDot)}-${target}${src.slice(lastDot)}`
}
