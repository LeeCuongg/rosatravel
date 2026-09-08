/**
 * NỘI DUNG MẪU cho Địa điểm và Chuyến đã đi.
 *
 * Chạy: npx payload run scripts/seed-cases.ts
 *
 * Cùng ba quy tắc an toàn như scripts/seed-demo.ts: chỉ THÊM không ghi đè,
 * không tải ảnh mới lên Blob, và toàn bộ là HÀNG MẪU do máy viết — thay bằng
 * nội dung thật trong /admin trước khi phát hành.
 *
 * Bốn bài "Chuyến đã đi" là con số có chủ đích, không phải tuỳ tiện: khối trên
 * trang chủ chia bốn cột, nên ba bài để trống một ô còn năm bài thì tràn xuống
 * hàng thứ hai với đúng một thẻ lẻ loi.
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

function anh(tenTep: string): string {
  const id = anhTheoTen.get(tenTep)
  if (!id) {
    throw new Error(
      `Không tìm thấy ảnh "${tenTep}" trong Thư viện ảnh.\n` +
        `Đang có: ${[...anhTheoTen.keys()].join(', ')}`,
    )
  }
  return id
}

const vi = (s: string) => ({ vi: s })
const doan = (...cac: string[]) => cac.map((x) => ({ vi: x }))

// ── ĐỊA ĐIỂM ─────────────────────────────────────────────────────────────────

interface DiaDiemMau {
  slug: string
  name: string
  category: 'an-uong' | 'luu-tru' | 'thien-nhien' | 'van-hoa' | 'cho-mua-sam'
  excerpt: string
  body: string[]
  address?: string
  website?: string
  images: string[]
}

const DIA_DIEM_MAU: DiaDiemMau[] = [
  {
    slug: 'hem-vuc-tu-san',
    name: 'Hẻm vực Tu Sản',
    category: 'thien-nhien',
    excerpt: 'Vách đá dựng đứng gần tám trăm mét, nhìn từ mặt nước sông Nho Quế.',
    body: [
      'Tu Sản là hẻm vực sâu nhất Đông Nam Á, và cách duy nhất để cảm nhận được độ sâu đó là đi thuyền vào giữa. Đứng trên đèo nhìn xuống thì nó chỉ là một khe hẹp; ngồi dưới thuyền ngước lên mới thấy hai vách đá khép lại quanh mình.',
      'Bến thuyền nằm dưới chân đèo Mã Pí Lèng, đi xuống bằng một con dốc ngắn. Nước lặng nhất vào buổi sáng sớm và cuối buổi chiều; giữa trưa gió thổi dọc hẻm làm mặt sông gợn và ảnh chụp mất hết màu ngọc bích.',
    ],
    address: 'Xã Pải Lủng, Mèo Vạc, Hà Giang',
    images: ['song-nho-que.jpg', 'tour-ma-pi-leng.jpg'],
  },
  {
    slug: 'deo-ma-pi-leng',
    name: 'Đèo Mã Pí Lèng',
    category: 'thien-nhien',
    excerpt: 'Hai mươi cây số đường đục vào vách đá, nối Đồng Văn với Mèo Vạc.',
    body: [
      'Con đường này được đục bằng tay trong sáu năm, chủ yếu bởi thanh niên xung phong treo mình trên dây thừng. Người ta gọi nó là đường Hạnh Phúc, và cái tên đó không phải khẩu hiệu: trước khi có nó, người Đồng Văn đi Mèo Vạc mất hai ngày đường rừng.',
      'Đoạn đẹp nhất là khúc gần mỏm Ngựa, nơi đường lượn sát mép vực và nhìn thẳng xuống sông Nho Quế. Có một lối đi bộ men theo đường cũ, hẹp hơn và không có lan can — đi được nếu không sợ độ cao, và đó là chỗ duy nhất nghe được tiếng nước dưới đáy vực.',
    ],
    address: 'Quốc lộ 4C, giữa Đồng Văn và Mèo Vạc, Hà Giang',
    images: ['tour-ma-pi-leng.jpg', 'song-nho-que.jpg'],
  },
  {
    slug: 'cho-phien-meo-vac',
    name: 'Chợ phiên Mèo Vạc',
    category: 'cho-mua-sam',
    excerpt: 'Họp sáng Chủ nhật. Đi trước bảy giờ nếu muốn thấy chợ thật.',
    body: [
      'Chợ Mèo Vạc là chợ phiên vùng cao còn giữ được nhịp cũ: người từ các bản đi bộ xuống từ đêm hôm trước, và tới bảy giờ sáng thì khu bán trâu bò đã đông kín. Sau chín giờ, phần lớn người bán đã về và cái còn lại là một khu chợ bình thường.',
      'Khu ăn uống nằm phía cuối, sau dãy bán vải. Thắng cố nấu trong chảo lớn từ sáng sớm, và người ta ngồi ăn chung bàn với người lạ. Đây là chỗ đáng dừng lâu nhất, dù nó không có trong bất kỳ danh sách điểm tham quan nào.',
    ],
    address: 'Thị trấn Mèo Vạc, Hà Giang',
    images: ['meo-vac.jpg'],
  },
  {
    slug: 'dinh-thu-ho-vuong',
    name: 'Dinh thự họ Vương',
    category: 'van-hoa',
    excerpt: 'Nhà của vua Mèo ở Sà Phìn, dựng đầu thế kỷ trước bằng đá và gỗ sa mộc.',
    body: [
      'Dinh thự nằm trong một thung lũng nhỏ được chọn theo thuật phong thuỷ, quay lưng vào núi và nhìn ra một khoảng đất bằng hiếm hoi giữa cao nguyên đá. Toàn bộ nhà dựng bằng đá xanh và gỗ sa mộc, không dùng đinh sắt.',
      'Điều đáng nhìn nhất không phải quy mô mà là chi tiết: chân cột chạm hình quả thuốc phiện, bể chứa nước mưa đục từ một khối đá nguyên, và những ô cửa nhỏ đặt sao cho gió luôn lùa qua nhà kể cả ngày lặng gió nhất.',
    ],
    address: 'Xã Sà Phìn, Đồng Văn, Hà Giang',
    images: ['yen-minh.jpg', 'dong-van.jpg'],
  },
  {
    slug: 'homestay-lung-cam',
    name: 'Homestay Lũng Cẩm',
    category: 'luu-tru',
    excerpt: 'Nhà trình tường của một gia đình người Mông, năm phòng, ăn cơm chung.',
    body: [
      'Nhà nằm trong thung lũng Sung Là, cách đường lớn chừng một cây số đường đất. Tường trình bằng đất nện dày gần nửa mét nên trong nhà mát vào mùa hè và giữ ấm vào mùa đông — thứ mà mấy khách sạn bê tông ngoài thị trấn không có được.',
      'Chủ nhà nấu cơm tối cho khách, ăn chung một mâm với cả gia đình. Không có thực đơn: có gì ăn nấy, thường là gà bản, rau cải mèo và rượu ngô. Nếu đi vào mùa đông thì mang thêm áo ấm, nhà không có máy sưởi.',
    ],
    address: 'Thôn Lũng Cẩm, xã Sủng Là, Đồng Văn, Hà Giang',
    images: ['quan-ba.jpg', 'ruong-bac-thang.jpg'],
  },
  {
    slug: 'pho-co-dong-van',
    name: 'Phố cổ Đồng Văn',
    category: 'an-uong',
    excerpt: 'Mấy dãy nhà trình tường trăm tuổi, và quán cà phê mở cửa từ năm giờ sáng.',
    body: [
      'Phố cổ Đồng Văn chỉ có ba dãy nhà, đi hết trong mười phút. Nhưng vào lúc năm giờ sáng, khi sương còn đọng trên mái ngói âm dương và hàng quán mới nhóm lửa, nó là chỗ đẹp nhất trên cả cao nguyên đá.',
      'Quán cà phê phố cổ nằm trong một nhà trình tường hai tầng, ngồi trên gác nhìn xuống quảng trường. Cà phê không có gì đặc biệt, nhưng đây là chỗ duy nhất trong thị trấn mở trước bình minh, và buổi sáng ở Đồng Văn thì đáng dậy sớm.',
    ],
    address: 'Thị trấn Đồng Văn, Hà Giang',
    images: ['dong-van.jpg', 'meo-vac.jpg'],
  },
]

const slugDiaDiemDaCo = new Set<string>()
{
  const { docs } = await payload.find({
    collection: 'locations',
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  for (const doc of docs) slugDiaDiemDaCo.add(String(doc.slug))
}

const idTheoSlugDiaDiem = new Map<string, string>()
for (const mau of DIA_DIEM_MAU) {
  if (slugDiaDiemDaCo.has(mau.slug)) {
    console.log(`  bỏ qua địa điểm (đã có): ${mau.slug}`)
    continue
  }
  await payload.create({
    collection: 'locations',
    data: {
      slug: mau.slug,
      name: vi(mau.name),
      category: mau.category,
      excerpt: vi(mau.excerpt),
      body: doan(...mau.body),
      ...(mau.address ? { address: mau.address } : {}),
      ...(mau.website ? { website: mau.website } : {}),
      images: mau.images.map(anh),
      seo: {
        title: vi(`${mau.name} — Hà Giang`),
        description: vi(mau.excerpt),
        ogImage: anh(mau.images[0]),
      },
    } as never,
  })
  console.log(`  đã tạo địa điểm: ${mau.slug}`)
}

// Tra id của TẤT CẢ địa điểm (kể cả cái đã có từ trước) để gắn vào bài viết.
{
  const { docs } = await payload.find({ collection: 'locations', depth: 0, limit: 500 })
  for (const doc of docs) idTheoSlugDiaDiem.set(String(doc.slug), String(doc.id))
}

function diaDiem(...slugs: string[]): string[] {
  return slugs.map((s) => {
    const id = idTheoSlugDiaDiem.get(s)
    if (!id) throw new Error(`Không tìm thấy địa điểm "${s}" — kiểm tra lại DIA_DIEM_MAU.`)
    return id
  })
}

// ── CHUYẾN ĐÃ ĐI ─────────────────────────────────────────────────────────────

interface ChuyenMau {
  slug: string
  title: string
  subtitle: string
  accent: 'dat-nung' | 'xanh-reu' | 'chi-lam' | 'tim-man' | 'vang-dat'
  hero: string
  thumbnail: string
  highlights: string[]
  ourRole: string[]
  days: {
    title: string
    body: string[]
    images?: string[]
    locationsLabel?: string
    locations?: string[]
  }[]
}

const CHUYEN_MAU: ChuyenMau[] = [
  {
    slug: 'ha-giang-ba-the-he',
    title: 'Hà Giang cho ba thế hệ',
    subtitle: 'Sáu ngày, chín người, một chiếc xe',
    accent: 'xanh-reu',
    hero: 'hero-ha-giang.jpg',
    thumbnail: 'ruong-bac-thang.jpg',
    highlights: [
      'Một gia đình chín người từ Sài Gòn muốn đi Hà Giang cùng nhau: ông bà ngoài bảy mươi, bố mẹ, và bốn đứa trẻ dưới mười hai tuổi. Ba công ty trước đó đều từ chối, lý do giống nhau — đường đèo quá dài cho người già và trẻ nhỏ.',
      'Chúng tôi nhận, với điều kiện đổi cách đi. Thay vì chạy hết cung đường trong bốn ngày như tour tiêu chuẩn, chúng tôi kéo dài thành sáu và cắt mỗi chặng xuống dưới ba giờ ngồi xe. Đổi lại là mỗi ngày có một buổi trống hoàn toàn, không lịch trình.',
      'Kết quả nằm ngoài dự tính: những buổi trống đó lại là phần cả nhà nhớ nhất. Ông bà ngồi uống trà với chủ homestay, bọn trẻ chạy chơi ngoài sân, và không ai phải giục ai lên xe.',
    ],
    ourRole: [
      'Thiết kế lại cung đường để mỗi chặng dưới ba giờ ngồi xe',
      'Chọn xe 16 chỗ có gầm cao và ghế ngả được cho người lớn tuổi',
      'Đặt homestay có phòng tầng trệt, không phải leo thang gỗ',
      'Sắp xếp một y tá đi cùng trong hai ngày ở cao nguyên đá',
      'Chuẩn bị đồ ăn riêng cho trẻ nhỏ ở những chặng xa hàng quán',
    ],
    days: [
      {
        title: 'Hà Nội – Hà Giang',
        body: [
          'Xe đón cả nhà lúc bảy giờ sáng, sớm hơn bình thường một tiếng để tránh nắng buổi trưa cho ông bà. Nghỉ dài ở Tuyên Quang, ăn trưa rồi ngủ trưa ngay tại quán trong một tiếng.',
          'Tới thành phố Hà Giang lúc bốn giờ chiều. Buổi tối không có lịch gì — cả nhà đi bộ dọc sông Lô và ăn tối ở một quán lẩu gần khách sạn.',
        ],
        images: ['ruong-bac-thang.jpg'],
      },
      {
        title: 'Hà Giang – Quản Bạ',
        body: [
          'Chặng ngắn nhất chuyến đi, chỉ hơn hai giờ. Dừng ở cổng trời Quản Bạ đủ lâu để ông bà đi hết đoạn đường lên đài quan sát mà không phải vội.',
          'Chiều về homestay sớm. Bọn trẻ ra ruộng phía sau nhà, còn người lớn ngồi ngoài hiên nhìn sương xuống thung lũng. Chủ nhà nấu cơm tối, cả mười mấy người ăn chung một mâm dài.',
        ],
        images: ['quan-ba.jpg', 'yen-minh.jpg'],
        locationsLabel: 'Ngủ ở đâu',
        locations: ['homestay-lung-cam'],
      },
      {
        title: 'Quản Bạ – Đồng Văn',
        body: [
          'Ngày dài nhất, nên khởi hành lúc tám giờ và chia làm ba chặng ngắn. Dừng ở dốc Thẩm Mã, rồi Sà Phìn, rồi mới vào Đồng Văn.',
          'Dinh thự họ Vương là chỗ ông ngoại thích nhất — ông từng đọc về nó trong một cuốn sách cũ và đi bộ hết cả ba lớp nhà, không cần ai đỡ.',
        ],
        images: ['yen-minh.jpg', 'dong-van.jpg'],
        locationsLabel: 'Đã ghé',
        locations: ['dinh-thu-ho-vuong', 'pho-co-dong-van'],
      },
      {
        title: 'Đồng Văn – Mã Pí Lèng – Mèo Vạc',
        body: [
          'Chặng mà ba công ty trước lo nhất, và hoá ra là chặng dễ nhất. Đường đèo tốt, xe đi chậm, và chúng tôi dừng bốn lần trong hai mươi cây số.',
          'Xuống bến thuyền sông Nho Quế lúc ba giờ chiều, khi nước đã lặng. Bọn trẻ được cầm lái một đoạn ngắn dưới sự trông chừng của người lái thuyền.',
        ],
        images: ['tour-ma-pi-leng.jpg', 'song-nho-que.jpg'],
        locationsLabel: 'Đã ghé',
        locations: ['deo-ma-pi-leng', 'hem-vuc-tu-san'],
      },
      {
        title: 'Chợ phiên Mèo Vạc',
        body: [
          'Chủ nhật, nên cả nhà dậy từ năm rưỡi để xuống chợ trước khi khu bán trâu bò tan. Đây là buổi sáng ồn ào nhất chuyến đi và cũng là buổi được chụp nhiều ảnh nhất.',
          'Buổi chiều bỏ trống hoàn toàn theo đúng kế hoạch. Không ai đi đâu cả.',
        ],
        images: ['meo-vac.jpg'],
        locationsLabel: 'Đã ghé',
        locations: ['cho-phien-meo-vac'],
      },
      {
        title: 'Mèo Vạc – Hà Nội',
        body: [
          'Về theo đường Bắc Mê, dài hơn quốc lộ 4C nhưng ít đèo hơn nhiều — quyết định đưa ra từ đầu chuyến, để chặng cuối không phải là chặng mệt nhất.',
          'Tới Hà Nội lúc tám giờ tối, sớm hơn dự kiến một tiếng.',
        ],
        images: ['hero-ha-giang.jpg'],
      },
    ],
  },
  {
    slug: 'mua-nuoc-do-hai-nguoi',
    title: 'Mùa nước đổ, đi hai người',
    subtitle: 'Bốn ngày ở Hoàng Su Phì, chốt lịch trước mười ngày',
    accent: 'chi-lam',
    hero: 'ruong-bac-thang.jpg',
    thumbnail: 'quan-ba.jpg',
    highlights: [
      'Hai người làm nghề nhiếp ảnh, muốn chụp ruộng bậc thang đúng lúc các thửa vừa ngập nước và chưa cấy. Cửa sổ thời gian đó chỉ khoảng mười ngày mỗi năm, và nó xê dịch theo lịch dẫn nước của từng xã.',
      'Chúng tôi không chốt ngày khởi hành lúc nhận khách. Thay vào đó, người dẫn đường ở Hoàng Su Phì báo về mỗi tuần một lần từ đầu tháng Năm, và chuyến đi được chốt trước đúng mười ngày khi nước bắt đầu về Bản Phùng.',
      'Cách làm này chỉ hợp với nhóm nhỏ và khách chủ động được lịch. Chúng tôi nói rõ điều đó ngay từ cuộc gọi đầu tiên.',
    ],
    ourRole: [
      'Theo dõi lịch dẫn nước từng xã trong sáu tuần trước chuyến',
      'Chốt ngày khởi hành trước mười ngày, giữ chỗ homestay linh hoạt',
      'Bố trí người dẫn đường đi bộ thuộc đường tắt giữa các thửa ruộng',
      'Sắp xếp hai buổi dậy trước bốn giờ sáng, có xe chờ sẵn',
    ],
    days: [
      {
        title: 'Hà Nội – Hoàng Su Phì',
        body: [
          'Đường vào Hoàng Su Phì dài và xóc hơn đường lên cao nguyên đá, nhưng những thửa ruộng đầu tiên hiện ra ngay khi qua đèo Km 17 — và đó là lúc cả hai khách quyết định dừng xe lần đầu.',
          'Tới nơi lúc bốn giờ chiều, kịp ánh sáng cuối ngày.',
        ],
        images: ['ruong-bac-thang.jpg'],
      },
      {
        title: 'Bản Phùng',
        body: [
          'Dậy lúc bốn giờ, lên điểm chụp trước khi trời sáng. Sương nằm dưới thung lũng tới gần bảy giờ mới tan, và trong hai tiếng đó các thửa ruộng phản chiếu trời như một chuỗi gương vỡ.',
          'Buổi chiều đi bộ với người dẫn đường qua các thửa của người La Chí, theo bờ ruộng chứ không theo đường mòn du lịch. Ăn trưa ở nhà một gia đình trong bản.',
        ],
        images: ['ruong-bac-thang.jpg', 'yen-minh.jpg'],
      },
      {
        title: 'Sang Quản Bạ',
        body: [
          'Rời Hoàng Su Phì buổi sáng, sang phía cao nguyên đá. Đây là ngày di chuyển, và chúng tôi nói trước rằng nó sẽ không có gì để chụp — điều mà khách chụp ảnh cần biết để không thất vọng.',
          'Chiều tới homestay ở Sủng Là, nghỉ sớm.',
        ],
        images: ['quan-ba.jpg'],
        locationsLabel: 'Ngủ ở đâu',
        locations: ['homestay-lung-cam'],
      },
      {
        title: 'Quản Bạ – Hà Nội',
        body: [
          'Buổi sáng cuối cùng dành cho thung lũng Sủng Là lúc sương chưa tan, rồi về xuôi.',
        ],
        images: ['yen-minh.jpg'],
      },
    ],
  },
  {
    slug: 'tam-giac-mach-nhom-ban',
    title: 'Tam giác mạch cho một nhóm bạn',
    subtitle: 'Ba ngày cuối tháng Mười, sáu người',
    accent: 'tim-man',
    hero: 'tam-giac-mach.jpg',
    thumbnail: 'tam-giac-mach.jpg',
    highlights: [
      'Sáu người bạn học cũ, mỗi năm đi chung một chuyến, và năm nay muốn Hà Giang vào mùa hoa. Yêu cầu duy nhất: không đi những thửa hoa có bán vé chụp ảnh.',
      'Đó là yêu cầu khó hơn nó nghe. Phần lớn ruộng tam giác mạch nằm sát quốc lộ giờ đều thu tiền, và những thửa còn lại thì nằm sâu trong bản, không có biển chỉ đường và không có chỗ đỗ xe.',
      'Người dẫn đường của chúng tôi ở Sủng Là đi khảo sát trước một tuần và chốt được bốn thửa. Cả bốn đều phải đi bộ vào từ ba tới mười lăm phút, và không thửa nào có ai khác.',
    ],
    ourRole: [
      'Khảo sát trước bốn thửa hoa nằm ngoài tuyến du lịch',
      'Xin phép chủ ruộng cho nhóm vào chụp, trả tiền trực tiếp cho họ',
      'Bố trí xe nhỏ để vào được đường bản',
      'Đặt bữa tối tại nhà dân thay vì nhà hàng ở thị trấn',
    ],
    days: [
      {
        title: 'Hà Nội – Quản Bạ',
        body: [
          'Rời Hà Nội từ sớm, ăn trưa ở Bắc Quang. Chiều lên cổng trời Quản Bạ khi nắng đã dịu, rồi đi bộ một quãng ngắn xuống thung lũng.',
          'Thửa hoa đầu tiên nằm cách đường lớn chừng ba trăm mét, sau một hàng rào đá. Chủ ruộng là một bà cụ người Mông; bà ngồi xem cả nhóm chụp gần một tiếng và không lấy đồng nào cho tới khi chúng tôi nhất định đưa.',
        ],
        images: ['quan-ba.jpg', 'tam-giac-mach.jpg'],
      },
      {
        title: 'Sủng Là – Đồng Văn',
        body: [
          'Cả ngày dành cho hoa. Ba thửa còn lại nằm trong thung lũng Sủng Là và trên đường lên Đồng Văn, mỗi chỗ dừng khoảng một tiếng rưỡi.',
          'Tối ăn cơm ở nhà chủ homestay rồi đi bộ ra phố cổ. Quán cà phê trên gác còn mở tới mười giờ.',
        ],
        images: ['tam-giac-mach.jpg', 'dong-van.jpg'],
        locationsLabel: 'Ăn và ngủ',
        locations: ['homestay-lung-cam', 'pho-co-dong-van'],
      },
      {
        title: 'Đồng Văn – Hà Nội',
        body: [
          'Buổi sáng cuối cùng ở phố cổ lúc năm giờ, khi sương còn đọng trên mái ngói. Rồi về xuôi, tới Hà Nội khoảng chín giờ tối.',
        ],
        images: ['dong-van.jpg'],
      },
    ],
  },
  {
    slug: 'dong-van-cho-hai-nguoi-lon-tuoi',
    title: 'Đồng Văn cho hai người lớn tuổi',
    subtitle: 'Năm ngày đi chậm, không đèo dài',
    accent: 'vang-dat',
    hero: 'dong-van.jpg',
    thumbnail: 'meo-vac.jpg',
    highlights: [
      'Một cặp vợ chồng ngoài bảy mươi, con cái đặt chuyến làm quà kỷ niệm năm mươi năm ngày cưới. Ông bị say xe nặng và bà mới thay khớp gối hai năm trước.',
      'Chúng tôi bỏ hẳn đèo Mã Pí Lèng khỏi lịch trình — quyết định khó, vì đó là thứ nổi tiếng nhất Hà Giang, và chúng tôi phải giải thích với người đặt tour vì sao chuyến đi này lại thiếu nó.',
      'Đổi lại, cả hai đi được trọn năm ngày mà không phải bỏ buổi nào. Bà đi bộ hết đường vào dinh thự họ Vương, chỗ mà chính bà nói trước chuyến rằng chắc sẽ phải ngồi ngoài chờ.',
    ],
    ourRole: [
      'Bỏ các chặng đèo dài, thay bằng tuyến vòng qua Bắc Mê',
      'Chỉ đặt homestay và khách sạn có phòng tầng trệt',
      'Mỗi ngày chỉ một điểm dừng chính, buổi chiều nghỉ',
      'Chuẩn bị thuốc say xe và bố trí ghế trước cho ông suốt chuyến',
    ],
    days: [
      {
        title: 'Hà Nội – Hà Giang',
        body: [
          'Đi thành hai chặng với một đêm nghỉ giữa đường ở Tuyên Quang, thay vì chạy thẳng như tour thường. Riêng thay đổi này đã cắt được bốn giờ ngồi xe liên tục.',
        ],
        images: ['hero-ha-giang.jpg'],
      },
      {
        title: 'Hà Giang – Quản Bạ',
        body: [
          'Chặng hai tiếng, dừng hai lần. Buổi chiều ở homestay, không đi đâu.',
        ],
        images: ['quan-ba.jpg'],
        locationsLabel: 'Ngủ ở đâu',
        locations: ['homestay-lung-cam'],
      },
      {
        title: 'Sà Phìn',
        body: [
          'Một điểm dừng duy nhất trong ngày. Dinh thự họ Vương có đường vào bằng phẳng và nhiều chỗ ngồi nghỉ, nên đi hết được cả ba lớp nhà mà không mệt.',
          'Ông ngồi nói chuyện gần một tiếng với người trông coi, một người cháu đời thứ tư của dòng họ.',
        ],
        images: ['yen-minh.jpg', 'dong-van.jpg'],
        locationsLabel: 'Đã ghé',
        locations: ['dinh-thu-ho-vuong'],
      },
      {
        title: 'Phố cổ Đồng Văn',
        body: [
          'Ngày duy nhất không lên xe. Cả hai đi bộ quanh phố cổ buổi sáng, nghỉ trưa dài, và buổi chiều ngồi ở quán cà phê trên gác nhìn xuống quảng trường.',
        ],
        images: ['dong-van.jpg'],
        locationsLabel: 'Đã ghé',
        locations: ['pho-co-dong-van'],
      },
      {
        title: 'Về xuôi theo đường Bắc Mê',
        body: [
          'Đường Bắc Mê dài hơn quốc lộ 4C khoảng bốn mươi cây số nhưng gần như không có đèo. Với chuyến này thì đó là đánh đổi đúng.',
        ],
        images: ['meo-vac.jpg'],
      },
    ],
  },
]

const slugChuyenDaCo = new Set<string>()
{
  const { docs } = await payload.find({
    collection: 'case-studies',
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  for (const doc of docs) slugChuyenDaCo.add(String(doc.slug))
}

let daTao = 0
for (const mau of CHUYEN_MAU) {
  if (slugChuyenDaCo.has(mau.slug)) {
    console.log(`  bỏ qua chuyến (đã có): ${mau.slug}`)
    continue
  }
  await payload.create({
    collection: 'case-studies',
    data: {
      slug: mau.slug,
      title: vi(mau.title),
      subtitle: vi(mau.subtitle),
      accent: mau.accent,
      heroImage: anh(mau.hero),
      thumbnail: anh(mau.thumbnail),
      highlights: doan(...mau.highlights),
      ourRole: doan(...mau.ourRole),
      days: mau.days.map((ngay) => ({
        title: vi(ngay.title),
        body: doan(...ngay.body),
        ...(ngay.images ? { images: ngay.images.map(anh) } : {}),
        ...(ngay.locationsLabel ? { locationsLabel: vi(ngay.locationsLabel) } : {}),
        ...(ngay.locations ? { locations: diaDiem(...ngay.locations) } : {}),
      })),
      seo: {
        title: vi(`${mau.title} — RosaTravel`),
        description: vi(mau.highlights[0].slice(0, 155)),
        ogImage: anh(mau.hero),
      },
    } as never,
  })
  daTao += 1
  console.log(`  đã tạo chuyến: ${mau.slug}`)
}

// ── Gắn địa điểm vào lịch trình một tour, để trang tour cũng có khối thẻ ─────

{
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: 'cao-nguyen-da-dong-van' } },
    depth: 0,
    limit: 1,
  })
  // Ép qua `unknown` trước: kiểu `Tour` sinh tự động không có index signature
  // nên TypeScript chặn phép ép thẳng sang Record<string, unknown>.
  const tour = docs[0] as unknown as Record<string, unknown> | undefined
  const itinerary = tour?.itinerary as Record<string, unknown>[] | undefined

  // Chỉ gắn khi CHƯA có gì — không đè lên lựa chọn người vận hành đã sắp.
  const chuaGan =
    Array.isArray(itinerary) &&
    itinerary.every((d) => !Array.isArray(d.locations) || d.locations.length === 0)

  if (tour && chuaGan && itinerary) {
    const theoNgay: Record<number, { label: string; slugs: string[] }> = {
      2: { label: 'Ngủ ở đâu', slugs: ['homestay-lung-cam'] },
      3: { label: 'Đã ghé', slugs: ['dinh-thu-ho-vuong', 'pho-co-dong-van'] },
      4: { label: 'Đã ghé', slugs: ['deo-ma-pi-leng', 'hem-vuc-tu-san'] },
      5: { label: 'Đã ghé', slugs: ['cho-phien-meo-vac'] },
    }
    await payload.update({
      collection: 'tours',
      id: String(tour.id),
      data: {
        itinerary: itinerary.map((ngay, index) => {
          const gan = theoNgay[index + 1]
          if (!gan) return ngay
          return {
            ...ngay,
            locationsLabel: vi(gan.label),
            locations: diaDiem(...gan.slugs),
          }
        }),
      } as never,
    })
    console.log('  gắn địa điểm vào lịch trình tour cao-nguyen-da-dong-van')
  } else {
    console.log('  bỏ qua gắn địa điểm vào tour (đã có, hoặc không tìm thấy tour)')
  }
}

console.log(`\nXong. ${daTao} chuyến đã đi được tạo mới.`)
console.log('Nhớ: đây là NỘI DUNG MẪU. Thay bằng nội dung thật trong /admin trước khi phát hành.')
process.exit(0)
