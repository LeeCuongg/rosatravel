import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import type { ImageAsset } from '@/lib/content'

export function Gallery({ images, locale }: { images: ImageAsset[]; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')

  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
        {t('gallery')}
      </h2>
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          // index % 3 chặn trần độ trễ ở 2 × stagger dù gallery có bao nhiêu ảnh, để ảnh
          // cuối không phải chờ hết một chuỗi stagger dài. Lưu ý: CSS columns lấp đầy cột
          // một từ trên xuống rồi mới tràn sang cột hai, KHÔNG chia vòng tròn như lưới.
          <Reveal key={image.src} delay={(index % 3) * stagger} className="mb-4 break-inside-avoid">
            <Media
              media={image}
              locale={locale}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full rounded-lg"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
