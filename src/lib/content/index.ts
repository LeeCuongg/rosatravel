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
import {
  readCaseStudies,
  readCaseStudy,
  readCaseStudySlugs,
  readHomeContent,
  readLocation,
  readLocationSlugs,
  readLocations,
  readTour,
  readTours,
  readTourSlugs,
} from './cms'
import type { CaseStudy, HomeContent, Location, Tour } from './schema'

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

export async function getLocations(): Promise<Location[]> {
  return readLocations()
}

export async function getLocation(slug: string): Promise<Location | null> {
  return readLocation(slug)
}

export async function getLocationSlugs(): Promise<string[]> {
  return readLocationSlugs()
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  return readCaseStudies()
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  return readCaseStudy(slug)
}

export async function getCaseStudySlugs(): Promise<string[]> {
  return readCaseStudySlugs()
}

export { isVideoAsset } from './guards'
export type {
  Accent,
  CaseDay,
  CaseStudy,
  FaqItem,
  Guide,
  HomeContent,
  ImageAsset,
  ItineraryDay,
  LocalizedText,
  Location,
  MediaAsset,
  Testimonial,
  Tour,
  VideoAsset,
} from './schema'
