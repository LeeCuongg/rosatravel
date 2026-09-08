import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { ImageAsset } from '@/lib/content'

export function Gallery({ images, locale }: { images: ImageAsset[]; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')

  return (
    <Frame label={t('gallery')} bodyClassName="p-6 sm:p-10">
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          // index % 3 chặn trần độ trễ ở 2 × stagger dù gallery có bao nhiêu ảnh, để ảnh
          // cuối không phải chờ hết một chuỗi stagger dài. Lưu ý: CSS columns lấp đầy cột
          // một từ trên xuống rồi mới tràn sang cột hai, KHÔNG chia vòng tròn như lưới.
          // key theo index: danh sách cố định, không sắp xếp lại — image.src
          // không đảm bảo duy nhất (một ảnh có thể lặp lại trong gallery).
          <Reveal key={index} delay={(index % 3) * stagger} className="mb-4 break-inside-avoid">
            <Media
              media={image}
              locale={locale}
              // Khung tối đa max-w-med (1200px) trừ đệm 80px, 3 cột + gap-4 =>
              // mỗi cột dừng ở ~340px. Để 33vw thì trên màn hình rộng trình
              // duyệt sẽ đòi biến thể to hơn thật cần và tải phí.
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
              className="w-full"
            />
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
