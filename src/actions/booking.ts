'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { Resend } from 'resend'

import { routing } from '@/i18n/routing'
import { buildBookingEmail, type BookingNotice } from '@/lib/booking/email'
import { BOOKING_FIELDS, parseBookingForm, type BookingField } from '@/lib/booking/schema'
import { createRateLimiter, isLikelyBot } from '@/lib/booking/spam'
import { getPayloadClient } from '@/lib/payload'

export type BookingFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | {
      status: 'error'
      reason: 'invalid' | 'rateLimited' | 'server'
      invalidFields: BookingField[]
      /** Giá trị khách đã nhập, để điền lại form sau khi báo lỗi. */
      values: Partial<Record<BookingField, string>>
    }

type Payload = Awaited<ReturnType<typeof getPayloadClient>>

const allowRequest = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 })
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000

function readText(formData: FormData, name: string, max: number): string | undefined {
  const value = formData.get(name)
  if (typeof value !== 'string') return undefined
  return value.trim().slice(0, max) || undefined
}

function echoValues(formData: FormData): Partial<Record<BookingField, string>> {
  return Object.fromEntries(
    BOOKING_FIELDS.flatMap((name) => {
      const value = readText(formData, name, 2000)
      return value ? [[name, value]] : []
    }),
  )
}

async function clientIp(): Promise<string> {
  const requestHeaders = await headers()
  return (
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'
  )
}

/**
 * Nhận yêu cầu đặt tour / tư vấn / nhận ưu đãi từ form trên site: kiểm tra dữ liệu,
 * chống spam, lưu vào mục "Yêu cầu đặt tour" trong admin rồi gửi email báo nhân viên.
 */
export async function submitBookingRequest(_previous: BookingFormState, formData: FormData): Promise<BookingFormState> {
  // Báo thành công giả để bot không đổi cách thử.
  if (isLikelyBot(formData)) return { status: 'success' }

  const values = echoValues(formData)
  if (!allowRequest(await clientIp())) {
    return { status: 'error', reason: 'rateLimited', invalidFields: [], values }
  }

  const parsed = parseBookingForm(formData)
  if (!parsed.success) {
    return { status: 'error', reason: 'invalid', invalidFields: parsed.invalidFields, values }
  }
  const input = parsed.data
  const requestedLocale = readText(formData, 'locale', 10)
  const locale = routing.locales.find((code) => code === requestedLocale) ?? routing.defaultLocale
  const page = readText(formData, 'page', 300)

  try {
    const payload = await getPayloadClient()

    // Bấm gửi hai lần hoặc gửi lại trang: không tạo yêu cầu trùng.
    const duplicate = await payload.find({
      collection: 'booking-requests',
      where: {
        and: [
          { phone: { equals: input.phone } },
          { type: { equals: input.type } },
          { createdAt: { greater_than: new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString() } },
        ],
      },
      depth: 0,
      limit: 1,
      pagination: false,
    })
    if (duplicate.docs.length) return { status: 'success' }

    const tour = input.tour ? await findPublishedTour(payload, input.tour) : null

    const doc = await payload.create({
      collection: 'booking-requests',
      data: {
        status: 'new',
        type: input.type,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        tour: tour?.id,
        // Ngày "chỉ ngày" lưu lúc 12:00 UTC như các ngày khác trong admin.
        departureDate: input.departureDate ? `${input.departureDate}T12:00:00.000Z` : undefined,
        adults: input.adults,
        children: input.children,
        message: input.message,
        source: {
          page: page?.startsWith('/') ? page : undefined,
          locale,
          utmSource: readText(formData, 'utm_source', 100),
          utmMedium: readText(formData, 'utm_medium', 100),
          utmCampaign: readText(formData, 'utm_campaign', 100),
        },
      },
    })

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
    const notice: BookingNotice = {
      type: input.type,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      tourTitle: tour?.title,
      tourUrl: tour?.slug ? `${siteUrl}/tour/${tour.slug}` : undefined,
      departureDate: input.departureDate,
      adults: input.adults,
      children: input.children,
      message: input.message,
      page,
      adminUrl: `${siteUrl}/admin/collections/booking-requests/${doc.id}`,
    }
    // Gửi email sau khi đã trả lời khách, để form không phải chờ.
    after(() => notifyStaff(payload, notice))

    return { status: 'success' }
  } catch (error) {
    console.error('Không lưu được yêu cầu đặt tour', error)
    return { status: 'error', reason: 'server', invalidFields: [], values }
  }
}

async function findPublishedTour(payload: Payload, id: string) {
  const { docs } = await payload.find({
    collection: 'tours',
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
    select: { title: true, slug: true },
    depth: 0,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

async function notifyStaff(payload: Payload, notice: BookingNotice): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    payload.logger.warn('Chưa có RESEND_API_KEY: yêu cầu đã lưu trong admin nhưng không gửi email.')
    return
  }

  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const to = (settings.bookingNotifyEmails ?? []).map((row) => row.email).filter(Boolean)
    if (!to.length) {
      payload.logger.warn('Chưa có "Email nhận thông báo" trong Cài đặt chung: không gửi email.')
      return
    }

    const { subject, html, text } = buildBookingEmail(notice)
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM || 'Rosa Travel <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
      replyTo: notice.email,
    })
    if (error) payload.logger.error({ err: error }, 'Resend từ chối email báo yêu cầu mới')
  } catch (error) {
    payload.logger.error({ err: error }, 'Không gửi được email báo yêu cầu mới')
  }
}
