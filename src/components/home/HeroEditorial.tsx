import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Eyebrow } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import { stagger } from '@/lib/motion/tokens'
import type { ImageAsset, HomeContent } from '@/lib/content'

/**
 * HERO — tiêu đề serif khổ lớn trên nền kem, bên dưới là một mảng ảnh xếp lệch.
 *
 * Thay cho hero ảnh tràn màn hình của GĐ1/GĐ2. Lý do đổi không phải thẩm mỹ
 * thuần tuý: một ảnh phủ kín màn hình nói được đúng MỘT điều, và người xem
 * phải cuộn hết một màn hình mới biết đây là hãng gì, bán gì. Mảng ảnh nói
 * ngay rằng đây là nhiều hành trình đã đi thật, và vẫn để tiêu đề đứng trên
 * nền sạch nên đọc được ngay từ dòng đầu.
 *
 * ĐÃ GỠ CÙNG LÚC: cơ chế pin + tua video theo vị trí cuộn (GSAP ScrollTrigger)
 * của hero cũ. Nó chỉ có ý nghĩa với hero ảnh/video tràn màn hình. Kiểu dữ
 * liệu `VideoAsset` trong schema KHÔNG bị gỡ — pipeline video (Task 12) vẫn
 * còn nguyên đường đi, chỉ là hero trang chủ không còn là nơi tiêu thụ nó.
 */

/**
 * Ảnh nào vào mảng: ảnh nền trang chủ trước, rồi tới các điểm đến của mục
 * Hành trình. KHÔNG thêm trường mới vào CMS cho việc này — mảng ảnh phải luôn
 * đầy ngay cả với dữ liệu đang có, và người nhập liệu không nên phải đi chọn
 * thêm chín tấm ảnh nữa chỉ để trang chủ không thủng một lỗ.
 *
 * Lọc trùng theo `src`: cùng một ảnh xuất hiện hai lần trong mảng nhìn ra ngay
 * và làm hỏng ảo giác "đây là chín chuyến đi khác nhau".
 */
export function gomAnhCollage(
  hero: HomeContent['hero']['media'],
  stops: HomeContent['journey']['stops'],
  themVao: ImageAsset[],
): ImageAsset[] {
  const nguon: ImageAsset[] = [
    ...('kind' in hero ? [hero.poster] : [hero]),
    ...stops.map((s) => s.image),
    ...themVao,
  ]
  const daThay = new Set<string>()
  return nguon.filter((anh) => {
    if (daThay.has(anh.src)) return false
    daThay.add(anh.src)
    return true
  })
}

/**
 * Nhịp xếp lệch của mảng ảnh. Cố định, không ngẫu nhiên — ngẫu nhiên thì server
 * và client render ra hai bố cục khác nhau và React báo lỗi hydrate.
 *
 * `dy` là độ dịch xuống theo % chiều cao CỦA CHÍNH Ô ẢNH đó, `scale` phóng to
 * để các ô đè lên nhau. Dùng transform chứ không dùng margin âm: transform
 * không tham gia vào bố cục, nên dù đổi số thế nào lưới cũng không bao giờ
 * vỡ hay tràn ngang. Cái giá phải trả là ảnh có thể tràn ra mép — đã bù bằng
 * `px-[7%]` ở khung ngoài.
 *
 * Tỉ lệ khung ảnh phải viết thành chuỗi class đầy đủ (không ghép chuỗi) thì
 * Tailwind mới quét thấy lúc build.
 */
const NHIP = [
  { dy: 14, scale: 1.06, aspect: 'aspect-[4/5]' },
  { dy: -2, scale: 1.14, aspect: 'aspect-[5/4]' },
  { dy: 9, scale: 1.02, aspect: 'aspect-[3/4]' },
  { dy: 3, scale: 1.1, aspect: 'aspect-[4/3]' },
  { dy: 17, scale: 1.05, aspect: 'aspect-[4/5]' },
  { dy: 6, scale: 1.12, aspect: 'aspect-[5/4]' },
  { dy: 24, scale: 1.04, aspect: 'aspect-[3/4]' },
  { dy: 11, scale: 1.09, aspect: 'aspect-[4/3]' },
  { dy: 20, scale: 1.03, aspect: 'aspect-[4/5]' },
  { dy: 5, scale: 1.11, aspect: 'aspect-[5/4]' },
] as const

/** Nhiều hơn 10 ảnh thì mảng rối và mỗi ảnh bé đến mức không nhận ra gì. */
const TOI_DA = 10

export function HeroEditorial({
  hero,
  images,
  locale,
}: {
  hero: HomeContent['hero']
  images: ImageAsset[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('cta')
  const anh = images.slice(0, TOI_DA)

  return (
    <section className="px-gutter pt-16 pb-section text-center sm:pt-24">
      <Reveal>
        <h1 className="font-display text-clay-500 mx-auto max-w-5xl text-d2 sm:text-d1">
          {hero.headline[locale] ?? hero.headline.vi}
        </h1>
        <p className="font-display mx-auto mt-6 max-w-xl text-d4 text-sand-200">
          {hero.subline[locale] ?? hero.subline.vi}
        </p>
      </Reveal>

      {anh.length > 0 && (
        <div className="mx-auto mt-16 max-w-lge px-[7%] sm:mt-24">
          <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-5 sm:gap-x-3">
            {anh.map((image, index) => {
              const nhip = NHIP[index % NHIP.length]
              return (
                <Reveal key={image.src} delay={index * stagger}>
                  <div
                    className={`relative ${nhip.aspect} overflow-hidden`}
                    style={{
                      transform: `translateY(${nhip.dy}%) scale(${nhip.scale})`,
                      // Ô sau đè lên ô trước, tạo cảm giác xếp chồng có chiều sâu.
                      zIndex: index,
                    }}
                  >
                    <Media
                      media={image}
                      locale={locale}
                      fill
                      // Ba ảnh đầu nằm trên nếp gấp trên gần như mọi màn hình.
                      priority={index < 3}
                      // Lưới tối đa 1800px, 5 cột => mỗi ô ~340px; nhân thêm
                      // scale tối đa 1.14 là ~390px. Để 20vw thì màn hình 2560px
                      // sẽ đòi 512px và tải phí ở cả mười ảnh.
                      sizes="(max-width: 640px) 33vw, 390px"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      )}

      {/* mt lớn ở đây là bù cho phần ảnh bị đẩy xuống bởi transform (dy tối đa
          24% của một ô ~aspect 4/5). Không có nó, dòng CTA chui vào gầm ảnh. */}
      <Reveal>
        <div className="mt-28 sm:mt-36">
          <Eyebrow>{t('heroKicker')}</Eyebrow>
          <div className="mt-4">
            <TextLink href="/lien-he" size="lg">
              {t('planTrip')}
            </TextLink>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
