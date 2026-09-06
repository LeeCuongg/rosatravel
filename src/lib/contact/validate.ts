import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  // Số Việt Nam: cho phép +84 hoặc 0 đầu, và dấu phân cách người dùng hay gõ.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.\-()]/g, ''))
    .refine((v) => /^(\+84|0)\d{8,10}$/.test(v), 'Số điện thoại không hợp lệ'),
  tourSlug: z.string().max(200).optional().or(z.literal('')),
  note: z.string().max(2000).optional().or(z.literal('')),
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
