import { z } from 'zod'

// Regex số điện thoại Việt Nam. Export ra để client (ContactForm) validate
// bằng ĐÚNG pattern này trước khi gửi — hai bên không được phép lệch nhau.
export const PHONE_PATTERN = /^(\+84|0)\d{8,10}$/

// Slug dùng chung hình dạng với content/tours/*.json (xem src/lib/content).
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ tên')
    .max(120, 'Họ tên quá dài')
    // .trim() chỉ cắt khoảng trắng đầu/cuối, không chặn xuống dòng ở giữa —
    // chặn riêng, vì tên rơi thẳng vào subject header của email gửi đi
    // (route.ts), và \r\n trong header là cách chèn thêm header email (Bcc,...).
    .refine((v) => !/[\r\n]/.test(v), 'Họ tên không hợp lệ'),
  // Số Việt Nam: cho phép +84 hoặc 0 đầu, và dấu phân cách người dùng hay gõ.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.\-()]/g, ''))
    .refine((v) => PHONE_PATTERN.test(v), 'Số điện thoại không hợp lệ'),
  tourSlug: z
    .string()
    .max(200, 'Tour không hợp lệ')
    .refine((v) => v === '' || SLUG_PATTERN.test(v), 'Tour không hợp lệ')
    .optional()
    .or(z.literal('')),
  note: z.string().max(2000, 'Ghi chú quá dài').optional().or(z.literal('')),
  // Honeypot: người thật không bao giờ điền trường bị ẩn này.
  website: z.string().max(0, 'bot'),
})

export type ContactInput = z.infer<typeof contactSchema>

export function validateContactInput(
  input: unknown,
): { ok: true; data: ContactInput } | { ok: false; error: string } {
  const result = contactSchema.safeParse(input)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }
  return { ok: true, data: result.data }
}
