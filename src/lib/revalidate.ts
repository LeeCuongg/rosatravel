import { revalidatePath } from 'next/cache'
import { APIError } from 'payload'

/**
 * Dùng chung cho hook `afterChange`/`afterDelete` của Payload (Tours, Media,
 * Home — Task 8, "đăng là thấy ngay"). Đặt ở một chỗ duy nhất vì logic bắt lỗi
 * bên dưới không phải chuyện vặt: bắt sai phạm vi là bug nghiêm trọng, nhân đôi
 * nó ở ba file hook (Tours.ts, Media.ts, Home.ts) sẽ chỉ khiến ai đó sửa một
 * chỗ mà quên chỗ kia.
 *
 * revalidatePath() chỉ chạy được bên trong một request THẬT của Next.js
 * (Route Handler hoặc Server Action) — nó đọc AsyncLocalStorage nội bộ của
 * Next (workAsyncStorage). Khi admin lưu qua UI, request đi qua route handler
 * REST của Payload (src/app/(payload)/api/[...slug]/route.ts) nên store luôn
 * có sẵn — hoạt động bình thường. Khi Payload Local API được gọi từ một
 * script độc lập, ngoài tiến trình Next (vd. một script seed hoặc di trú dữ
 * liệu chạy tay), không có request nào đang chạy, và revalidatePath ném ĐÚNG
 * MỘT lỗi:
 *
 *   Invariant: static generation store missing in revalidatePath <path>
 *
 * (xem node_modules/next/dist/server/web/spec-extension/revalidate.js, hàm
 * revalidate() — throw khi workAsyncStorage.getStore() rỗng). Đây là trường
 * hợp DUY NHẤT được phép nuốt: nó chỉ có nghĩa "không có request nào đang
 * phục vụ trang tĩnh để làm mới", không phải một lỗi thật.
 *
 * Mọi lỗi KHÁC phải nổi lên và làm hỏng thao tác lưu/xoá. Nuốt một lỗi
 * revalidate thật (bug của Next, thay đổi hành vi trong bản nâng cấp sau
 * này...) sẽ khiến admin thấy lưu "thành công" trong khi site vẫn âm thầm
 * phục vụ nội dung cũ — đúng thất bại mà cả cơ chế revalidation này được
 * viết ra để ngăn, tái xuất hiện ngay trong chính bộ xử lý lỗi của nó.
 */
const LOI_NGOAI_REQUEST_NEXT = 'static generation store missing'

export function revalidatePathAnToan(duongDan: string, kieu?: 'layout' | 'page'): void {
  try {
    revalidatePath(duongDan, kieu)
  } catch (error) {
    const laLoiNgoaiRequest = error instanceof Error && error.message.includes(LOI_NGOAI_REQUEST_NEXT)
    if (!laLoiNgoaiRequest) {
      // Lỗi này nổi lên GIỮA transaction của Payload, nên nó không chỉ làm hỏng
      // việc làm mới cache — nó làm hỏng cả thao tác lưu. Hai điều đã kiểm
      // thật, không suy đoán:
      //
      //  - Hook afterChange/afterDelete chạy TRƯỚC commitTransaction (xem
      //    node_modules/payload/dist/globals/operations/update.js — hook ~dòng
      //    328, commitTransaction ~345; collections/operations/create.js và
      //    deleteByID.js cùng thứ tự), và catch bao ngoài gọi killTransaction.
      //  - Cụm Atlas của dự án chạy replica set, nên @payloadcms/db-mongodb bật
      //    transaction thật (connect.js chỉ tắt khi client.options.replicaSet
      //    rỗng). Chạy thử: ném lỗi ở hook rồi đọc lại global thì dữ liệu vẫn y
      //    nguyên bản cũ. Vậy câu "chưa lưu được" bên dưới là đúng sự thật, chứ
      //    không phải cách nói cho an toàn.
      //
      // PHẢI là APIError với isPublic = true, không được là `new Error(...)`.
      // routeError (payload/dist/utilities/routeError.js, dòng ~50) thay TOÀN
      // BỘ nội dung phản hồi bằng "Something went wrong." cho mọi lỗi không
      // "public", và isErrorPublic chỉ coi là public khi err.isPublic === true
      // hoặc err.status khác 500. Đã kiểm bằng cách ném lỗi giả ở hook rồi lưu
      // qua API thật: bản dùng `new Error(...)` trả về đúng chuỗi tiếng Anh
      // "Something went wrong." — nghĩa là một Error trần ở đây có viết hay tới
      // đâu cũng không ai đọc được. Giữ status 500 (đây thật sự là lỗi phía máy
      // chủ) và bật isPublic bằng tham số thứ tư.
      const goc = error instanceof Error ? error.message : String(error)
      const loiChoNguoiBienTap = new APIError(
        'Chưa lưu được — nội dung vừa sửa KHÔNG được ghi lại, bản trong hệ thống vẫn là bản cũ. ' +
          'Nguyên nhân: bước tự động làm mới nội dung trên website bị lỗi, nên thao tác lưu bị huỷ theo ' +
          'để dữ liệu và website không lệch nhau. Hãy bấm Lưu lại một lần nữa; nếu vẫn báo đúng dòng này, ' +
          `gửi nguyên văn nó cho người phụ trách kỹ thuật (đường dẫn "${duongDan}", lỗi gốc: ${goc}).`,
        500,
        undefined,
        true,
      )
      // Giữ lỗi gốc để lập trình viên vẫn lần được stack trace đầy đủ trong log
      // server. APIError dùng chỗ `cause` cho tham số `data`; ta truyền
      // undefined nên constructor để nó về mặc định null — gán đè không mất gì.
      loiChoNguoiBienTap.cause = error
      throw loiChoNguoiBienTap
    }
    console.warn(
      `[revalidate] Bỏ qua làm mới "${duongDan}": đang chạy ngoài request Next.js (bình thường khi Payload Local API được gọi từ một script độc lập).`,
    )
  }
}

/**
 * Đường dẫn PHẢI là mẫu route có ngoặc vuông, không phải '/vi'.
 *
 * revalidatePath(p, 'layout') phát ra đúng một tag: `_N_T_${p}/layout`
 * (revalidate.js, hàm revalidatePath). Còn tập tag của một trang do
 * getImplicitTags dựng từ TÊN ROUTE, không phải từ URL đã giải:
 * getDerivedTags('/[locale]/tour/[slug]/page') trả về
 * ['/layout', '/[locale]/layout', '/[locale]/tour/layout',
 *  '/[locale]/tour/[slug]/layout', '/[locale]/tour/[slug]/page']
 * (node_modules/next/dist/server/lib/implicit-tags.js), cộng thêm đúng một tag
 * theo URL thật là chính pathname '/vi/tour/mau-ha-giang'.
 *
 * Hệ quả, và đây là cái bẫy:
 *   - revalidatePath('/vi')            -> `_N_T_/vi`       -> chỉ khớp trang chủ.
 *   - revalidatePath('/vi', 'layout')  -> `_N_T_/vi/layout` -> KHÔNG khớp gì cả.
 *   - revalidatePath('/[locale]', 'layout') -> `_N_T_/[locale]/layout` -> khớp
 *     MỌI trang nằm dưới src/app/[locale] (trang chủ, mọi trang tour, trang
 *     liên hệ), cho cả hai locale cùng lúc.
 *
 * Phạm vi rộng là lựa chọn có chủ đích, không phải cho tiện. layout.tsx đọc
 * getHomeContent() và truyền `contact` xuống Header/Footer, nên số điện thoại
 * và link Zalo nằm trên MỌI trang; trang /lien-he gọi getTours() để dựng danh
 * sách chọn tour; một ảnh trong Thư viện ảnh có thể xuất hiện ở bất kỳ đâu.
 * Tính xem trang nào dùng dữ liệu nào là việc bất khả thi và sai một lần là
 * người biên tập thấy "đã lưu" trong khi khách vẫn gọi vào số cũ.
 */
const LAYOUT_CO_LOCALE = '/[locale]'

/** Làm mới mọi trang dưới src/app/[locale] — xem giải thích ở LAYOUT_CO_LOCALE. */
export function revalidateMoiTrangCoLocale(): void {
  revalidatePathAnToan(LAYOUT_CO_LOCALE, 'layout')
}
