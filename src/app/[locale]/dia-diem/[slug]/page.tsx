import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getLocation, getLocationSlugs, getLocations } from '@/lib/content'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Eyebrow, Frame, Rule } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import { LocationCard } from '@/components/location/LocationCard'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Trang chi tiết một ĐỊA ĐIỂM.
 *
 * Bố cục theo đúng trang location của spotstravel.co: dải ảnh tràn ngang ở
 * trên, tên ở giữa trên nền kem, rồi các hàng thông tin (địa chỉ, website)
 * ngăn bằng kẻ nét đứt, rồi bài viết trong cột hẹp.
 *
 * Đây là tài sản SEO dài hạn của site: một người tìm tên riêng của quán sẽ
 * thấy trang này, chứ không thấy trang tour — và từ đây họ đi tiếp vào tour.
 */

type Params = Promise<{ locale: Locale; slug: string }>

/** Ba ảnh là vừa một dải ngang; nhiều hơn thì mỗi tấm quá hẹp. */
const SO_ANH_DAI = 3

/**
 * Số cột của dải ảnh bám theo số ảnh THẬT. Cố định 3 cột rồi để trống hai ô
 * khi địa điểm chỉ có một ảnh sẽ tạo hai khoảng trắng ngay giữa dải.
 *
 * Phải là bảng tra với chuỗi class viết đầy đủ. Ghép chuỗi kiểu
 * `grid-cols-${n}` thì Tailwind không quét thấy lúc build và class đó đơn giản
 * là không tồn tại trong CSS — lỗi chỉ lộ ra khi nhìn bằng mắt.
 */
const DAI_ANH = {
  1: { grid: 'grid-cols-1', sizes: '100vw' },
  2: { grid: 'grid-cols-2', sizes: '50vw' },
  3: { grid: 'grid-cols-3', sizes: '33vw' },
} as const

export async function generateStaticParams() {
  const slugs = await getLocationSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const location = await getLocation(slug)
  if (!location) return {}

  const title = location.seo.title[locale] ?? location.seo.title.vi
  const description = location.seo.description[locale] ?? location.seo.description.vi

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: location.seo.ogImage.src, width: 1200, height: 630 }],
      type: 'article',
    },
  }
}

export default async function LocationPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('location')
  const ts = await getTranslations('sections')

  const [location, all] = await Promise.all([getLocation(slug), getLocations()])
  if (!location) notFound()

  const anh = location.images.slice(0, SO_ANH_DAI)
  const daiAnh = DAI_ANH[anh.length as 1 | 2 | 3]
  // Gợi ý theo CÙNG LOẠI trước; loại khác chỉ dùng để lấp cho đủ ba thẻ. Gợi ý
  // một homestay ngay dưới một quán ăn thì đúng về mặt "cũng là địa điểm"
  // nhưng vô ích với người đang tìm chỗ ăn.
  const cungLoai = all.filter((l) => l.slug !== location.slug && l.category === location.category)
  const conLai = all.filter((l) => l.slug !== location.slug && l.category !== location.category)
  const goiY = [...cungLoai, ...conLai].slice(0, 3)

  const hangThongTin = [
    ...(location.address ? [{ nhan: t('address'), gia: location.address }] : []),
    ...(location.website ? [{ nhan: t('website'), gia: location.website, laLink: true }] : []),
  ]

  return (
    <main>
      <div className={`grid ${daiAnh.grid}`}>
        {anh.map((image, index) => (
          <div key={image.src} className="relative aspect-[3/4] sm:aspect-[4/5]">
            <Media
              media={image}
              locale={locale}
              fill
              // Ảnh đầu là LCP của trang địa điểm.
              priority={index === 0}
              sizes={daiAnh.sizes}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="px-gutter mt-section text-center">
        <Eyebrow>{t(`category.${location.category}`)}</Eyebrow>
        <h1 className="font-display text-clay-500 mx-auto mt-6 max-w-3xl text-d2 sm:text-d1">
          {location.name[locale] ?? location.name.vi}
        </h1>
      </div>

      {hangThongTin.length > 0 && (
        <dl className="mx-auto mt-14 max-w-sml px-gutter">
          {hangThongTin.map((hang) => (
            <div key={hang.nhan}>
              <Rule />
              <div className="flex gap-6 py-5">
                <dt className="w-1/3 shrink-0 text-label uppercase text-ink-500">{hang.nhan}</dt>
                <dd className="min-w-0 text-meta">
                  {hang.laLink ? (
                    <TextLink href={hang.gia} size="sm">
                      {hang.gia}
                    </TextLink>
                  ) : (
                    hang.gia
                  )}
                </dd>
              </div>
            </div>
          ))}
          <Rule />
        </dl>
      )}

      <section className="mx-auto max-w-sml px-gutter my-section">
        <Reveal>
          <div className="space-y-5">
            {/* key theo index: mảng đoạn văn cố định, hai đoạn trùng chữ vẫn là
                hai đoạn riêng. */}
            {location.body.map((doan, index) => (
              <p key={index} className="text-body text-sand-200">
                {doan[locale] ?? doan.vi}
              </p>
            ))}
          </div>
        </Reveal>
      </section>

      {goiY.length > 0 && (
        <Frame label={ts('otherLocations')} width="sml" bodyClassName="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {goiY.map((item) => (
              // nganKeo={false}: trang này KHÔNG gắn <LocationDrawer>, nên
              // đổi tham số URL sẽ chẳng mở ra gì. Ở đây điều hướng thẳng mới
              // là hành vi đúng.
              <LocationCard key={item.slug} location={item} locale={locale} nganKeo={false} />
            ))}
          </div>
        </Frame>
      )}
    </main>
  )
}
