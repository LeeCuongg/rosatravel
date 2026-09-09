import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Eyebrow } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import type { HomeContent } from '@/lib/content'

/**
 * HERO — tiêu đề serif khổ lớn trên nền kem, bên dưới là MỘT ảnh lớn tràn ngang.
 *
 * Bản trước xếp chín, mười ảnh thành một mảng lệch nhau. Ý đồ là "nhiều chuyến
 * đi có thật", nhưng kết quả trông như xếp bừa: các ô chênh tỉ lệ khung hình nên
 * để lại những mảng trắng hình chữ nhật ngay giữa mảng, và không tấm nào đủ lớn
 * để nhìn ra thứ gì. Một ảnh lớn nói ít điều hơn nhưng nói rõ ràng — và ở vị trí
 * đầu trang thì rõ ràng quan trọng hơn.
 *
 * ẢNH KHÔNG bọc trong <Reveal>. Đây là phần tử LCP của trang chủ; bọc reveal là
 * cho nó khởi điểm opacity 0 và tự tay đẩy lùi mốc LCP đúng bằng thời lượng
 * animation. Tiêu đề và CTA thì vẫn reveal bình thường vì chúng nhẹ.
 *
 * ĐÃ GỠ TỪ GĐ1/GĐ2: cơ chế pin + tua video theo vị trí cuộn (GSAP ScrollTrigger)
 * của hero cũ. Kiểu dữ liệu `VideoAsset` trong schema KHÔNG bị gỡ — pipeline
 * video vẫn còn nguyên đường đi, chỉ là hero trang chủ không còn tiêu thụ nó.
 */
export function HeroEditorial({
  hero,
  locale,
}: {
  hero: HomeContent['hero']
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('cta')
  // Hero nhận cả ảnh lẫn video; là video thì lấy poster làm ảnh tĩnh.
  const anh = 'kind' in hero.media ? hero.media.poster : hero.media

  return (
    // `mb-section` chứ không `pb-section`: lề dưới của hero phải GỘP được với
    // lề trên của khối kế tiếp (xem Frame.tsx). Để là đệm thì hero tự tạo một
    // khoảng 250px với khối dưới trong khi mọi khối khác cách nhau 125px.
    <section className="pt-16 mb-section text-center sm:pt-24">
      <div className="px-gutter">
        <Reveal>
          <h1 className="font-display text-clay-500 mx-auto max-w-5xl text-d2 sm:text-d1">
            {hero.headline[locale] ?? hero.headline.vi}
          </h1>
          <p className="font-display mx-auto mt-6 max-w-xl text-d4 text-sand-200">
            {hero.subline[locale] ?? hero.subline.vi}
          </p>
        </Reveal>
      </div>

      {/* Tràn hết bề ngang, không lề — nằm NGOÀI khối px-gutter phía trên. Đây là
          một trong hai chỗ duy nhất trên site có ảnh tràn mép (chỗ kia là đầu
          bài "Chuyến đã đi"); chính sự hiếm hoi đó làm nó có sức nặng.

          Dọc trên điện thoại, ngang trên máy tính: tỉ lệ 16/9 ép xuống màn hình
          390px chỉ còn một dải cao 220px, không đủ để thấy gì. */}
      <div className="relative mt-14 aspect-[4/5] w-full overflow-hidden sm:mt-20 sm:aspect-[16/9]">
        <Media
          media={anh}
          locale={locale}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="px-gutter">
        <Reveal>
          <div className="mt-16 sm:mt-20">
            <Eyebrow>{t('heroKicker')}</Eyebrow>
            <div className="mt-4">
              <TextLink href="/lien-he" size="lg">
                {t('planTrip')}
              </TextLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
