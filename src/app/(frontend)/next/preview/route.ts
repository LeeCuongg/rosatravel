import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

/**
 * Admin (nút "Xem trước" và khung Live Preview) mở URL này. Chỉ người đã đăng
 * nhập admin mới bật được chế độ xem bản nháp.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path')

  // Chỉ chuyển tới đường dẫn trong site, không để bị lợi dụng chuyển hướng ra ngoài.
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return new Response('Đường dẫn xem trước không hợp lệ.', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const draft = await draftMode()

  if (!user) {
    draft.disable()
    return new Response('Cần đăng nhập trang quản trị để xem bản nháp.', { status: 403 })
  }

  draft.enable()
  redirect(path)
}
