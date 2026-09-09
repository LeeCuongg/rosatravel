/**
 * TOUR THẬT: "Nam Ninh - Quảng Châu - Chu Hải - Thâm Quyến 4N3D", dựng từ
 * chính file chương trình trong docs/.
 *
 * Chạy:   npx payload run scripts/seed-tour-canton-fair.ts
 * Gỡ ra:  GO=1 npx payload run scripts/seed-tour-canton-fair.ts
 *         (PowerShell: $env:GO='1'; npx payload run scripts/seed-tour-canton-fair.ts)
 *
 * Khác mọi script seed trước ở MỘT điểm quan trọng: script này TẢI ẢNH THẬT
 * LÊN Blob. Đây là nội dung thật sắp bán, không phải hàng mẫu để đối chiếu, nên
 * ảnh Hà Giang mượn tạm sẽ là sai chứ không phải tiết kiệm.
 *
 * ẢNH LẤY THẲNG TỪ FILE .DOCX, không qua thư mục trung gian. Chép ảnh ra một
 * chỗ nào đó rồi trỏ script vào đó thì script chỉ chạy được đúng một lần trên
 * đúng một máy; đọc thẳng từ file gốc thì ai có repo cũng chạy lại được và
 * không có bản sao nào trôi nổi để lệch nhau.
 *
 * Phần lớn ảnh trong file là DẢI GHÉP ba tấm nằm ngang (2048x702). Dùng
 * nguyên dải thì mỗi ô ảnh trên trang chỉ hiện được một phần ba, nên script
 * cắt sẵn ra từng tấm — xem bảng ANH bên dưới, cột `o` là ô thứ mấy trong dải.
 *
 * ĐỘ PHÂN GIẢI: ảnh gốc trong file chỉ rộng 682px sau khi cắt, thấp hơn mốc
 * 2400px mà Thư viện ảnh khuyến nghị. Payload vẫn nhận và trang vẫn chạy, chỉ
 * là ảnh sẽ mềm trên màn hình lớn. Có ảnh gốc chất lượng cao hơn thì thay
 * trong /admin, không cần sửa script.
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import zlib from 'node:zlib'
import sharp from 'sharp'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const GO_RA = process.env.GO === '1'

const SLUG_TOUR = 'canton-fair-quang-chau-4n3d'
const FILE_DOCX =
  'docs/LMQC. Nam Ninh - Quảng Châu Canton Fair - Chu Hải - Thâm Quyến 4N3D (ô tô, tàu cao tốc) - 15+22+29.10.2026.docx'

const vi = (s: string) => ({ vi: s })

// ── Đọc file .docx (là một file ZIP) ────────────────────────────────────────
//
// Tự đọc thay vì thêm thư viện giải nén: dự án chưa có cái nào, và kéo về một
// gói chỉ để lấy vài tấm ảnh trong một script chạy tay là đổi rủi ro phụ thuộc
// lấy ba chục dòng code. Chỉ cần đọc, không cần ghi, và chỉ gặp hai kiểu nén
// mà Word dùng (0 = để nguyên, 8 = deflate).

function docFileZip(duongDan: string): Map<string, Buffer> {
  const buf = fs.readFileSync(duongDan)

  // EOCD nằm ở CUỐI file và có độ dài thay đổi (vì kèm comment), nên phải dò
  // ngược từ cuối lên chứ không đọc được ở một vị trí cố định.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error(`Không đọc được ${duongDan}: thiếu End of Central Directory`)

  const soMuc = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const ket = new Map<string, Buffer>()

  for (let i = 0; i < soMuc; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Central directory hỏng')
    const kieuNen = buf.readUInt16LE(p + 10)
    const coNen = buf.readUInt32LE(p + 20)
    const daiTen = buf.readUInt16LE(p + 28)
    const daiExtra = buf.readUInt16LE(p + 30)
    const daiChuThich = buf.readUInt16LE(p + 32)
    const viTriLocal = buf.readUInt32LE(p + 42)
    const ten = buf.toString('utf8', p + 46, p + 46 + daiTen)

    if (ten.startsWith('word/media/')) {
      // Local header có độ dài extra RIÊNG, thường khác central directory —
      // dùng nhầm con số của central là đọc lệch vài byte và giải nén vỡ.
      const daiTenL = buf.readUInt16LE(viTriLocal + 26)
      const daiExtraL = buf.readUInt16LE(viTriLocal + 28)
      const dau = viTriLocal + 30 + daiTenL + daiExtraL
      const raw = buf.subarray(dau, dau + coNen)
      ket.set(path.basename(ten), kieuNen === 0 ? raw : zlib.inflateRawSync(raw))
    }

    p += 46 + daiTen + daiExtra + daiChuThich
  }
  return ket
}

// ── Bảng ảnh ────────────────────────────────────────────────────────────────

interface AnhMau {
  /** Tên file sẽ nằm trong Thư viện ảnh. Tiền tố `ct-` để không đụng ảnh Hà Giang. */
  ten: string
  /** Tên ảnh trong file .docx. */
  nguon: string
  /** Ô thứ mấy (1-3) nếu nguồn là dải ghép ngang. Bỏ trống = dùng cả tấm. */
  o?: 1 | 2 | 3
  alt: string
}

const ANH: AnhMau[] = [
  {
    ten: 'ct-chau-giang-dem.jpg',
    nguon: 'image16.png',
    o: 1,
    alt: 'Đường chân trời Quảng Châu bên sông Châu Giang về đêm, du thuyền đi ngang',
  },
  {
    ten: 'ct-cau-liede.jpg',
    nguon: 'image16.png',
    o: 3,
    alt: 'Cầu Liede ở Quảng Châu lên đèn xanh, ánh sáng hắt xuống mặt sông ban đêm',
  },
  {
    ten: 'ct-pho-dem-quang-chau.jpg',
    nguon: 'image14.png',
    o: 1,
    alt: 'Biển chữ Hán "Tôi ở Quảng Châu" trên một dãy phố ăn uống đông người buổi tối',
  },
  {
    ten: 'ct-dimsum.jpg',
    nguon: 'image9.png',
    o: 2,
    alt: 'Mâm dimsum Quảng Châu với những xửng hấp bằng tre xếp chồng lên nhau',
  },
  {
    ten: 'ct-chua-dai-phat.jpg',
    nguon: 'image15.png',
    o: 2,
    alt: 'Kiến trúc gỗ sơn đỏ của một ngôi chùa cổ ở Quảng Châu lên đèn buổi tối',
  },
  {
    ten: 'ct-nhat-nguyet-boi-dem.jpg',
    nguon: 'image5.png',
    o: 2,
    alt: 'Nhà hát Nhật Nguyệt Bối ở Chu Hải lên đèn tím ban đêm, nhìn từ trên cao',
  },
  {
    ten: 'ct-nhat-nguyet-boi-ngay.jpg',
    nguon: 'image5.png',
    o: 1,
    alt: 'Hai mái vỏ sò trắng của Nhà hát Nhật Nguyệt Bối bên bờ biển Chu Hải',
  },
  {
    ten: 'ct-canton-fair-gian-hang.jpg',
    nguon: 'image11.jpg',
    alt: 'Các gian hàng máy móc trong nhà triển lãm Canton Fair nhìn từ trên cao',
  },
  {
    ten: 'ct-canton-fair-bien.jpg',
    nguon: 'image12.jpg',
    alt: 'Biển hiệu Canton Fair 2026 trước Trung tâm Hội chợ Xuất nhập khẩu Quảng Châu',
  },
  {
    ten: 'ct-hoa-cuong-bac.jpg',
    nguon: 'image6.png',
    o: 1,
    alt: 'Mặt tiền Trung tâm thương mại điện tử Hoa Cường Bắc ở Thâm Quyến',
  },
  {
    ten: 'ct-cong-vien-nhan-tai.jpg',
    nguon: 'image8.png',
    o: 3,
    alt: 'Những toà cao ốc Thâm Quyến soi bóng xuống mặt hồ trong Công viên Nhân Tài',
  },
  {
    ten: 'ct-hoa-vang-tham-quyen.jpg',
    nguon: 'image8.png',
    o: 2,
    alt: 'Hoa phong linh vàng nở trước những toà cao ốc ở Thâm Quyến',
  },
  {
    ten: 'ct-lau-sua.jpg',
    nguon: 'image17.png',
    o: 2,
    alt: 'Nồi lẩu đang sôi giữa bàn, xung quanh là các đĩa đồ nhúng',
  },
]

// ── ĐỊA ĐIỂM ────────────────────────────────────────────────────────────────

interface DiaDiemMau {
  slug: string
  name: string
  category: 'an-uong' | 'luu-tru' | 'thien-nhien' | 'van-hoa' | 'cho-mua-sam'
  city: string
  excerpt: string
  body: string[]
  images: string[]
}

const DIA_DIEM: DiaDiemMau[] = [
  {
    slug: 'nha-hat-nhat-nguyet-boi',
    name: 'Nhà hát Nhật Nguyệt Bối',
    category: 'van-hoa',
    city: 'Chu Hải',
    excerpt: 'Hai mái vỏ sò trắng trên hòn đảo nhân tạo ven biển, biểu tượng của Chu Hải.',
    body: [
      'Công trình gồm hai khối nhà hình vỏ sò đặt trên một hòn đảo nhân tạo sát biển, tượng trưng cho mặt trời và mặt trăng — cái tên Nhật Nguyệt Bối đến từ đó.',
      'Ban ngày hai mái vỏ sò trắng nổi bật trên nền biển; buổi tối chúng được chiếu sáng đổi màu và trở thành khung hình quen thuộc nhất của thành phố.',
    ],
    images: ['ct-nhat-nguyet-boi-dem.jpg', 'ct-nhat-nguyet-boi-ngay.jpg'],
  },
  {
    slug: 'canton-fair-quang-chau',
    name: 'Hội chợ Canton Fair',
    category: 'cho-mua-sam',
    city: 'Quảng Châu',
    excerpt: 'Hội chợ Xuất nhập khẩu Trung Quốc, kỳ 140 tổ chức tháng 10.2026.',
    body: [
      'Canton Fair là hội chợ hàng xuất nhập khẩu lớn nhất Trung Quốc, chia thành ba đợt với nhóm ngành hàng khác nhau — nên chọn ngày khởi hành cũng là chọn xem gì.',
      'Đợt 1 (15/10) là máy móc, thiết bị công nghiệp, điện tử, điện gia dụng, năng lượng mới, xe cộ và linh kiện. Đợt 2 (22/10) là hàng tiêu dùng, quà tặng, nội thất, vật liệu xây dựng, thiết bị vệ sinh, gốm sứ. Đợt 3 (29/10) là dệt may, giày dép, thời trang, đồ chơi, thiết bị y tế, thực phẩm và sản phẩm chăm sóc cá nhân.',
      'Thư mời vào hội chợ đã nằm trong giá tour.',
    ],
    images: ['ct-canton-fair-gian-hang.jpg', 'ct-canton-fair-bien.jpg'],
  },
  {
    slug: 'hoa-cuong-bac',
    name: 'Chợ điện tử Hoa Cường Bắc',
    category: 'cho-mua-sam',
    city: 'Thâm Quyến',
    excerpt: 'Hàng chục toà nhà cao tầng chứa đầy linh kiện và thiết bị công nghệ.',
    body: [
      'Quy mô là thứ gây choáng trước tiên: không phải một khu chợ mà là hàng chục toà nhà cao tầng, mỗi tầng lại chia thành hàng trăm quầy nhỏ bán linh kiện và phụ kiện.',
      'Tai nghe, đồng hồ thông minh, sạc dự phòng, đồ chơi công nghệ — mua được ở đây với giá gốc. Nên biết trước mình cần gì, vì đi lang thang không mục đích thì hết buổi mà chưa xem xong một toà.',
    ],
    images: ['ct-hoa-cuong-bac.jpg'],
  },
  {
    slug: 'thanh-co-nam-dau',
    name: 'Thành cổ Nam Đầu',
    category: 'van-hoa',
    city: 'Thâm Quyến',
    excerpt: 'Di tích gần 1.700 năm ở quận Nam Sơn, giữa lòng một siêu đô thị.',
    body: [
      'Thành cổ Nam Đầu (Nantou) có lịch sử gần 1.700 năm và là di tích tiêu biểu nhất của Thâm Quyến — thứ hiếm hoi còn lại từ trước khi nơi này thành đô thị.',
      'Giá trị của nó nằm ở tương phản: khu thành cổ nằm ngay giữa một thành phố mới hoàn toàn, và nó đã chứng kiến Thâm Quyến đi từ một làng chài nhỏ tới hình dạng hiện tại.',
    ],
    images: ['ct-cong-vien-nhan-tai.jpg'],
  },
  {
    slug: 'thap-quang-chau',
    name: 'Tháp Quảng Châu',
    category: 'van-hoa',
    city: 'Quảng Châu',
    excerpt: 'Tháp truyền hình cao nhất châu Á, có đài quan sát ngoài trời ở độ cao 450m.',
    body: [
      'Tháp Quảng Châu là tháp cao nhất châu Á và đứng thứ tư thế giới. Đài quan sát ngoài trời ở độ cao 450m là đài lớn và cao thứ hai thế giới, nhìn ra toàn cảnh thành phố.',
      'Buổi tối tháp sáng bằng hệ thống đèn LED đổi màu liên tục, và đó là lúc phần lớn người ta tới. Nhìn từ Quảng trường Hoa Thành phía đối diện là góc quen thuộc nhất.',
    ],
    images: ['ct-cau-liede.jpg'],
  },
  {
    slug: 'pho-di-bo-bac-kinh',
    name: 'Phố đi bộ Bắc Kinh Lộ',
    category: 'cho-mua-sam',
    city: 'Quảng Châu',
    excerpt: 'Khu mua sắm nhộn nhịp nhất Quảng Châu, có tầng di tích khảo cổ dưới lòng phố.',
    body: [
      'Trung tâm thương mại, cửa hàng thời trang, mỹ phẩm và quán ăn đặc sản dồn vào một trục phố đi bộ — chỗ vừa mua sắm vừa ăn tối được mà không phải di chuyển.',
      'Điểm không nơi nào có: ngay dưới lòng phố là các tầng di tích khảo cổ được giữ nguyên và lắp kính lên trên, đi bộ bên trên nhìn thẳng xuống được.',
      'Chùa Đại Phật nằm ngay trên trục phố này — một trong năm ngôi chùa Phật giáo nổi tiếng của Quảng Châu, dựng từ triều Nam Hán (917-971).',
    ],
    images: ['ct-chua-dai-phat.jpg', 'ct-pho-dem-quang-chau.jpg'],
  },
]

// ── LỊCH TRÌNH ──────────────────────────────────────────────────────────────
//
// HAI TẦNG, hai người đọc khác nhau:
//
//   description — một đoạn tóm tắt cả ngày, cho người đang cân nhắc đặt tour.
//   schedule    — từng mốc giờ, cho người đã đặt rồi và cần biết mấy giờ phải
//                 có mặt ở đâu.
//
// Bản trước nhồi cả hai vào `description` thành một đoạn dài đặc, và kết quả là
// không nhóm nào đọc được cho ra hồn.

interface NgayMau {
  title: string
  description: string
  /** Mốc giờ. `gio` để trống khi việc đó chỉ định vị bằng buổi. */
  schedule?: { gio?: string; viec: string }[]
  images?: string[]
  locationsLabel?: string
  locations?: string[]
}

const LICH_TRINH: NgayMau[] = [
  {
    title: 'Hà Nội – Hữu Nghị – Nam Ninh – Quảng Châu',
    description:
      'Ngày di chuyển dài nhất chuyến: qua cửa khẩu Hữu Nghị Quan, chạy cao tốc Trung Quốc – ASEAN tới Nam Ninh, rồi nối tàu cao tốc đêm về Quảng Châu.',
    schedule: [
      {
        gio: '05h00',
        viec: 'Xe và hướng dẫn viên đón đoàn tại Nhà hát lớn Hà Nội, khởi hành đi cửa khẩu Hữu Nghị Quan, tỉnh Lạng Sơn. Ăn sáng dọc đường, chi phí tự túc.',
      },
      {
        gio: '12h00',
        viec: 'Ăn trưa tại Bằng Tường, cách cửa khẩu 18km. Sau đó đi Nam Ninh theo cao tốc Trung Quốc – ASEAN.',
      },
      { gio: 'Chiều', viec: 'Tới ga Nam Ninh Đông, dùng bữa tối tại nhà hàng.' },
      {
        gio: '20h33',
        viec: 'Lên tàu cao tốc D3647 đi Quảng Châu, tới ga Quảng Đông Nam lúc 23h40.',
      },
      { gio: 'Tối', viec: 'Xe đưa đoàn về khách sạn tại Quảng Châu nhận phòng, nghỉ đêm.' },
    ],
    images: ['ct-chau-giang-dem.jpg'],
  },
  {
    title: 'Quảng Châu – Chu Hải – Thâm Quyến',
    description:
      'Ba thành phố trong một ngày, nối bằng cầu vượt biển dài nhất thế giới. Buổi sáng dành cho biểu tượng của Chu Hải, buổi chiều cho hai mặt của Thâm Quyến: chợ điện tử hiện đại và thành cổ gần 1.700 năm.',
    schedule: [
      { gio: '06h15', viec: 'Ăn sáng, trả phòng và lên xe đi Chu Hải.' },
      {
        gio: 'Trên đường',
        viec: 'Tham quan cầu vượt biển Trung Sơn – Chu Hải, hệ thống cầu và hầm vượt biển dài nhất thế giới.',
      },
      {
        viec: 'Nhà hát Nhật Nguyệt Bối — hai khối nhà hình vỏ sò trên đảo nhân tạo ven biển, biểu tượng của thành phố.',
      },
      { gio: '12h00', viec: 'Ăn trưa tại nhà hàng.' },
      {
        gio: 'Chiều',
        viec: 'Sang Thâm Quyến, tham quan và mua sắm tại Trung tâm thương mại điện tử Hoa Cường Bắc.',
      },
      { viec: 'Thành cổ Nam Đầu ở quận Nam Sơn, di tích lịch sử tiêu biểu nhất của Thâm Quyến.' },
      { gio: '19h00', viec: 'Ăn tối tại nhà hàng, nhận phòng khách sạn tại Thâm Quyến.' },
    ],
    images: ['ct-nhat-nguyet-boi-dem.jpg', 'ct-hoa-cuong-bac.jpg'],
    locationsLabel: 'Điểm tham quan',
    locations: ['nha-hat-nhat-nguyet-boi', 'hoa-cuong-bac', 'thanh-co-nam-dau'],
  },
  {
    title: 'Thâm Quyến – Canton Fair Quảng Châu',
    description:
      'Ngày chính của chuyến đi: buổi chiều vào Hội chợ Canton Fair lần thứ 140. Buổi sáng khép lại phần Thâm Quyến, buổi tối dành cho trung tâm Quảng Châu.',
    schedule: [
      { gio: 'Sáng', viec: 'Ăn sáng và làm thủ tục trả phòng tại khách sạn.' },
      {
        viec: 'Thương hiệu Đông y hơn 350 năm, từng là Ngự dược phòng cho các triều đại nhà Thanh. Khách có thể bắt mạch và nghe tư vấn sức khoẻ.',
      },
      {
        viec: 'Quảng trường Văn hoá Thâm Quyến và Công viên Nhân Tài, sau đó di chuyển về Quảng Châu.',
      },
      { gio: 'Trưa', viec: 'Thưởng thức dimsum tại nhà hàng.' },
      {
        gio: 'Chiều',
        viec: 'Vào Hội chợ Canton Fair Quảng Châu lần thứ 140. Thư mời tham quan đã bao gồm trong giá tour.',
      },
      {
        gio: 'Chiều muộn',
        viec: 'Rời hội chợ, ra Quảng trường Hoa Thành — quảng trường lớn nhất Quảng Châu — ngắm Tháp Quảng Châu từ xa.',
      },
      {
        gio: 'Tối',
        viec: 'Phố đi bộ Bắc Kinh Lộ và Chùa Đại Phật. Bữa tối tự túc tại phố đi bộ, nghỉ đêm tại Quảng Châu.',
      },
    ],
    images: ['ct-canton-fair-gian-hang.jpg', 'ct-dimsum.jpg'],
    locationsLabel: 'Điểm tham quan',
    locations: ['canton-fair-quang-chau', 'thap-quang-chau', 'pho-di-bo-bac-kinh'],
  },
  {
    title: 'Quảng Châu – Nam Ninh – Hữu Nghị Quan – Hà Nội',
    description:
      'Ngày về, đi ngược cung đường hôm đầu nhưng bằng chuyến tàu ban ngày. Điểm dừng đáng nhớ nhất nằm ở bữa trưa: món lẩu sữa đặc sản Quảng Tây.',
    schedule: [
      { gio: 'Sáng', viec: 'Ăn sáng tại khách sạn, lên xe ra ga Quảng Châu Nam.' },
      { gio: '09h00', viec: 'Tàu cao tốc D4234 về ga Nam Ninh Đông, tới nơi lúc 11h48.' },
      { gio: 'Trưa', viec: 'Ăn trưa tại Nam Ninh với món lẩu sữa đặc sản Quảng Tây.' },
      {
        gio: 'Chiều',
        viec: 'Xe về cửa khẩu Hữu Nghị Quan, ghé mua sắm tại siêu thị Gia Lợi rồi làm thủ tục xuất cảnh.',
      },
      { gio: '21h00', viec: 'Dự kiến về tới Hà Nội. Kết thúc chương trình.' },
    ],
    images: ['ct-lau-sua.jpg'],
  },
]

const BAO_GOM = [
  'Xe ô tô máy lạnh phục vụ theo lịch trình',
  'Vé tàu cao tốc Nam Ninh – Quảng Châu – Nam Ninh khứ hồi',
  'Khách sạn tiêu chuẩn 4 sao địa phương, 2 khách/phòng',
  'Vé tham quan vào cửa một lần tại các điểm ghi trong chương trình',
  'Thư mời vào Hội chợ Canton Fair',
  'Các bữa ăn theo chương trình, tiêu chuẩn 40 tệ/khách/bữa (bàn 10 người, 8 món 1 canh)',
  'Visa đoàn nhập cảnh Trung Quốc',
  'Bảo hiểm du lịch quốc tế, mức đền bù tối đa 10.000 USD/người/vụ',
  'Nước uống trên xe tại Trung Quốc, 1 chai/khách/ngày',
  'Hướng dẫn viên tiếng Việt suốt hành trình',
  'Hoá đơn thuế GTGT',
]

const KHONG_BAO_GOM = [
  'Phí xe điện hai đầu cửa khẩu nếu không muốn đi bộ, khoảng 64.000đ/khách',
  'Phụ thu phòng đơn 2.400.000đ nếu ngủ một mình một phòng',
  'Điện thoại, giặt là và các chi phí cá nhân khác',
  'Phụ phí nhiên liệu tàu cao tốc và các phương tiện vận chuyển khác nếu có',
  'Visa tái nhập với khách quốc tịch nước ngoài, khoảng 50 USD',
  'Tiền tip cho hướng dẫn viên và lái xe, 5 USD/khách/ngày — trẻ em tip như người lớn',
]

const GHI_CHU =
  'Khởi hành 15, 22 và 29 tháng 10 năm 2026, đón trả khách tại Hà Nội và dọc cao tốc Bắc Ninh – Bắc Giang – Lạng Sơn. ' +
  'Giá 8.590.000đ áp dụng cho khách lẻ ghép đoàn từ 20 khách; trẻ 3–11 tuổi tính 90%, trẻ 1–2 tuổi tính 30%. ' +
  'Ba đợt hội chợ có nhóm ngành hàng khác nhau nên chọn ngày khởi hành cũng là chọn xem gì. ' +
  'Chương trình có ghé 2 điểm mua sắm (thuốc và ngọc); đoàn không vào shop phụ thu 300 tệ/khách. ' +
  'Trình tự tham quan và giờ tàu có thể thay đổi theo thực tế nhưng giữ nguyên các điểm.'

// ── Thực thi ────────────────────────────────────────────────────────────────

if (GO_RA) {
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: SLUG_TOUR } },
    depth: 0,
    limit: 1,
  })
  for (const doc of docs) {
    // Gỡ khỏi "Hành trình tiêu biểu" TRƯỚC khi xoá: bỏ qua bước này thì global
    // `home` còn giữ một id trỏ vào hư không và mapHome ném lỗi, vỡ trang chủ.
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
  // Ảnh xoá SAU CÙNG: xoá trước thì tour và địa điểm còn trỏ vào ảnh đã mất,
  // và mapMedia ném lỗi "quan hệ chỉ còn lại id" cho tới khi chúng cũng biến mất.
  for (const a of ANH) {
    const { docs: dm } = await payload.find({
      collection: 'media',
      where: { filename: { equals: a.ten } },
      depth: 0,
      limit: 1,
    })
    for (const doc of dm) {
      await payload.delete({ collection: 'media', id: String(doc.id) })
      console.log(`  đã gỡ ảnh: ${a.ten}`)
    }
  }
  console.log('Xong.')
  process.exit(0)
}

// ── Tải ảnh lên Thư viện ảnh ────────────────────────────────────────────────

const idAnh = new Map<string, string>()
{
  const { docs } = await payload.find({ collection: 'media', depth: 0, limit: 500 })
  for (const doc of docs) idAnh.set(String(doc.filename), String(doc.id))
}

const media = docFileZip(FILE_DOCX)
const thuMucTam = fs.mkdtempSync(path.join(os.tmpdir(), 'rosa-anh-'))

for (const a of ANH) {
  if (idAnh.has(a.ten)) {
    console.log(`  bỏ qua ảnh (đã có): ${a.ten}`)
    continue
  }
  const goc = media.get(a.nguon)
  if (!goc) throw new Error(`Không tìm thấy "${a.nguon}" trong file .docx`)

  let anh = sharp(goc)
  if (a.o) {
    const { width = 0, height = 0 } = await anh.metadata()
    const w = Math.floor(width / 3)
    anh = sharp(goc).extract({ left: (a.o - 1) * w, top: 0, width: w, height })
  }
  const duongDan = path.join(thuMucTam, a.ten)
  await anh.jpeg({ quality: 90 }).toFile(duongDan)

  const doc = await payload.create({
    collection: 'media',
    filePath: duongDan,
    data: { alt: { vi: a.alt } } as never,
  })
  idAnh.set(a.ten, String(doc.id))
  console.log(`  đã tải ảnh: ${a.ten}`)
}

fs.rmSync(thuMucTam, { recursive: true, force: true })

function anh(ten: string): string {
  const id = idAnh.get(ten)
  if (!id) throw new Error(`Chưa có ảnh "${ten}" trong Thư viện ảnh`)
  return id
}

// ── Địa điểm ────────────────────────────────────────────────────────────────

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

const idDiaDiem = new Map<string, string>()
{
  const { docs } = await payload.find({ collection: 'locations', depth: 0, limit: 500 })
  for (const doc of docs) idDiaDiem.set(String(doc.slug), String(doc.id))
}

function diaDiem(...slugs: string[]): string[] {
  return slugs.map((s) => {
    const id = idDiaDiem.get(s)
    if (!id) throw new Error(`Không tìm thấy địa điểm "${s}".`)
    return id
  })
}

// ── Tour ────────────────────────────────────────────────────────────────────

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
        title: vi('Nam Ninh – Quảng Châu – Chu Hải – Thâm Quyến'),
        tagline: vi('Canton Fair lần thứ 140 · 4 ngày 3 đêm, ô tô và tàu cao tốc'),
        summary: vi(
          'Bốn ngày qua bốn thành phố Hoa Nam, dựng quanh một buổi vào Hội chợ Canton Fair lần thứ 140 ở Quảng Châu. Đi cửa khẩu Hữu Nghị Quan rồi nối tàu cao tốc Nam Ninh – Quảng Châu, xen giữa là cầu vượt biển Trung Sơn – Chu Hải, Nhà hát Nhật Nguyệt Bối, chợ điện tử Hoa Cường Bắc ở Thâm Quyến và phố đi bộ Bắc Kinh Lộ.',
        ),
        durationDays: LICH_TRINH.length,
        priceFrom: 8_590_000,
        destinations: ['Nam Ninh', 'Quảng Châu', 'Chu Hải', 'Thâm Quyến'].map(vi),
        heroMedia: anh('ct-chau-giang-dem.jpg'),
        gallery: [
          'ct-nhat-nguyet-boi-dem.jpg',
          'ct-canton-fair-gian-hang.jpg',
          'ct-hoa-cuong-bac.jpg',
          'ct-dimsum.jpg',
          'ct-cong-vien-nhan-tai.jpg',
          'ct-hoa-vang-tham-quyen.jpg',
        ].map(anh),
        itinerary: LICH_TRINH.map((ngay) => ({
          title: vi(ngay.title),
          description: vi(ngay.description),
          ...(ngay.schedule
            ? {
                schedule: ngay.schedule.map((m) => ({
                  ...(m.gio ? { time: m.gio } : {}),
                  text: vi(m.viec),
                })),
              }
            : {}),
          ...(ngay.images ? { images: ngay.images.map(anh) } : {}),
          ...(ngay.locationsLabel ? { locationsLabel: vi(ngay.locationsLabel) } : {}),
          ...(ngay.locations ? { locations: diaDiem(...ngay.locations) } : {}),
        })),
        inclusions: BAO_GOM.map(vi),
        exclusions: KHONG_BAO_GOM.map(vi),
        notes: vi(GHI_CHU),
        seo: {
          title: vi('Tour Canton Fair Quảng Châu 4 ngày 3 đêm — RosaTravel'),
          description: vi(
            'Nam Ninh – Quảng Châu – Chu Hải – Thâm Quyến 4N3D bằng ô tô và tàu cao tốc, có thư mời vào Hội chợ Canton Fair lần thứ 140. Khởi hành 15, 22 và 29.10.2026.',
          ),
          ogImage: anh('ct-chau-giang-dem.jpg'),
        },
      } as never,
    })
    idTour = String(tour.id)
    console.log(`  đã tạo tour: ${SLUG_TOUR}`)
  }
}

// ── Đưa vào "Hành trình tiêu biểu" ──────────────────────────────────────────
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
  }
}

console.log(`\nXem tại /vi/tour/${SLUG_TOUR}`)
console.log('Gỡ ra:  GO=1 npx payload run scripts/seed-tour-canton-fair.ts')
process.exit(0)
