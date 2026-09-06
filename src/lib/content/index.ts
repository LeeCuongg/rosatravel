/**
 * INTERFACE CÔNG KHAI CỦA CONTENT LAYER.
 *
 * Đây là chỗ DUY NHẤT component được phép import nội dung. Không component nào
 * được import từ './fs' hay đọc file trực tiếp.
 *
 * GĐ2 (cắm CMS): viết './cms.ts' với cùng bốn hàm dưới đây, rồi đổi các dòng
 * re-export. Không một file nào trong src/components phải sửa.
 */
import { readHomeContent, readTour, readTours, readTourSlugs } from './fs'
import type { HomeContent, Tour } from './schema'

export async function getTours(): Promise<Tour[]> {
  return readTours()
}

export async function getTour(slug: string): Promise<Tour | null> {
  return readTour(slug)
}

export async function getTourSlugs(): Promise<string[]> {
  return readTourSlugs()
}

export async function getHomeContent(): Promise<HomeContent> {
  return readHomeContent()
}

export { isVideoAsset } from './guards'
export type {
  HomeContent,
  ImageAsset,
  ItineraryDay,
  LocalizedText,
  MediaAsset,
  Testimonial,
  Tour,
  VideoAsset,
} from './schema'
