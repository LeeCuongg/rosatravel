import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/cn'

type RichTextProps = {
  /** Giá trị field richText lấy từ Payload. */
  data: unknown
  className?: string
}

export function RichText({ data, className }: RichTextProps) {
  if (!data || typeof data !== 'object') return null
  return <LexicalRichText data={data as SerializedEditorState} className={cn('rich-text', className)} />
}
