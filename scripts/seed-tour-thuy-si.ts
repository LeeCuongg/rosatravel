/**
 * TOUR KIỂM THỬ: "Dãy Alps Thuỵ Sĩ", dựng theo bài The Swiss Alps của
 * spotstravel.co (?m=couples-getaway&t=case).
 *
 * Chạy:   npx payload run scripts/seed-tour-thuy-si.ts
 * Gỡ ra:  GO=1 npx payload run scripts/seed-tour-thuy-si.ts
 *         (PowerShell: $env:GO='1'; npx payload run scripts/seed-tour-thuy-si.ts)
 *
 * Dùng biến môi trường chứ không phải cờ dòng lệnh: `payload run` nuốt sạch mọi
 * tham số phía sau tên tệp — cùng lý do đã ghi ở scripts/seed-case-nyc.ts.
 *
 * BỐN ĐIỀU PHẢI BIẾT:
 *
 * 1. GIÁ LÀ SỐ BỊA. Bài gốc của Spots KHÔNG có giá — nó là một case study, tức
 *    là bằng chứng năng lực, không phải sản phẩm đang bán. Mô hình Tour của
 *    mình thì bắt buộc có `priceFrom`, nên con số dưới đây do máy đặt ra để
 *    bản ghi hợp lệ. Phải thay trước khi phát hành.
 *
 * 2. BẢY NGÀY, BỐN CHẶNG. Bài gốc kể theo bốn chặng (Basel, Zurich, Lucerne,
 *    Grindelwald) nhưng nói rõ là "seven-day itinerary". `tourSchema` bắt buộc
 *    số ngày phải khớp độ dài lịch trình, nên bốn chặng đó được trải ra thành
 *    bảy ngày đúng theo trình tự có trong bài — không thêm hoạt động nào không
 *    có trong bản gốc.
 *
 * 3. ẢNH LÀ ẢNH HÀ GIANG MƯỢN TẠM. Thư viện ảnh không có ảnh Thuỵ Sĩ, và
 *    script này cố tình không tải ảnh mới lên Blob.
 *
 * 4. TRANG CHỦ SẼ CÓ 7 TOUR. Lưới chia ba cột nên hàng cuối còn lẻ đúng một
 *    thẻ. Đó là lý do có nhánh gỡ.
 *
 * Khách sạn gắn vào ĐÊM ngủ ở đó, không gom thành một khối riêng — Tour khác
 * Chuyến đã đi ở chỗ này: lịch trình tour có thứ tự thời gian rõ ràng nên chỗ
 * ở thuộc về một ngày cụ thể.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const GO_RA = process.env.GO === '1'

const SLUG_TOUR = 'day-alps-thuy-si'

/** BỊA — xem ghi chú 1 ở đầu file. Thay bằng giá thật trước khi phát hành. */
const GIA_TAM = 89_000_000

const vi = (s: string) => ({ vi: s })

// ── Tra ảnh theo tên tệp ─────────────────────────────────────────────────────

const anhTheoTen = new Map<string, string>()
{
  const { docs } = await payload.find({ collection: 'media', depth: 0, limit: 500 })
  for (const doc of docs) anhTheoTen.set(String(doc.filename), String(doc.id))
}

function anh(tenTep: string): string {
  const id = anhTheoTen.get(tenTep)
  if (!id) throw new Error(`Không tìm thấy ảnh "${tenTep}".`)
  return id
}

// ── ĐỊA ĐIỂM ─────────────────────────────────────────────────────────────────

interface DiaDiemMau {
  slug: string
  name: string
  category: 'an-uong' | 'luu-tru' | 'thien-nhien' | 'van-hoa' | 'cho-mua-sam'
  city: string
  excerpt: string
  body: string[]
  address?: string
  images: string[]
}

const DIA_DIEM: DiaDiemMau[] = [
  {
    slug: 'ackermannshof',
    name: 'Ackermannshof',
    category: 'an-uong',
    city: 'Basel',
    excerpt: 'Nhà hàng sao Michelin trong một xưởng in cũ ở khu St. Johanns-Vorstadt.',
    body: [
      'Toà nhà nguyên là một xưởng in cổ, được phục dựng chứ không làm mới — dầm gỗ và tường gạch giữ nguyên, chỉ thay phần bếp.',
      'Bếp trưởng Flavio Fermi người Thuỵ Sĩ gốc Ý nấu theo hướng Địa Trung Hải hiện đại, và thực đơn đọc ra rõ gốc gác đó. Đặt bàn trước là bắt buộc.',
    ],
    address: 'St. Johanns-Vorstadt, Basel',
    images: ['dong-van.jpg'],
  },
  {
    slug: 'brasserie-volkhaus',
    name: 'Brasserie Volkhaus',
    category: 'an-uong',
    city: 'Basel',
    excerpt: 'Quán brasserie trong toà Volkshaus, nội thất do Herzog & de Meuron làm lại.',
    body: [
      'Không gian cao, đèn đồng, ghế da xanh sẫm — bản cải tạo của Herzog & de Meuron giữ lại dáng một hội quán công nhân đầu thế kỷ 20 thay vì biến nó thành nhà hàng khách sạn.',
      'Món ăn là brasserie kiểu Thuỵ Sĩ - Pháp, phần ăn lớn, phục vụ tới khuya. Chỗ hợp cho bữa đầu tiên khi vừa xuống tàu.',
    ],
    address: 'Rebgasse 12-14, Basel',
    images: ['meo-vac.jpg'],
  },
  {
    slug: 'coucou-zurich',
    name: 'Coucou',
    category: 'an-uong',
    city: 'Zurich',
    excerpt: 'Quán cà phê ở Kreis 5, nắng xuyên cửa và khách quen ngồi cả buổi.',
    body: [
      'Nằm giữa Kreis 5 — khu công nghiệp cũ của Zurich giờ thành chỗ tụ của dân thiết kế. Màu sắc tươi, cửa kính lớn, và cảm giác của một quán khu phố chứ không phải điểm du lịch.',
      'Ăn sáng muộn ở đây rồi đi bộ dọc sông Limmat là cách mở đầu một ngày ở Zurich mà không cần lịch trình.',
    ],
    images: ['quan-ba.jpg'],
  },
  {
    slug: 'volkhaus-basel',
    name: 'Volkhaus Basel',
    category: 'luu-tru',
    city: 'Basel',
    excerpt: 'Khách sạn trong cùng toà Volkshaus, đi bộ ra bảo tàng.',
    body: [
      'Phòng ít, thiết kế tiết chế, và nằm chung toà với brasserie phía dưới — xuống ăn sáng không phải ra khỏi nhà.',
      'Vị trí hợp cho những ngày dồn bảo tàng: Fondation Beyeler và Vitra đều đi trong ngày được từ đây.',
    ],
    address: 'Rebgasse 12-14, Basel',
    images: ['yen-minh.jpg'],
  },
  {
    slug: 'burgenstock-resort',
    name: 'Bürgenstock Resort',
    category: 'luu-tru',
    city: 'Obbürgen',
    excerpt: 'Khu nghỉ trên vách núi nhìn xuống hồ Lucerne, có đường sắt leo núi riêng.',
    body: [
      'Đường vào là một cảnh phim: thuyền băng qua hồ Lucerne, rồi một tuyến funicular riêng kéo thẳng khách lên khuôn viên trên vách núi.',
      'Alpine Spa là lý do phần lớn người ta tới — bể bơi vô cực treo trên mặt hồ, phòng xông hơi nhìn ra toàn cảnh dãy núi. Đây là chặng để nghỉ, không phải để đi.',
    ],
    address: 'Obbürgen, Lucerne',
    images: ['song-nho-que.jpg'],
  },
  {
    slug: 'bergwelt-grindelwald',
    name: 'Bergwelt Grindelwald',
    category: 'luu-tru',
    city: 'Grindelwald',
    excerpt: 'Khách sạn nhìn thẳng vách bắc Eiger, ngay trong thị trấn.',
    body: [
      'Phòng quay mặt về phía Eiger, và vách núi đó chiếm trọn khung cửa sổ — thứ khó tìm được ở những khách sạn nằm sâu trong thung lũng.',
      'Đi bộ ra ga Grindelwald và các tuyến cáp treo, nên ngày leo núi không phải dậy sớm để di chuyển.',
    ],
    address: 'Grindelwald, Bern',
    images: ['tour-ma-pi-leng.jpg'],
  },
]

// ── LỊCH TRÌNH: bốn chặng của bài gốc, trải thành bảy ngày ───────────────────

interface NgayMau {
  title: string
  description: string
  images?: string[]
  locationsLabel?: string
  locations?: string[]
}

const LICH_TRINH: NgayMau[] = [
  {
    title: 'Tới Basel',
    description:
      'Basel là nơi khai sinh hội chợ Art Basel, và là cửa vào hợp lý nhất của Thuỵ Sĩ cho người đi vì bảo tàng. Ngày đầu chỉ nhận phòng và đi bộ trong khu phố cổ, không xếp lịch gì thêm.',
    images: ['dong-van.jpg'],
    locationsLabel: 'Ăn và ngủ',
    locations: ['brasserie-volkhaus', 'volkhaus-basel'],
  },
  {
    title: 'Basel — một ngày chỉ đi bảo tàng',
    description:
      'Goetheanum, Vitra Design Museum ngay bên kia biên giới Đức, rồi Fondation Beyeler — ba điểm xếp theo thứ tự để quãng di chuyển giữa chúng ngắn nhất có thể. Tối ăn ở Ackermannshof, đặt bàn từ trước.',
    images: ['quan-ba.jpg', 'yen-minh.jpg'],
    locationsLabel: 'Ăn ở đâu',
    locations: ['ackermannshof'],
  },
  {
    title: 'Sang Zurich — hồ Caumasee',
    description:
      'Chuyển sang Zurich rồi đi trong ngày tới Flims. Caumasee là một hồ nước màu ngọc lam nằm lọt giữa rừng thông: bơi được, đi hết vòng quanh hồ được, hoặc chỉ ngồi lại bên nước với một cuốn sách.',
    images: ['song-nho-que.jpg'],
    locationsLabel: 'Ăn ở đâu',
    locations: ['coucou-zurich'],
  },
  {
    title: 'Appenzell và Seealpsee',
    description:
      'Buổi leo núi đầu tiên, chọn tuyến dễ vào chứ không chọn tuyến gây choáng. Ăn trưa kiểu Thuỵ Sĩ ở Appenzell, lên cáp treo Ebenalp, xem hang Wildkirchli và dừng ở quán treo vách đá Aescher, rồi đi bộ xuống hồ Seealpsee.',
    images: ['tour-ma-pi-leng.jpg', 'ruong-bac-thang.jpg'],
  },
  {
    title: 'Lucerne — Bürgenstock',
    description:
      'Thuyền băng qua hồ Lucerne, rồi tuyến funicular riêng kéo thẳng lên khuôn viên trên vách núi. Cả ngày dành cho Alpine Spa: bể bơi vô cực treo trên mặt hồ, phòng xông hơi nhìn ra toàn cảnh núi.',
    images: ['meo-vac.jpg'],
    locationsLabel: 'Ngủ ở đâu',
    locations: ['burgenstock-resort'],
  },
  {
    title: 'Grindelwald — nhìn từ trên cao',
    description:
      'Sau mấy ngày nhìn Thuỵ Sĩ từ mặt đất, đây là ngày nhìn từ trên xuống: nhảy dù trên dãy Alps. Buổi chiều đi bộ lên hồ Oeschinensee.',
    images: ['ruong-bac-thang.jpg'],
    locationsLabel: 'Ngủ ở đâu',
    locations: ['bergwelt-grindelwald'],
  },
  {
    title: 'Lễ hội phố rồi về',
    description:
      'Buổi tối cuối cùng trùng phiên chợ đêm hằng tuần của thị trấn, ăn fondue phô mai ở một quán quen của dân địa phương rồi ra phố cùng họ. Hôm sau rời Grindelwald.',
    images: ['tam-giac-mach.jpg'],
  },
]

const DIEM_DEN = ['Basel', 'Zurich', 'Lucerne', 'Grindelwald']

const BAO_GOM = [
  'Vé tàu liên vùng cho toàn bộ hành trình, đặt sẵn theo giờ',
  'Sáu đêm khách sạn, gồm hai đêm ở khu nghỉ trên hồ Lucerne',
  'Vé vào Goetheanum, Vitra Design Museum và Fondation Beyeler',
  'Cáp treo Ebenalp và người dẫn đường cho ngày leo núi',
  'Đặt bàn trước ở nhà hàng sao Michelin và quán fondue',
]

const KHONG_BAO_GOM = [
  'Vé máy bay quốc tế và phí visa Schengen',
  'Nhảy dù trên dãy Alps (đặt riêng theo yêu cầu, phụ thuộc thời tiết)',
  'Bữa ăn không ghi trong lịch trình',
  'Bảo hiểm du lịch',
]

// ── Thực thi ─────────────────────────────────────────────────────────────────

if (GO_RA) {
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: SLUG_TOUR } },
    depth: 0,
    limit: 1,
  })
  for (const doc of docs) {
    // Gỡ khỏi khối "Hành trình tiêu biểu" TRƯỚC khi xoá tour: bỏ qua bước này
    // thì global `home` còn giữ một id trỏ vào hư không, và mapHome ném lỗi
    // "Tour nổi bật trỏ tới một tour không còn tồn tại" — vỡ nguyên trang chủ.
    const home = (await payload.findGlobal({ slug: 'home', depth: 0 })) as unknown as Record<
      string,
      unknown
    >
    const dangCo = ((home.featuredTours as unknown[]) ?? []).map(String)
    const conLai = dangCo.filter((id) => id !== String(doc.id))
    if (conLai.length !== dangCo.length) {
      await payload.updateGlobal({ slug: 'home', data: { featuredTours: conLai } as never })
      console.log('  đã gỡ khỏi Hành trình tiêu biểu')
    }
    await payload.delete({ collection: 'tours', id: String(doc.id) })
    console.log(`  đã gỡ tour: ${SLUG_TOUR}`)
  }
  for (const mau of DIA_DIEM) {
    const { docs: dd } = await payload.find({
      collection: 'locations',
      where: { slug: { equals: mau.slug } },
      depth: 0,
      limit: 1,
    })
    for (const doc of dd) {
      await payload.delete({ collection: 'locations', id: String(doc.id) })
      console.log(`  đã gỡ địa điểm: ${mau.slug}`)
    }
  }
  console.log('Xong. Trang chủ trở lại sáu tour.')
  process.exit(0)
}

// Địa điểm — chỉ THÊM, không đè lên bản ghi người vận hành đã sửa.
const daCoDiaDiem = new Set<string>()
{
  const { docs } = await payload.find({
    collection: 'locations',
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  for (const doc of docs) daCoDiaDiem.add(String(doc.slug))
}

for (const mau of DIA_DIEM) {
  if (daCoDiaDiem.has(mau.slug)) {
    console.log(`  bỏ qua địa điểm (đã có): ${mau.slug}`)
    continue
  }
  await payload.create({
    collection: 'locations',
    data: {
      slug: mau.slug,
      name: vi(mau.name),
      category: mau.category,
      city: mau.city,
      excerpt: vi(mau.excerpt),
      body: mau.body.map(vi),
      ...(mau.address ? { address: mau.address } : {}),
      images: mau.images.map(anh),
      seo: {
        title: vi(`${mau.name} — ${mau.city}`),
        description: vi(mau.excerpt),
        ogImage: anh(mau.images[0]),
      },
    } as never,
  })
  console.log(`  đã tạo địa điểm: ${mau.slug}`)
}

const idTheoSlug = new Map<string, string>()
{
  const { docs } = await payload.find({ collection: 'locations', depth: 0, limit: 500 })
  for (const doc of docs) idTheoSlug.set(String(doc.slug), String(doc.id))
}

function diaDiem(...slugs: string[]): string[] {
  return slugs.map((s) => {
    const id = idTheoSlug.get(s)
    if (!id) throw new Error(`Không tìm thấy địa điểm "${s}".`)
    return id
  })
}

let idTour: string | null = null
{
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: SLUG_TOUR } },
    depth: 0,
    limit: 1,
  })
  if (docs.length > 0) {
    idTour = String(docs[0].id)
    console.log(`  bỏ qua tour (đã có): ${SLUG_TOUR}`)
  } else {
    const tour = await payload.create({
      collection: 'tours',
      data: {
        slug: SLUG_TOUR,
        title: vi('Dãy Alps Thuỵ Sĩ'),
        tagline: vi('Bảy ngày đi chậm cho hai người'),
        summary: vi(
          'Một cặp đôi muốn tránh mùa hè đông đúc ở Địa Trung Hải, và cần một chuyến gộp được ba thứ: bảo tàng, núi, và nghỉ ngơi thật sự. Bảy ngày qua Basel, Zurich, Lucerne và Grindelwald, xen giữa những buổi không có lịch trình nào cả.',
        ),
        durationDays: LICH_TRINH.length,
        priceFrom: GIA_TAM,
        destinations: DIEM_DEN.map(vi),
        heroMedia: anh('song-nho-que.jpg'),
        gallery: ['song-nho-que.jpg', 'tour-ma-pi-leng.jpg', 'quan-ba.jpg', 'yen-minh.jpg'].map(anh),
        itinerary: LICH_TRINH.map((ngay) => ({
          title: vi(ngay.title),
          description: vi(ngay.description),
          ...(ngay.images ? { images: ngay.images.map(anh) } : {}),
          ...(ngay.locationsLabel ? { locationsLabel: vi(ngay.locationsLabel) } : {}),
          ...(ngay.locations ? { locations: diaDiem(...ngay.locations) } : {}),
        })),
        inclusions: BAO_GOM.map(vi),
        exclusions: KHONG_BAO_GOM.map(vi),
        seo: {
          title: vi('Dãy Alps Thuỵ Sĩ 7 ngày — RosaTravel'),
          description: vi(
            'Bảy ngày qua Basel, Zurich, Lucerne và Grindelwald: bảo tàng, hồ băng, một ngày leo núi và hai đêm nghỉ trên vách hồ Lucerne.',
          ),
          ogImage: anh('song-nho-que.jpg'),
        },
      } as never,
    })
    idTour = String(tour.id)
    console.log(`  đã tạo tour: ${SLUG_TOUR}`)
  }
}

// ── Đưa vào khối "Hành trình tiêu biểu" ─────────────────────────────────────
{
  const home = (await payload.findGlobal({ slug: 'home', depth: 0 })) as unknown as Record<
    string,
    unknown
  >
  const dangCo = ((home.featuredTours as unknown[]) ?? []).map(String)
  if (idTour && !dangCo.includes(idTour)) {
    await payload.updateGlobal({
      slug: 'home',
      data: { featuredTours: [...dangCo, idTour] } as never,
    })
    console.log(`  đã thêm vào Hành trình tiêu biểu (giờ có ${dangCo.length + 1} tour)`)
  } else {
    console.log('  đã có sẵn trong Hành trình tiêu biểu')
  }
}

console.log(`\nXem tại /vi/tour/${SLUG_TOUR}`)
console.log('Gỡ ra:  GO=1 npx payload run scripts/seed-tour-thuy-si.ts')
process.exit(0)
