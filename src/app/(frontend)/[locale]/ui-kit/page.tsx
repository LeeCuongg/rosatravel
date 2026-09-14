import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { FloatingContact } from '@/components/layout/FloatingContact'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { TourCard } from '@/components/tour/TourCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Carousel } from '@/components/ui/Carousel'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { Price } from '@/components/ui/Price'
import { Rating } from '@/components/ui/Rating'
import { SectionHeader } from '@/components/ui/SectionHeader'

import { demoContact, demoFooterColumns, demoNav, demoTours } from './demo-data'

/*
 * Trang nội bộ để xem mọi component và trạng thái của chúng. Chữ trên trang
 * này là nhãn cho dev, không phải nội dung khách xem, nên được phép viết thẳng.
 * Tắt hẳn trên production.
 */

export const metadata: Metadata = {
  title: 'UI kit',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function UiKitPage({ params }: Props) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header items={demoNav} contact={demoContact} bookingHref="/lien-he" />

      <main className="space-y-16 py-12">
        <Container className="space-y-2">
          <h1 className="font-display text-display-md font-semibold">UI kit</h1>
          <p className="text-body-md text-body">
            Hover menu &quot;Tour trong nước&quot; để xem mega menu. Thu hẹp cửa sổ dưới 1024px để xem menu mobile và
            thanh liên hệ đáy.
          </p>
        </Container>

        <KitSection title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="text">Text</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
          </div>
        </KitSection>

        <KitSection title="Chip · Badge">
          <div className="flex flex-wrap items-center gap-3">
            <Chip>Chip</Chip>
            <Chip active>Chip active</Chip>
            <Chip href="/danh-muc/mua-thu">Chip link</Chip>
            <Badge tone="primary">HOT</Badge>
            <Badge tone="ink">Mới</Badge>
            <Badge>Còn 5 chỗ</Badge>
          </div>
        </KitSection>

        <KitSection title="Input">
          <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
            <Input placeholder="Bình thường" aria-label="Input bình thường" />
            <Input placeholder="Lỗi" aria-label="Input lỗi" invalid />
            <Input placeholder="Vô hiệu" aria-label="Input vô hiệu" disabled />
          </div>
        </KitSection>

        <KitSection title="Price · Rating">
          <div className="flex flex-wrap items-end gap-10">
            <Price price={3180000} originalPrice={3490000} />
            <Price price={15990000} size="lg" />
            <Price price={2190000} showFrom className="items-start" />
            <Rating average={4.9} count={128} bookedCount={540} />
          </div>
        </KitSection>

        <section className="space-y-6">
          <Container>
            <SectionHeader
              eyebrow="Section header"
              title="TourCard trong Carousel"
              description="Desktop có nút mũi tên, mobile vuốt ngang."
              action={{ href: '/danh-muc/trong-nuoc' }}
            />
          </Container>
          <Container>
            <Carousel label="Tour mẫu">
              {demoTours.map((tour, index) => (
                <TourCard key={tour.id} tour={tour} preload={index === 0} />
              ))}
            </Carousel>
          </Container>
        </section>

        <KitSection title="TourCard dạng lưới">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {demoTours.slice(0, 4).map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </KitSection>
      </main>

      <Footer
        columns={demoFooterColumns}
        contact={demoContact}
        about="Mô tả ngắn về công ty (nhập trong admin)."
        legalLines={['Giấy phép kinh doanh: nhập trong admin']}
        copyright="© 2026 Rosa Travel"
      />
      <FloatingContact contact={demoContact} bookingHref="/lien-he" />
    </>
  )
}

function KitSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="space-y-4">
      <h2 className="font-display text-caption font-medium tracking-[1px] text-body uppercase">{title}</h2>
      {children}
    </Container>
  )
}
