import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path')
  const safePath = path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/'

  const draft = await draftMode()
  draft.disable()
  redirect(safePath)
}
