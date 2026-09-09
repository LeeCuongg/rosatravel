/**
 * BÀI KIỂM THỬ CẤU TRÚC: "New York City" dựng theo đúng bố cục case study của
 * spotstravel.co (?m=team-retreats&t=case).
 *
 * Chạy:   npx payload run scripts/seed-case-nyc.ts
 * Gỡ ra:  GO=1 npx payload run scripts/seed-case-nyc.ts
 *         (PowerShell: $env:GO='1'; npx payload run scripts/seed-case-nyc.ts)
 *
 * Bật/tắt bằng BIẾN MÔI TRƯỜNG chứ không phải cờ dòng lệnh: `payload run` nuốt
 * sạch mọi tham số phía sau tên tệp — process.argv trong script chỉ còn đúng
 * hai phần tử (node và bin.js). Đã đo. Một cờ `--go` ở đây sẽ không bao giờ
 * được đọc tới, và script lặng lẽ chạy nhánh TẠO trong khi người gõ đang muốn
 * XOÁ.
 *
 * MỤC ĐÍCH là đối chiếu, không phải xuất bản. Bài này tồn tại để soi xem mô
 * hình nội dung của mình có chỗ chứa cho MỌI thành phần mà một case study bên
 * Spots dùng hay không. Xem xong thì chạy `--go` để gỡ.
 *
 * BA ĐIỀU PHẢI BIẾT TRƯỚC KHI XEM:
 *
 * 1. ẢNH LÀ ẢNH MƯỢN. Thư viện ảnh hiện chỉ có ảnh Hà Giang, và script này cố
 *    tình KHÔNG tải ảnh mới lên Blob — thêm ảnh New York vào thư viện ảnh thật
 *    của site là việc phải do người quyết định, không phải do một script kiểm
 *    thử. Nên nội dung nói về Manhattan còn ảnh là ruộng bậc thang. Đúng như
 *    vậy: thứ đang kiểm là CHỖ CHỨA, không phải bức ảnh.
 *
 * 2. CHỮ LÀ CHỮ VIẾT LẠI, không phải bản dịch nguyên văn của Spots. Cùng
 *    chuyến, cùng địa điểm, cùng số ngày, cùng thứ tự — nhưng câu chữ là của
 *    mình. Chép nguyên văn bài biên tập của một công ty cùng ngành vào CMS
 *    đang chạy là chuyện khác hẳn với việc đối chiếu cấu trúc.
 *
 * 3. TRANG CHỦ SẼ CÓ 5 THẺ. Khối "Chuyến đã đi" chia bốn cột (xem CaseGrid),
 *    nên bài thứ năm rơi xuống hàng hai một mình. Đó là lý do có nhánh `--go`.
 *
 * Địa chỉ chỉ ghi ở những nơi chắc chắn; chỗ không chắc thì bỏ trống thay vì
 * đoán — `address` là trường tuỳ chọn.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const GO_RA = process.env.GO === '1'

/**
 * `ANH=1` gắn thử chú thích + nguồn vào MỘT ảnh, để xem hai trường mới hiện ra
 * thế nào dưới ảnh.
 *
 * Tách thành cờ riêng, mặc định TẮT, vì bản ghi ảnh dùng chung: `dong-van.jpg`
 * đang nằm trong cả bài "Hà Giang cho ba thế hệ". Gắn nguồn giả vào nó là in
 * một dòng bản quyền sai lên một bài thật. `GO=1` xoá lại cả hai trường.
 */
const GAN_CHU_THICH_ANH = process.env.ANH === '1'
const ANH_THU = 'dong-van.jpg'

const SLUG_CHUYEN = 'new-york-mot-tuan-thiet-ke'

const vi = (s: string) => ({ vi: s })
const doan = (...cac: string[]) => cac.map((x) => ({ vi: x }))

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
      `Không tìm thấy ảnh "${tenTep}". Đang có: ${[...anhTheoTen.keys()].join(', ')}`,
    )
  }
  return id
}

// ── ĐỊA ĐIỂM ─────────────────────────────────────────────────────────────────

interface DiaDiemMau {
  slug: string
  name: string
  category: 'an-uong' | 'luu-tru' | 'thien-nhien' | 'van-hoa' | 'cho-mua-sam'
  excerpt: string
  body: string[]
  address?: string
  images: string[]
}

const DIA_DIEM: DiaDiemMau[] = [
  {
    slug: 'square-diner',
    name: 'Square Diner',
    category: 'an-uong',
    excerpt: 'Quán ăn toa tàu ở Tribeca, mở từ thập niên 1940 và gần như không đổi.',
    body: [
      'Square Diner là một trong số ít quán ăn kiểu toa tàu còn sót lại ở New York — vỏ thép không gỉ, biển đèn neon, ghế băng bọc nhựa và một quầy dài chạy suốt chiều ngang. Khách quen ở đây tính bằng chục năm.',
      'Thực đơn đúng chuẩn diner: bánh kếp chồng cao, trứng ốp, bánh mì kẹp, cộng thêm vài món trong ngày. Tám giờ sáng gọi cà phê với trứng hay hai giờ chiều gọi một chiếc club sandwich đều không có gì lạc lõng.',
    ],
    address: '33 Leonard St, Tribeca, New York',
    images: ['dong-van.jpg', 'quan-ba.jpg'],
  },
  {
    slug: 'joes-pizza',
    name: "Joe's Pizza",
    category: 'an-uong',
    excerpt: 'Mở năm 1975 ở Greenwich Village, và là thước đo của miếng pizza New York.',
    body: [
      'Joe Pozzuoli, một người Napoli nhập cư, mở quán năm 1975 và từ đó tới nay chỉ làm cho thật tốt đúng một thứ: miếng pizza New York mỏng, gập đôi được, giòn ở rìa và dai ở giữa.',
      'Quán đã mở thêm vài cơ sở, nhưng tiệm gốc trong Village vẫn giữ nguyên dáng một hàng ăn khu phố — đứng ăn ngay vỉa hè, không bàn ghế, không đặt chỗ.',
    ],
    address: '7 Carmine St, Greenwich Village, New York',
    images: ['meo-vac.jpg'],
  },
  {
    slug: 'guggenheim-new-york',
    name: 'Guggenheim New York',
    category: 'van-hoa',
    excerpt: 'Toà nhà xoắn ốc của Frank Lloyd Wright trên Đại lộ Số Năm, mở cửa năm 1959.',
    body: [
      'Bản thân toà nhà mới là tác phẩm lớn nhất ở đây. Wright bỏ hẳn khái niệm phòng trưng bày xếp cạnh nhau, thay bằng một đường dốc xoắn liên tục — người xem đi lên và tranh hiện ra dọc đường, không có chỗ nào để dừng lại và quay đầu.',
      'Bộ sưu tập trải từ Kandinsky, Picasso đầu thế kỷ 20 tới nghệ thuật đương đại. Nhưng phần lớn người tới đây là để đi trong cái vòng xoắn đó.',
    ],
    address: '1071 Fifth Ave, New York',
    images: ['yen-minh.jpg', 'tour-ma-pi-leng.jpg'],
  },
  {
    slug: 'bao-tang-metropolitan',
    name: 'The Metropolitan Museum of Art',
    category: 'van-hoa',
    excerpt: 'Bảo tàng lớn nhất châu Mỹ, hơn hai triệu hiện vật trải năm nghìn năm.',
    body: [
      'Không ai xem hết The Met trong một ngày, và cũng không nên thử. Cách đi hợp lý là chọn trước hai hoặc ba cánh — Ai Cập, hội hoạ châu Âu, hoặc mái vườn trên tầng thượng vào mùa hè — rồi bỏ qua phần còn lại không tiếc.',
      'Bảo tàng nằm ngay rìa Central Park, nên buổi sáng trong bảo tàng và buổi chiều trong công viên là một ngày trọn vẹn không phải di chuyển.',
    ],
    address: '1000 Fifth Ave, New York',
    images: ['song-nho-que.jpg'],
  },
  {
    slug: 'apollo-bagels',
    name: 'Apollo Bagels',
    category: 'an-uong',
    excerpt: 'Bagel nướng lò củi, mẻ nhỏ, ủ lâu — bắt đầu từ một quầy pop-up mùa dịch.',
    body: [
      'Apollo mở ra giữa đại dịch dưới dạng một quầy bán tạm, rồi thành hiện tượng. Bagel ở đây ủ dài ngày và nướng lò củi: vỏ giòn, ruột mềm, và vị đậm hơn hẳn loại bagel công nghiệp.',
      'Ngoài lox với phô mai kem kiểu cổ điển còn có cá trắng hun khói, rau theo mùa và các loại schmear tự làm. Xếp hàng là chuyện bình thường.',
    ],
    address: '242 E 10th St, East Village, New York',
    images: ['tam-giac-mach.jpg'],
  },
  {
    slug: 'chelsea-market',
    name: 'Chelsea Market',
    category: 'cho-mua-sam',
    excerpt: 'Khu chợ ẩm thực trong nhà máy bánh quy Nabisco cũ, giữa Meatpacking District.',
    body: [
      'Toà nhà này từng là nhà máy của Nabisco — nơi chiếc bánh Oreo đầu tiên ra đời. Kết cấu gạch và ống thép công nghiệp được giữ nguyên, bên trong là vài chục quầy hàng: hải sản tươi, taco làm tay, tiệm bánh, quầy rượu vang.',
      'Đây là chỗ ăn nhanh giữa ngày mà không phải chọn trước sẽ ăn gì, và nằm ngay dưới chân High Line nên hợp để kẹp vào giữa một buổi đi bộ.',
    ],
    address: '75 Ninth Ave, Chelsea, New York',
    images: ['quan-ba.jpg', 'meo-vac.jpg'],
  },
  {
    slug: 'kasmin-gallery',
    name: 'Kasmin Gallery',
    category: 'van-hoa',
    excerpt: 'Phòng tranh đương đại cạnh High Line, có vườn tượng trên mái.',
    body: [
      'Kasmin là một trong những phòng tranh dẫn dắt khu Chelsea, đại diện cho cả tên tuổi đã thành danh lẫn nghệ sĩ mới, trải từ hội hoạ, điêu khắc tới sắp đặt.',
      'Vườn tượng trên mái nhìn thẳng xuống High Line — người đi bộ trên đường dạo nhìn được tác phẩm mà không cần vào trong, và đó là một phần chủ ý của thiết kế.',
    ],
    address: '509 W 27th St, Chelsea, New York',
    images: ['ruong-bac-thang.jpg'],
  },
  {
    slug: 'st-jardim',
    name: 'St Jardim',
    category: 'an-uong',
    excerpt: 'Quán nhỏ ở West Village, bàn sát nhau và thực đơn ngắn.',
    body: [
      'Phòng ăn nhỏ, bàn kê gần nhau, thực đơn chỉ vài món đổi theo tuần. Không phải chỗ để họp nhóm đông; là chỗ để bốn hoặc sáu người ngồi nói chuyện được với nhau suốt bữa.',
      'Đặt bàn trước là bắt buộc, và nên đặt sớm.',
    ],
    images: ['dong-van.jpg'],
  },
  {
    slug: 'employees-only',
    name: 'Employees Only',
    category: 'an-uong',
    excerpt: 'Quán cocktail West Village mở từ 2004, sau một cánh cửa không biển hiệu.',
    body: [
      'Mặt tiền chỉ có tấm biển thầy bói, cửa vào không đề tên. Bên trong là một quán bar art déco mở tới rạng sáng, và là một trong những nơi khởi đầu làn sóng cocktail thủ công ở New York đầu những năm 2000.',
      'Bếp mở muộn, nên đây cũng là chỗ ăn khuya sau khi mọi hàng quán khác đã đóng.',
    ],
    address: '510 Hudson St, West Village, New York',
    images: ['song-nho-que.jpg'],
  },
  {
    slug: 'sip-guzzle',
    name: 'Sip & Guzzle',
    category: 'an-uong',
    excerpt: 'Hai tầng, hai kiểu uống: tầng trên tinh chỉnh, tầng dưới ồn ào.',
    body: [
      'Do Shingo Gokan — người pha chế Nhật đứng sau nhiều quán bar hàng đầu châu Á — dựng lên, mang tinh thần quán bar Tokyo sang New York bằng một khái niệm chia đôi.',
      '"Sip" ở tầng trên là các bản cocktail cổ điển nặng rượu nền, làm rất kỹ. "Guzzle" ở tầng dưới thì dễ uống, ồn ào, đông. Cùng một địa chỉ, hai buổi tối hoàn toàn khác nhau.',
    ],
    images: ['tour-ma-pi-leng.jpg'],
  },
  {
    slug: 'ace-hotel-brooklyn',
    name: 'Ace Hotel Brooklyn',
    category: 'luu-tru',
    excerpt: 'Khách sạn bê tông và gỗ ở Downtown Brooklyn, sảnh mở làm chỗ ngồi làm việc.',
    body: [
      'Ace Brooklyn là bản xây mới hoàn toàn chứ không phải cải tạo nhà cũ: bê tông thô, gỗ sồi, trần cao. Sảnh tầng trệt rộng và mở, ban ngày thành chỗ ngồi làm việc cho cả khách lẫn dân trong khu.',
      'Vị trí ở Downtown Brooklyn, cách Manhattan vài bến tàu điện ngầm — hợp với nhóm đông muốn ở tập trung mà không trả giá phòng khu Midtown.',
    ],
    address: '252 Schermerhorn St, Brooklyn, New York',
    images: ['hero-ha-giang.jpg'],
  },
  {
    slug: 'nine-orchard',
    name: 'Nine Orchard',
    category: 'luu-tru',
    excerpt: 'Ngân hàng năm 1912 ở Lower East Side, phục dựng thành khách sạn.',
    body: [
      'Toà nhà nguyên là trụ sở Jarmulowsky Bank xây năm 1912, bỏ hoang nhiều thập kỷ trước khi được phục dựng. Phần lớn chi tiết gốc — trần chạm, đá lát, khung cửa — được giữ lại thay vì làm mới.',
      'Số phòng ít, nằm ở Lower East Side, đi bộ được sang Chinatown và Bowery. Hợp với nhóm nhỏ hơn là đoàn đông.',
    ],
    address: '9 Orchard St, Lower East Side, New York',
    images: ['yen-minh.jpg'],
  },
]

// ── NGÀY ─────────────────────────────────────────────────────────────────────

interface NgayMau {
  title: string
  body: string[]
  images?: string[]
  /** Bỏ trống = 'dai'. Đặt 'xen' ở vài ngày để so hai nhịp đọc cạnh nhau. */
  imageLayout?: 'dai' | 'xen'
  locationsLabel?: string
  locations?: string[]
}

const NGAY: NgayMau[] = [
  {
    title: 'Chào New York theo lối cổ điển',
    body: [
      'Chuyến đi mở đầu bằng bữa brunch ở một quán ăn lâu đời — chọn vì chỗ đứng của nó trong lịch sử thành phố như một điểm hẹn của cả dân bản địa lẫn người mới tới. Đủ xuề xoà để không ai thấy gượng, mà vẫn đủ trang trọng cho bữa đầu tiên cả đội ngồi chung một bàn.',
      'Từ đó nhóm đi bộ qua khu tài chính Wall Street rồi lên phà sang vịnh. Với các thành viên từ Đài Loan, Tượng Nữ thần Tự do không chỉ là biểu tượng: đó là lần đầu họ chạm mặt nước Mỹ.',
      'Bữa tối là pizza New York — không phải vì sáo mòn, mà vì nó là bàn ăn không có thứ bậc, ai cũng ngồi xuống được. Buổi tối khép lại bằng đoạn đi bộ qua cầu Brooklyn lúc chạng vạng, đường chân trời thành phố trải ra phía trước.',
    ],
    images: ['dong-van.jpg', 'meo-vac.jpg'],
    imageLayout: 'xen',
    locationsLabel: 'Ăn ở đâu',
    locations: ['square-diner', 'joes-pizza'],
  },
  {
    title: 'Nghệ thuật, công viên và một đêm ồn ào',
    body: [
      'Ngày này để ngỏ cho lựa chọn cá nhân. Một nửa nhóm chọn Guggenheim vì kiến trúc, nửa còn lại chọn The Met vì bề dày cổ điển. Cả hai hướng đều đúng, và đó chính là điểm của ngày.',
      'Giữa trưa cả nhóm gặp lại nhau ở Central Park cho một bữa picnic với bagel mua từ tiệm dưới phố. Ngồi cạnh hồ, nhịp ngày chậm hẳn lại, và đó là khoảng trống cần thiết trước buổi tối.',
      'Bữa tối ở Koreatown với thịt nướng Hàn — kiểu ăn chung một vỉ, ai cũng phải với tay, không ai ngồi yên được. Ồn, đông, và đúng tinh thần của thành phố này.',
    ],
    images: ['yen-minh.jpg', 'song-nho-que.jpg'],
    locationsLabel: 'Điểm chúng tôi chọn',
    locations: ['guggenheim-new-york', 'bao-tang-metropolitan', 'apollo-bagels'],
  },
  {
    title: 'Thiết kế ở trung tâm',
    body: [
      'Thiết kế là lý do của cả chuyến, nên ngày thứ ba mở đầu bằng một buổi vào riêng Herb Lubalin Study Center ở Cooper Union. Trung tâm đóng cửa dành riêng cho nhóm, và họ được cầm tận tay bản gốc trong kho lưu trữ — thứ mà một buổi tham quan thường không bao giờ có.',
      'Buổi chiều cân lại nhịp: đi bộ dọc High Line, ăn nhanh ở Chelsea Market, rồi tạt vào vài phòng tranh trong khu. Tối kéo về West Village, chọn quán nhỏ để cả nhóm tách thành từng bàn bốn năm người thay vì một bàn dài.',
    ],
    images: ['quan-ba.jpg', 'ruong-bac-thang.jpg'],
    imageLayout: 'xen',
    locationsLabel: 'Điểm chúng tôi chọn',
    locations: ['chelsea-market', 'kasmin-gallery', 'st-jardim', 'employees-only', 'sip-guzzle'],
  },
  {
    title: 'Manhattan nhìn từ trên cao',
    body: [
      'Ngày thứ tư để trống cho mỗi người tự đi theo hướng mình muốn. Cuối chiều cả nhóm gặp lại ở Summit One Vanderbilt, và giờ vào được đặt sao cho vắt qua cả ánh sáng ban ngày lẫn giờ vàng — cùng một khung nhìn, hai thành phố khác nhau.',
      'Buổi tối là một vở Broadway. Không đặt ra như một buổi giải trí mà như một nghi thức nhập môn: sau đó cả nhóm có chung một thứ để nhắc lại.',
    ],
    images: ['tour-ma-pi-leng.jpg'],
  },
  {
    title: 'Sáng tạo và gắn kết',
    body: [
      'Giữa tuần, trọng tâm chuyển sang thứ sẽ còn lại sau chuyến đi. Chúng tôi bố trí một buổi chụp ảnh studio chuyên nghiệp để đánh dấu lần đầu tiên cả đội có mặt cùng một chỗ — chân dung, và cả những khung hình lúc họ đang làm việc với nhau.',
      'Buổi tối là bữa ăn riêng tư nhất chuyến: nấu và dọn ngay tại nhà người sáng lập, cố ý không đặt nhà hàng. Ngồi trong một căn bếp thật khiến ranh giới giữa đồng nghiệp và bạn bè mờ đi theo cách mà không bàn ăn nhà hàng nào làm được.',
    ],
    images: ['tam-giac-mach.jpg'],
  },
  {
    title: 'Ly cuối cùng',
    body: [
      'Chuyến đi khép lại ở Bar Blondeau, một quán trên mái nhìn sang đường chân trời Manhattan, đặt riêng cho một buổi tối mở rộng ra ngoài phạm vi công ty: cộng sự cũ, đối tác hiện tại, và bạn bè thân của studio.',
      'Đèn thành phố phía sau, và buổi tối đó không đọc ra như một lời chia tay. Nó là điểm bắt đầu của chương tiếp theo.',
    ],
    images: ['hero-ha-giang.jpg'],
  },
]

/**
 * Chỗ ở đi vào khối RIÊNG ở cuối bài, không bám vào ngày nào — giống hệt khối
 * "Suggested Accomodations" của Spots, kể cả nhãn đếm bên phải.
 */
const CHO_O = ['ace-hotel-brooklyn', 'nine-orchard']

const HIGHLIGHTS = [
  'Khi View Source — một studio thiết kế thành lập giữa đại dịch — lên kế hoạch cho lần gặp mặt trực tiếp đầu tiên, việc cần làm không dừng ở khâu hậu cần. Đây là một cột mốc: nối trụ sở New York với đội ở Đài Loan sau hai năm chỉ làm việc qua màn hình.',
  'Chúng tôi thiết kế một chuyến bảy ngày trộn những biểu tượng của thành phố với các trải nghiệm đặt riêng cho đội này. Từ những buổi đi bộ có người dẫn qua các khu phố cũ tới bữa tối trong không gian kín, mỗi chi tiết đều cân giữa khám phá và gắn kết. Với nhiều người trong nhóm, đây là lần đầu tới New York — và chuyến đi được dựng để họ ở đó như khách mời, không phải như khách du lịch.',
]

const OUR_ROLE = [
  'Điều phối vé bay và đưa đón cho một đội ở hai châu lục',
  'Thương lượng giá đoàn và giữ chỗ ở khu trung tâm',
  'Trộn các điểm biểu tượng của New York với những buổi riêng đặt trước',
]

// ── Thực thi ─────────────────────────────────────────────────────────────────

if (GO_RA) {
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: SLUG_CHUYEN } },
    depth: 0,
    limit: 1,
  })
  for (const doc of docs) {
    await payload.delete({ collection: 'case-studies', id: String(doc.id) })
    console.log(`  đã gỡ chuyến: ${SLUG_CHUYEN}`)
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
  {
    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: ANH_THU } },
      depth: 0,
      limit: 1,
    })
    for (const doc of docs) {
      await payload.update({
        collection: 'media',
        id: String(doc.id),
        data: { caption: { vi: '' }, credit: '' } as never,
      })
      console.log(`  đã xoá chú thích thử trên ảnh: ${ANH_THU}`)
    }
  }
  console.log('Xong. Trang chủ trở lại bốn thẻ.')
  process.exit(0)
}

if (GAN_CHU_THICH_ANH) {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: ANH_THU } },
    depth: 0,
    limit: 1,
  })
  for (const doc of docs) {
    await payload.update({
      collection: 'media',
      id: String(doc.id),
      data: {
        caption: { vi: 'Chụp lúc 5h sáng, trước khi sương dưới thung lũng tan.' },
        credit: '© Ảnh thử — xoá bằng GO=1',
      } as never,
    })
    console.log(`  đã gắn chú thích thử vào ảnh: ${ANH_THU}`)
  }
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
      excerpt: vi(mau.excerpt),
      body: doan(...mau.body),
      // Cả mười hai địa điểm đều ở một thành phố nên hằng luôn. Trường này để
      // phân biệt hai nơi trùng tên ở hai vùng — vô nghĩa với site một vùng,
      // cần ngay khi có vùng thứ hai.
      city: 'New York',
      ...(mau.address ? { address: mau.address } : {}),
      images: mau.images.map(anh),
      seo: {
        title: vi(`${mau.name} — New York`),
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

{
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: SLUG_CHUYEN } },
    depth: 0,
    limit: 1,
  })
  if (docs.length > 0) {
    console.log(`  bỏ qua chuyến (đã có): ${SLUG_CHUYEN}`)
  } else {
    await payload.create({
      collection: 'case-studies',
      data: {
        slug: SLUG_CHUYEN,
        title: vi('New York City'),
        subtitle: vi('Một tuần thiết kế, văn hoá và gắn kết đội ngũ'),
        // Spots gán màu xanh dương (--cr-blue-d) cho đúng thẻ New York này.
        accent: 'chi-lam',
        heroImage: anh('hero-ha-giang.jpg'),
        thumbnail: anh('dong-van.jpg'),
        highlights: doan(...HIGHLIGHTS),
        ourRole: doan(...OUR_ROLE),
        days: NGAY.map((ngay) => ({
          title: vi(ngay.title),
          body: doan(...ngay.body),
          ...(ngay.images ? { images: ngay.images.map(anh) } : {}),
          ...(ngay.imageLayout ? { imageLayout: ngay.imageLayout } : {}),
          ...(ngay.locationsLabel ? { locationsLabel: vi(ngay.locationsLabel) } : {}),
          ...(ngay.locations ? { locations: diaDiem(...ngay.locations) } : {}),
        })),
        accommodationsLabel: vi('Gợi ý chỗ ở'),
        accommodations: diaDiem(...CHO_O),
        seo: {
          title: vi('New York City — RosaTravel'),
          description: vi(HIGHLIGHTS[0].slice(0, 155)),
          ogImage: anh('hero-ha-giang.jpg'),
        },
      } as never,
    })
    console.log(`  đã tạo chuyến: ${SLUG_CHUYEN}`)
  }
}

console.log(`\nXem tại /vi/chuyen-di/${SLUG_CHUYEN}`)
console.log('Gỡ ra:  GO=1 npx payload run scripts/seed-case-nyc.ts')
process.exit(0)
