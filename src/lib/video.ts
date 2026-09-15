/** Lấy id video từ các dạng link YouTube phổ biến; không phải YouTube thì null. */
export function youtubeId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^(www|m)\./, '')
  let id: string | null = null

  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1).split('/')[0] || null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id =
      parsed.pathname === '/watch'
        ? parsed.searchParams.get('v')
        : (parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null)
  }

  return id && /^[\w-]{11}$/.test(id) ? id : null
}
