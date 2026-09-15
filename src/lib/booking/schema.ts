import { z } from 'zod'

export const BOOKING_TYPES = ['booking', 'consultation', 'newsletter'] as const
export type BookingType = (typeof BOOKING_TYPES)[number]

export const BOOKING_FIELDS = [
  'type',
  'fullName',
  'phone',
  'email',
  'tour',
  'departureDate',
  'adults',
  'children',
  'message',
] as const
export type BookingField = (typeof BOOKING_FIELDS)[number]

/** "+84 973.122.807" → "0973122807". Số nước ngoài giữ dạng "+<mã nước><số>". */
export function normalizePhone(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) return digits.startsWith('84') ? `0${digits.slice(2)}` : `+${digits}`
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`
  return digits
}

const PHONE_PATTERN = /^(0\d{9,10}|\+\d{8,15})$/

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayInVietnam(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

// Ô để trống gửi lên chuỗi rỗng: coi như không nhập.
const blankToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(blankToUndefined, schema.optional())
}

export function bookingRequestSchema(now = new Date()) {
  const today = todayInVietnam(now)
  return z.object({
    type: z.enum(BOOKING_TYPES),
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().transform(normalizePhone).pipe(z.string().regex(PHONE_PATTERN)),
    email: optional(z.email().max(120)),
    tour: optional(z.string().regex(/^[a-f\d]{24}$/i)),
    departureDate: optional(z.iso.date().refine((date) => date >= today)),
    adults: optional(z.coerce.number().int().min(1).max(99)),
    children: optional(z.coerce.number().int().min(0).max(99)),
    message: optional(z.string().max(2000)),
  })
}

export type BookingInput = z.infer<ReturnType<typeof bookingRequestSchema>>

export type BookingParseResult =
  | { success: true; data: BookingInput }
  | { success: false; invalidFields: BookingField[] }

/** Đọc và kiểm tra dữ liệu form. Lỗi trả về tên ô sai; câu thông báo lấy từ bản dịch. */
export function parseBookingForm(formData: FormData, now = new Date()): BookingParseResult {
  const raw = Object.fromEntries(
    BOOKING_FIELDS.map((name) => {
      const value = formData.get(name)
      return [name, typeof value === 'string' ? value : undefined]
    }),
  )
  const result = bookingRequestSchema(now).safeParse(raw)
  if (result.success) return { success: true, data: result.data }

  const invalid = new Set<BookingField>()
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && (BOOKING_FIELDS as readonly string[]).includes(field)) {
      invalid.add(field as BookingField)
    }
  }
  return { success: false, invalidFields: [...invalid] }
}
