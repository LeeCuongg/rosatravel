import type { ContactSettings, FooterColumn, NavItem, TourSummary } from '@/types/content'

/*
 * Dữ liệu mẫu CHỈ dùng cho trang /ui-kit (công cụ nội bộ để xem component).
 * Trang thật của site đọc dữ liệu từ Payload, không import file này.
 */

export const demoTours: TourSummary[] = [
  {
    id: 'demo-1',
    slug: 'tour-mau-ha-giang',
    title: 'Tour mẫu Hà Giang 3 ngày 2 đêm: cung đèo và cao nguyên đá',
    coverImage: { url: '/ui-kit/tour-1.jpg', alt: 'Ảnh minh họa dãy núi lúc hoàng hôn' },
    durationDays: 3,
    durationNights: 2,
    departureFrom: 'Hà Nội',
    price: 3180000,
    originalPrice: 3490000,
    rating: { average: 4.9, count: 128 },
    bookedCount: 540,
    badges: ['HOT'],
  },
  {
    id: 'demo-2',
    slug: 'tour-mau-da-nang-hoi-an',
    title: 'Tour mẫu Đà Nẵng – Hội An 4 ngày 3 đêm',
    coverImage: { url: '/ui-kit/tour-2.jpg', alt: 'Ảnh minh họa bờ biển' },
    durationDays: 4,
    durationNights: 3,
    departureFrom: 'TP. Hồ Chí Minh',
    price: 5290000,
    rating: { average: 4.8, count: 86 },
    bookedCount: 310,
  },
  {
    id: 'demo-3',
    slug: 'tour-mau-phu-quoc',
    title: 'Tour mẫu Phú Quốc 3 ngày 2 đêm nghỉ dưỡng biển',
    coverImage: { url: '/ui-kit/tour-3.jpg', alt: 'Ảnh minh họa đồi cát và mặt trời' },
    durationDays: 3,
    durationNights: 2,
    departureFrom: 'Hà Nội',
    price: 4590000,
    originalPrice: 4990000,
    badges: ['Còn 5 chỗ'],
  },
  {
    id: 'demo-4',
    slug: 'tour-mau-han-quoc-mua-thu',
    title: 'Tour mẫu Hàn Quốc 5 ngày 4 đêm mùa thu lá đỏ, tiêu đề dài để kiểm tra việc cắt dòng',
    coverImage: { url: '/ui-kit/tour-4.jpg', alt: 'Ảnh minh họa đồi thu' },
    durationDays: 5,
    durationNights: 4,
    departureFrom: 'Hà Nội',
    price: 15990000,
    originalPrice: 17490000,
    rating: { average: 5, count: 42 },
    bookedCount: 120,
  },
  {
    id: 'demo-5',
    slug: 'tour-mau-sa-pa',
    title: 'Tour mẫu Sa Pa 2 ngày 1 đêm',
    coverImage: { url: '/ui-kit/tour-1.jpg', alt: 'Ảnh minh họa dãy núi' },
    durationDays: 2,
    durationNights: 1,
    departureFrom: 'Hà Nội',
    price: 2190000,
  },
]

export const demoNav: NavItem[] = [
  { label: 'Tour mùa thu', href: '/danh-muc/mua-thu', highlight: true },
  {
    label: 'Tour trong nước',
    href: '/danh-muc/trong-nuoc',
    megaMenu: {
      groups: [
        {
          title: 'Miền Bắc',
          href: '/diem-den/mien-bac',
          links: [
            { label: 'Hà Giang', href: '/diem-den/ha-giang' },
            { label: 'Sa Pa', href: '/diem-den/sa-pa' },
            { label: 'Hạ Long', href: '/diem-den/ha-long' },
          ],
        },
        {
          title: 'Miền Trung',
          href: '/diem-den/mien-trung',
          links: [
            { label: 'Đà Nẵng', href: '/diem-den/da-nang' },
            { label: 'Hội An', href: '/diem-den/hoi-an' },
            { label: 'Huế', href: '/diem-den/hue' },
          ],
        },
        {
          title: 'Miền Nam',
          href: '/diem-den/mien-nam',
          links: [
            { label: 'Phú Quốc', href: '/diem-den/phu-quoc' },
            { label: 'Côn Đảo', href: '/diem-den/con-dao' },
            { label: 'Miền Tây', href: '/diem-den/mien-tay' },
          ],
        },
      ],
      featuredTours: demoTours.slice(0, 2),
    },
  },
  {
    label: 'Tour nước ngoài',
    href: '/danh-muc/nuoc-ngoai',
    megaMenu: {
      groups: [
        {
          title: 'Châu Á',
          links: [
            { label: 'Hàn Quốc', href: '/diem-den/han-quoc' },
            { label: 'Nhật Bản', href: '/diem-den/nhat-ban' },
            { label: 'Trung Quốc', href: '/diem-den/trung-quoc' },
          ],
        },
        {
          title: 'Châu Âu',
          links: [
            { label: 'Pháp', href: '/diem-den/phap' },
            { label: 'Ý', href: '/diem-den/y' },
            { label: 'Thụy Sĩ', href: '/diem-den/thuy-si' },
          ],
        },
        {
          title: 'Châu Úc & Mỹ',
          links: [
            { label: 'Úc', href: '/diem-den/uc' },
            { label: 'Mỹ', href: '/diem-den/my' },
            { label: 'Canada', href: '/diem-den/canada' },
          ],
        },
      ],
      featuredTours: [demoTours[3]],
    },
  },
  { label: 'Cẩm nang', href: '/cam-nang' },
  { label: 'Liên hệ', href: '/lien-he' },
]

export const demoContact: ContactSettings = {
  hotline: '0973122807',
  email: 'lecuongg242@gmail.com',
  zalo: '0973122807',
  messenger: 'https://m.me/',
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  threads: 'https://www.threads.net/',
}

export const demoFooterColumns: FooterColumn[] = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Tour trong nước', href: '/danh-muc/trong-nuoc' },
      { label: 'Tour nước ngoài', href: '/danh-muc/nuoc-ngoai' },
      { label: 'Cẩm nang du lịch', href: '/cam-nang' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Chính sách hủy tour', href: '/chinh-sach/huy-tour' },
      { label: 'Điều khoản sử dụng', href: '/chinh-sach/dieu-khoan' },
      { label: 'Liên hệ', href: '/lien-he' },
    ],
  },
]
