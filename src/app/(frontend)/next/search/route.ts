import { NextResponse, type NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'
import { searchTours } from '@/lib/data/queries'
import { toSearchQuery } from '@/lib/search'

export type SearchSuggestion = {
  slug: string
  title: string
  price: number
  image: string
  durationDays: number
  durationNights: number
}

/** Gợi ý tour cho ô tìm kiếm (tối đa 6). Chỉ trả tour đã xuất bản. */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const query = toSearchQuery(searchParams.get('q'))
  const requestedLocale = searchParams.get('locale')
  const locale = routing.locales.find((code) => code === requestedLocale) ?? routing.defaultLocale

  if (!query) {
    return NextResponse.json({ tours: [], total: 0 })
  }

  const { tours, totalDocs } = await searchTours(query, { limit: 6 }, locale)
  const suggestions: SearchSuggestion[] = tours.map((tour) => ({
    slug: tour.slug,
    title: tour.title,
    price: tour.price,
    image: tour.coverImage.url,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
  }))

  return NextResponse.json(
    { tours: suggestions, total: totalDocs },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  )
}
