/**
 * INTERFACE CÔNG KHAI CỦA CONTENT LAYER.
 *
 * Đây là chỗ DUY NHẤT component được phép import nội dung. Không component nào
 * được import từ './cms' hay gọi Payload trực tiếp.
 *
 * Nội dung đọc từ Payload qua Local API ('./cms.ts'). GĐ1 đọc từ file JSON
 * trong content/; đổi nguồn dữ liệu chỉ tốn đúng dòng import dưới đây — không
 * một file nào trong src/components phải sửa.
 */
import { readHomeContent, readTour, readTours, readTourSlugs } from './cms'
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
