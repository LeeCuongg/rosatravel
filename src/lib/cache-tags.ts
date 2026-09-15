/**
 * Tên tag cache dùng chung giữa hàm đọc dữ liệu (giai đoạn 3) và hook làm mới
 * trong Payload. Đổi tên ở đây là đổi cả hai phía.
 */
export const tags = {
  tours: 'tours',
  tour: (slug: string) => `tour:${slug}`,
  destinations: 'destinations',
  destination: (slug: string) => `destination:${slug}`,
  categories: 'tour-categories',
  category: (slug: string) => `tour-category:${slug}`,
  posts: 'posts',
  post: (slug: string) => `post:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  reviews: 'reviews',
  banners: 'banners',
  clients: 'clients',
  global: (slug: string) => `global:${slug}`,
} as const
