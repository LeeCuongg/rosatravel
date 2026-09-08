/**
 * NỘI DUNG MẪU để dựng và đánh giá giao diện.
 *
 * Chạy: npx payload run scripts/seed-demo.ts
 *
 * Vì sao cần: lưới tour ba cột với đúng một thẻ, mục cảm nhận rỗng và mục
 * hỏi đáp rỗng khiến trang trông như chưa nhập liệu, và không đánh giá được
 * thiết kế. Script này lấp đủ nội dung để nhìn ra bố cục thật.
 *
 * BA QUY TẮC AN TOÀN, đọc trước khi sửa:
 *
 *  1. Chỉ THÊM, không bao giờ ghi đè. Tour đã có slug trùng thì bỏ qua; các
 *     khối của trang chủ chỉ được điền khi đang RỖNG. Chạy lại nhiều lần cho
 *     ra cùng một kết quả và không bao giờ đè lên nội dung thật ai đó đã nhập.
 *  2. Không tải ảnh mới lên. Mọi ảnh đều tra từ Thư viện ảnh có sẵn theo tên
 *     tệp — nghĩa là script không tiêu tốn dung lượng Vercel Blob và không tạo
 *     bản trùng mỗi lần chạy.
 *  3. Nội dung là HÀNG MẪU. Tên tour, giá, lịch trình, lời khách và tiểu sử
 *     người dẫn đường đều do máy viết ra để lấp chỗ. Thay hết bằng nội dung
 *     thật trong /admin trước khi đưa site ra công chúng.
 *
 * Kho ảnh hiện có đều chụp ở Hà Giang, nên mọi tour mẫu cũng đặt ở Hà Giang.
 * Đó là chủ ý: gán ảnh đá tai mèo Đồng Văn cho một tour tên "Phú Quốc" thì
 * trang sẽ trông đầy đặn nhưng đánh giá giao diện dựa trên một ảo ảnh.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// ── Tra ảnh theo tên tệp ─────────────────────────────────────────────────────

const anhTheoTen = new Map<string, string>()
{
  const { docs } = await payload.find({ collection: 'media', depth: 0, limit: 500 })
  for (const doc of docs) anhTheoTen.set(String(doc.filename), String(doc.id))
}

/** Thiếu ảnh thì dừng ngay, đừng tạo tour trỏ vào khoảng không. */
function anh(tenTep: string): string {
  const id = anhTheoTen.get(tenTep)
  if (!id) {
    throw new Error(
      `Không tìm thấy ảnh "${tenTep}" trong Thư viện ảnh.\n` +
        `Đang có: ${[...anhTheoTen.keys()].join(', ')}\n` +
        'Tải ảnh lên trong /admin rồi chạy lại, hoặc sửa tên tệp trong script này.',
    )
  }
  return id
}

const vi = (s: string) => ({ vi: s })

// ── Tour mẫu ─────────────────────────────────────────────────────────────────

interface TourMau {
  slug: string
  title: string
  tagline: string
  summary: string
  durationDays: number
  priceFrom: number
  destinations: string[]
  hero: string
  gallery: string[]
  itinerary: { title: string; description: string; media?: string }[]
  inclusions: string[]
  exclusions: string[]
  seoTitle: string
  seoDescription: string
}

const TOUR_MAU: TourMau[] = [
  {
    slug: 'ha-giang-mua-tam-giac-mach',
    title: 'Hà Giang mùa tam giác mạch',
    tagline: 'Ba ngày đi theo màu hoa nở muộn trên cao nguyên đá',
    summary:
      'Cuối tháng Mười, tam giác mạch nở kín các triền đá từ Quản Bạ lên Đồng Văn. Chuyến này đi chậm, dừng nhiều, và ưu tiên những thửa hoa nằm xa đường lớn nơi không có hàng quán và không phải trả tiền chụp ảnh.',
    durationDays: 3,
    priceFrom: 5400000,
    destinations: ['Quản Bạ', 'Yên Minh', 'Đồng Văn'],
    hero: 'tam-giac-mach.jpg',
    gallery: ['tam-giac-mach.jpg', 'dong-van.jpg', 'quan-ba.jpg'],
    itinerary: [
      {
        title: 'Hà Nội – Quản Bạ',
        description:
          'Rời Hà Nội từ sớm, ăn trưa ở Bắc Quang. Chiều lên cổng trời Quản Bạ, đi bộ một quãng ngắn xuống thung lũng khi nắng đã dịu.',
        media: 'quan-ba.jpg',
      },
      {
        title: 'Quản Bạ – Đồng Văn',
        description:
          'Cả ngày dành cho những thửa tam giác mạch dọc đường lên Đồng Văn. Dừng ở dốc Thẩm Mã và một bản nhỏ của người Mông, ăn trưa cùng chủ nhà.',
        media: 'tam-giac-mach.jpg',
      },
      {
        title: 'Đồng Văn – Hà Nội',
        description:
          'Sáng đi chợ phiên nếu trúng ngày, rồi thong thả về xuôi. Về tới Hà Nội khoảng chín giờ tối.',
        media: 'dong-van.jpg',
      },
    ],
    inclusions: [
      'Xe riêng đưa đón toàn tuyến',
      'Homestay và khách sạn 3 sao, phòng đôi',
      'Hướng dẫn viên người Hà Giang',
      'Bữa sáng, bữa trưa và hai bữa tối',
    ],
    exclusions: ['Vé máy bay tới Hà Nội', 'Chi phí cá nhân', 'Đồ uống có cồn'],
    seoTitle: 'Tour Hà Giang mùa tam giác mạch 3 ngày 2 đêm',
    seoDescription:
      'Ba ngày đi tam giác mạch Hà Giang qua Quản Bạ, Yên Minh, Đồng Văn. Nhóm nhỏ, hướng dẫn viên bản địa.',
  },
  {
    slug: 'cao-nguyen-da-dong-van',
    title: 'Cao nguyên đá Đồng Văn',
    tagline: 'Năm ngày đi hết vòng công viên địa chất toàn cầu',
    summary:
      'Đây là chuyến đi đầy đủ nhất của chúng tôi trên cao nguyên đá: bốn huyện, ba đèo lớn, và đủ thời gian để dừng lại ở những nơi mà tour ba ngày buộc phải đi qua. Dành cho người đã nghe về Hà Giang nhiều và muốn hiểu vì sao.',
    durationDays: 5,
    priceFrom: 8900000,
    destinations: ['Quản Bạ', 'Yên Minh', 'Đồng Văn', 'Mèo Vạc'],
    hero: 'dong-van.jpg',
    gallery: ['dong-van.jpg', 'tour-ma-pi-leng.jpg', 'yen-minh.jpg', 'meo-vac.jpg'],
    itinerary: [
      {
        title: 'Hà Nội – Hà Giang',
        description:
          'Ngày di chuyển. Chiều tới thành phố Hà Giang, đi bộ dọc sông Lô và ăn tối ở một quán quen.',
        media: 'ruong-bac-thang.jpg',
      },
      {
        title: 'Hà Giang – Yên Minh',
        description:
          'Qua cổng trời Quản Bạ, núi đôi Cô Tiên, rừng thông Yên Minh. Đường nhiều khúc cua, đi chậm và dừng nhiều.',
        media: 'yen-minh.jpg',
      },
      {
        title: 'Yên Minh – Đồng Văn',
        description:
          'Dốc Thẩm Mã, dinh thự họ Vương ở Sà Phìn, cột cờ Lũng Cú. Tối ngủ ở phố cổ Đồng Văn.',
        media: 'dong-van.jpg',
      },
      {
        title: 'Đồng Văn – Mèo Vạc',
        description:
          'Vượt đèo Mã Pí Lèng, xuống bến thuyền đi một vòng sông Nho Quế qua hẻm Tu Sản.',
        media: 'tour-ma-pi-leng.jpg',
      },
      {
        title: 'Mèo Vạc – Hà Nội',
        description: 'Sáng ghé chợ phiên Mèo Vạc rồi về xuôi theo đường Bắc Mê.',
        media: 'meo-vac.jpg',
      },
    ],
    inclusions: [
      'Xe riêng đưa đón toàn tuyến',
      'Khách sạn 3 sao và một đêm homestay',
      'Hướng dẫn viên người Hà Giang',
      'Toàn bộ bữa ăn theo lịch trình',
      'Vé thuyền sông Nho Quế',
    ],
    exclusions: ['Vé máy bay tới Hà Nội', 'Chi phí cá nhân', 'Bảo hiểm du lịch'],
    seoTitle: 'Tour cao nguyên đá Đồng Văn 5 ngày 4 đêm',
    seoDescription:
      'Năm ngày đi hết công viên địa chất Đồng Văn: Quản Bạ, Yên Minh, Đồng Văn, Mèo Vạc, sông Nho Quế.',
  },
  {
    slug: 'ma-pi-leng-song-nho-que',
    title: 'Mã Pí Lèng và sông Nho Quế',
    tagline: 'Hai ngày cuối tuần cho đúng một cung đường',
    summary:
      'Chuyến ngắn nhất chúng tôi nhận tổ chức. Bay tối thứ Sáu, về tối Chủ nhật, và toàn bộ thời gian ở Hà Giang dành cho một đoạn đường bốn mươi cây số: đèo Mã Pí Lèng và khúc sông Nho Quế chảy dưới chân nó.',
    durationDays: 2,
    priceFrom: 3600000,
    destinations: ['Đồng Văn', 'Mèo Vạc'],
    hero: 'song-nho-que.jpg',
    gallery: ['song-nho-que.jpg', 'tour-ma-pi-leng.jpg', 'meo-vac.jpg'],
    itinerary: [
      {
        title: 'Đồng Văn – Mã Pí Lèng',
        description:
          'Đi đèo vào buổi sáng sớm khi sương còn nằm dưới vực. Dừng ở mỏm Ngựa và đi bộ đoạn đường Hạnh Phúc cũ.',
        media: 'tour-ma-pi-leng.jpg',
      },
      {
        title: 'Sông Nho Quế – về xuôi',
        description:
          'Thuyền vào hẻm Tu Sản lúc nước lặng nhất trong ngày. Chiều về Hà Nội.',
        media: 'song-nho-que.jpg',
      },
    ],
    inclusions: ['Xe riêng đưa đón', 'Một đêm khách sạn ở Đồng Văn', 'Vé thuyền sông Nho Quế'],
    exclusions: ['Bữa ăn ngoài lịch trình', 'Chi phí cá nhân'],
    seoTitle: 'Tour Mã Pí Lèng sông Nho Quế 2 ngày 1 đêm',
    seoDescription:
      'Cuối tuần ngắn ở Hà Giang: đèo Mã Pí Lèng, hẻm vực Tu Sản và thuyền trên sông Nho Quế.',
  },
  {
    slug: 'ruong-bac-thang-mua-nuoc-do',
    title: 'Ruộng bậc thang mùa nước đổ',
    tagline: 'Bốn ngày đi theo nước, từ tháng Năm tới đầu tháng Sáu',
    summary:
      'Mỗi năm chỉ có khoảng ba tuần các thửa ruộng ngập nước và biến thành gương. Chuyến này bám theo lịch dẫn nước của từng xã, nên ngày khởi hành được chốt muộn — thường trước hai tuần — để đi đúng lúc.',
    durationDays: 4,
    priceFrom: 7200000,
    destinations: ['Hoàng Su Phì', 'Quản Bạ', 'Yên Minh'],
    hero: 'ruong-bac-thang.jpg',
    gallery: ['ruong-bac-thang.jpg', 'yen-minh.jpg', 'quan-ba.jpg'],
    itinerary: [
      {
        title: 'Hà Nội – Hoàng Su Phì',
        description:
          'Đường vào Hoàng Su Phì dài và xóc, nhưng những thửa ruộng đầu tiên hiện ra ngay khi qua đèo Km 17.',
        media: 'ruong-bac-thang.jpg',
      },
      {
        title: 'Hoàng Su Phì – Bản Phùng',
        description:
          'Đi bộ nửa ngày qua các thửa ruộng của người La Chí. Trưa ăn ở nhà dân, chiều về nghỉ sớm.',
        media: 'ruong-bac-thang.jpg',
      },
      {
        title: 'Hoàng Su Phì – Quản Bạ',
        description: 'Sang phía cao nguyên đá, ngủ ở một homestay nhìn thẳng ra thung lũng.',
        media: 'quan-ba.jpg',
      },
      {
        title: 'Quản Bạ – Hà Nội',
        description: 'Sáng dậy sớm đón sương tan trên thung lũng, rồi về xuôi.',
        media: 'yen-minh.jpg',
      },
    ],
    inclusions: [
      'Xe riêng đưa đón toàn tuyến',
      'Hai đêm homestay, một đêm khách sạn',
      'Hướng dẫn viên bản địa và người dẫn đường đi bộ',
      'Toàn bộ bữa ăn theo lịch trình',
    ],
    exclusions: ['Chi phí cá nhân', 'Đồ uống có cồn', 'Bảo hiểm du lịch'],
    seoTitle: 'Tour ruộng bậc thang mùa nước đổ 4 ngày 3 đêm',
    seoDescription:
      'Bốn ngày ở Hoàng Su Phì và Quản Bạ đúng mùa nước đổ. Ngày khởi hành chốt theo lịch dẫn nước từng xã.',
  },
  {
    slug: 'vong-cung-dong-bac',
    title: 'Vòng cung Đông Bắc',
    tagline: 'Sáu ngày nối Hà Giang với Cao Bằng',
    summary:
      'Chuyến dài nhất trong danh mục. Đi hết cao nguyên đá rồi vòng sang phía Đông theo đường Bắc Mê, một cung đường ít xe và gần như không có khách du lịch. Phù hợp với người đã đi Hà Giang một lần và muốn đi tiếp.',
    durationDays: 6,
    priceFrom: 11500000,
    destinations: ['Quản Bạ', 'Đồng Văn', 'Mèo Vạc', 'Bắc Mê'],
    hero: 'meo-vac.jpg',
    gallery: ['meo-vac.jpg', 'dong-van.jpg', 'song-nho-que.jpg', 'ruong-bac-thang.jpg'],
    itinerary: [
      {
        title: 'Hà Nội – Hà Giang',
        description: 'Ngày di chuyển, tối làm quen cả nhóm và xem lại lịch trình cùng nhau.',
        media: 'ruong-bac-thang.jpg',
      },
      {
        title: 'Hà Giang – Quản Bạ',
        description: 'Cổng trời, núi đôi, và một buổi chiều đi bộ trong thung lũng.',
        media: 'quan-ba.jpg',
      },
      {
        title: 'Quản Bạ – Đồng Văn',
        description: 'Dốc Thẩm Mã, Sà Phìn, Lũng Cú. Tối ở phố cổ Đồng Văn.',
        media: 'dong-van.jpg',
      },
      {
        title: 'Đồng Văn – Mèo Vạc',
        description: 'Mã Pí Lèng buổi sáng, sông Nho Quế buổi chiều.',
        media: 'song-nho-que.jpg',
      },
      {
        title: 'Mèo Vạc – Bắc Mê',
        description:
          'Rời cao nguyên đá theo hướng Đông. Đường vắng, nhiều đoạn chạy sát sông Gâm.',
        media: 'meo-vac.jpg',
      },
      {
        title: 'Bắc Mê – Hà Nội',
        description: 'Chặng cuối về xuôi, dừng ăn trưa ở Tuyên Quang.',
        media: 'yen-minh.jpg',
      },
    ],
    inclusions: [
      'Xe riêng đưa đón toàn tuyến',
      'Năm đêm nghỉ, gồm hai đêm homestay',
      'Hướng dẫn viên đi cùng suốt chuyến',
      'Toàn bộ bữa ăn theo lịch trình',
      'Vé thuyền sông Nho Quế',
    ],
    exclusions: ['Vé máy bay tới Hà Nội', 'Chi phí cá nhân', 'Bảo hiểm du lịch'],
    seoTitle: 'Tour vòng cung Đông Bắc 6 ngày 5 đêm',
    seoDescription:
      'Sáu ngày nối Hà Giang với Bắc Mê qua cao nguyên đá Đồng Văn, Mã Pí Lèng và sông Nho Quế.',
  },
]

const slugDaCo = new Set<string>()
{
  const { docs } = await payload.find({ collection: 'tours', depth: 0, limit: 500, select: { slug: true } })
  for (const doc of docs) slugDaCo.add(String(doc.slug))
}

let daTao = 0
for (const mau of TOUR_MAU) {
  if (slugDaCo.has(mau.slug)) {
    console.log(`  bỏ qua (đã có): ${mau.slug}`)
    continue
  }
  await payload.create({
    collection: 'tours',
    data: {
      slug: mau.slug,
      title: vi(mau.title),
      tagline: vi(mau.tagline),
      summary: vi(mau.summary),
      durationDays: mau.durationDays,
      priceFrom: mau.priceFrom,
      destinations: mau.destinations.map((d) => vi(d)),
      heroMedia: anh(mau.hero),
      gallery: mau.gallery.map(anh),
      itinerary: mau.itinerary.map((ngay) => ({
        title: vi(ngay.title),
        description: vi(ngay.description),
        ...(ngay.media ? { media: anh(ngay.media) } : {}),
      })),
      inclusions: mau.inclusions.map((x) => vi(x)),
      exclusions: mau.exclusions.map((x) => vi(x)),
      seo: {
        title: vi(mau.seoTitle),
        description: vi(mau.seoDescription),
        ogImage: anh(mau.hero),
      },
    } as never,
  })
  daTao += 1
  console.log(`  đã tạo: ${mau.slug}`)
}

// ── Trang chủ: chỉ điền vào những khối đang rỗng ─────────────────────────────

// Ép qua `unknown` trước: kiểu `Home` sinh tự động không có index signature nên
// TypeScript chặn phép ép thẳng sang Record<string, unknown>.
const home = (await payload.findGlobal({ slug: 'home', depth: 0 })) as unknown as Record<
  string,
  unknown
>
const capNhat: Record<string, unknown> = {}

const FAQ_MAU = [
  {
    q: 'Vì sao nên đi cùng Rosa thay vì tự sắp xếp?',
    a: 'Tự đi Hà Giang không khó, nhưng phần khó nằm ở chỗ ít ai lường trước: đường nào đang sửa, chợ phiên rơi vào ngày nào, homestay nào thật sự nhìn ra thung lũng chứ không phải nhìn ra bãi xe. Chúng tôi ở đó đủ nhiều để biết những thứ đó, và cập nhật lại sau mỗi chuyến.',
  },
  {
    q: 'Một chuyến đi được dựng ra như thế nào?',
    a: 'Bắt đầu bằng một cuộc gọi hỏi bạn muốn gì và không muốn gì. Sau đó chúng tôi gửi bản nháp lịch trình kèm chi phí. Bạn sửa bao nhiêu vòng cũng được, chỉ tính tiền khi bạn đồng ý chốt.',
  },
  {
    q: 'Nhóm bao nhiêu người là vừa?',
    a: 'Chúng tôi nhận từ hai người và không nhận quá mười hai người một chuyến. Trên mười hai người thì bữa ăn phải đặt trước cứng, homestay phải chia làm hai nơi, và chuyến đi mất đi phần linh hoạt vốn là lý do bạn tìm tới chúng tôi.',
  },
  {
    q: 'Đi vào mùa nào thì đẹp nhất?',
    a: 'Không có một câu trả lời chung. Tháng Năm là mùa nước đổ, cuối tháng Mười là tam giác mạch, tháng Chạp là hoa mận và sương mù dày. Nói cho chúng tôi biết bạn rảnh khi nào, chúng tôi sẽ nói khi đó Hà Giang đang có gì.',
  },
  {
    q: 'Huỷ hoặc đổi ngày thì sao?',
    a: 'Trước ngày đi ba mươi ngày: hoàn toàn bộ. Từ ba mươi tới mười lăm ngày: hoàn bảy mươi phần trăm. Dưới mười lăm ngày chúng tôi đã đặt cọc xe và phòng nên không hoàn được, nhưng luôn cố gắng đổi sang ngày khác thay vì huỷ.',
  },
]

if (((home.faq as unknown[] | undefined) ?? []).length === 0) {
  capNhat.faq = FAQ_MAU.map((x) => ({ question: vi(x.q), answer: vi(x.a) }))
  console.log(`  điền ${FAQ_MAU.length} câu hỏi thường gặp`)
}

const guideHienTai = home.guide as Record<string, unknown> | undefined
if (typeof guideHienTai?.name !== 'string' || guideHienTai.name.trim() === '') {
  capNhat.guide = {
    name: 'Lê Minh Rosa',
    role: vi('Người sáng lập'),
    bio: vi(
      'Tôi lái chuyến đầu tiên lên Hà Giang năm 2016 và chưa năm nào bỏ. Mỗi lịch trình ở đây tôi đều tự đi lại trước khi bán, và phần lớn homestay trong danh sách là nhà của những người tôi đã ăn cơm cùng.',
    ),
  }
  console.log('  điền thông tin người dẫn đường')
}

if (((home.testimonials as unknown[] | undefined) ?? []).length === 0) {
  capNhat.testimonials = [
    {
      name: 'Thu Hà, Hà Nội',
      quote: vi(
        'Tôi đi ba ngày mà nhớ nhất lại là buổi chiều ngồi không ở Quản Bạ, không chụp cái ảnh nào. Lịch trình chừa chỗ cho những buổi như thế, và đó là điều tôi không tự sắp được.',
      ),
    },
    {
      name: 'Đức và Linh, TP.HCM',
      quote: vi(
        'Bọn mình đổi ngày hai lần vì công việc, lần nào bên Rosa cũng dựng lại lịch trình trong ngày mà không kêu ca câu nào.',
      ),
    },
    {
      name: 'Marc, Lyon',
      quote: vi(
        'Hướng dẫn viên là người sinh ra ở Mèo Vạc. Anh ấy dừng xe ở những chỗ không có trong bất kỳ hướng dẫn du lịch nào, và giải thích được vì sao chỗ đó đáng dừng.',
      ),
    },
  ]
  console.log('  điền 3 cảm nhận khách hàng')
}

// Tour nổi bật: bổ sung các tour mới vào danh sách hiện có, giữ nguyên thứ tự
// cũ. Ghi đè sẽ xoá lựa chọn mà người vận hành đã sắp bằng tay.
{
  const dangCo = ((home.featuredTours as unknown[] | undefined) ?? []).map((x) =>
    typeof x === 'object' && x !== null ? String((x as { id: unknown }).id) : String(x),
  )
  const { docs } = await payload.find({ collection: 'tours', depth: 0, limit: 500, select: { slug: true } })
  const themVao = docs
    .filter((d) => TOUR_MAU.some((m) => m.slug === d.slug))
    .map((d) => String(d.id))
    .filter((id) => !dangCo.includes(id))
  if (themVao.length > 0) {
    capNhat.featuredTours = [...dangCo, ...themVao]
    console.log(`  thêm ${themVao.length} tour vào danh sách nổi bật`)
  }
}

if (Object.keys(capNhat).length > 0) {
  await payload.updateGlobal({ slug: 'home', data: capNhat as never })
}

console.log(`\nXong. Tạo mới ${daTao} tour.`)
console.log('Nhớ: đây là NỘI DUNG MẪU. Thay bằng nội dung thật trong /admin trước khi phát hành.')
process.exit(0)
