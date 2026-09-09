import type { GlobalConfig } from 'payload'

/**
 * Global "Cấu hình email" — nơi người vận hành tự đặt ba giá trị mà form liên
 * hệ cần, không phải nhờ lập trình viên sửa biến môi trường rồi deploy lại.
 *
 * QUAN TRỌNG — VÌ SAO CÓ `access.read`:
 *
 * Payload mở sẵn REST API cho MỌI global tại /api/globals/<slug>, và mặc định
 * là đọc công khai. Không khoá thì bất kỳ ai gõ đúng đường dẫn đó cũng lấy
 * được khoá API Resend — nghĩa là gửi email mạo danh domain của bạn thoải mái
 * cho tới khi khoá bị thu hồi. Đây không phải rủi ro lý thuyết, chỉ cần một
 * lần mở đúng URL.
 *
 * `({ req }) => Boolean(req.user)` chặn đường đó lại: phải đăng nhập admin mới
 * đọc được qua REST/GraphQL. Local API (route /api/contact gọi từ server) KHÔNG
 * bị chặn vì mặc định nó chạy với overrideAccess — đúng thứ ta cần.
 *
 * VẪN NÊN BIẾT: khoá lưu trong database dưới dạng chữ thường, không mã hoá.
 * Ai đọc được database là đọc được khoá. Đó là đánh đổi có ý thức để người vận
 * hành tự đổi được cấu hình; muốn chắc hơn thì đặt qua biến môi trường trên
 * Vercel và để trống ở đây — xem thứ tự ưu tiên trong src/lib/contact/cau-hinh.ts.
 */
export const CaiDatEmail: GlobalConfig = {
  slug: 'cai-dat-email',
  label: 'Cấu hình email',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    description:
      'Ba giá trị để form liên hệ gửi được email. Bỏ trống cả ba thì hệ thống dùng biến môi trường trên máy chủ; điền vào đây thì giá trị ở đây được ưu tiên.',
  },
  fields: [
    {
      name: 'apiKey',
      type: 'text',
      label: 'Khoá API Resend',
      admin: {
        description:
          'Lấy tại resend.com → API Keys → Create API Key. Chuỗi bắt đầu bằng "re_", và Resend CHỈ hiện nó đúng một lần lúc tạo — đóng cửa sổ đi là phải tạo khoá mới. Đây là mật khẩu: ai có nó thì gửi email dưới tên domain của bạn được.',
      },
    },
    {
      name: 'emailTo',
      type: 'email',
      label: 'Email nhận yêu cầu',
      admin: {
        description:
          'Hộp thư sẽ nhận yêu cầu đặt tour của khách. Gmail thường cũng được, không cần gì đặc biệt.',
      },
    },
    {
      name: 'emailFrom',
      type: 'email',
      label: 'Email gửi đi',
      admin: {
        description:
          'PHẢI thuộc domain đã xác thực trong Resend → Domains, nếu không Resend từ chối gửi. Chưa có domain riêng thì điền onboarding@resend.dev — nhưng bản dùng thử đó chỉ gửi được tới đúng email đã đăng ký tài khoản Resend.',
      },
    },
  ],
}
