import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { tags as cacheTags } from '../lib/cache-tags'
import { revalidateTags } from '../lib/revalidate'

type VersionedDoc = {
  _status?: 'draft' | 'published' | null
}

function isPublished(doc?: VersionedDoc | null): boolean {
  if (!doc || Object.keys(doc).length === 0) return false
  // Collection không bật drafts thì không có `_status`: mọi lần lưu đều là "đăng".
  return doc._status == null || doc._status === 'published'
}

function isAutosave(req: PayloadRequest): boolean {
  const value = (req.query as Record<string, unknown> | undefined)?.autosave
  return value === true || value === 'true'
}

/**
 * Chỉ làm mới site khi khách có thể thấy khác biệt: bản đang/đã từng xuất bản
 * thay đổi. Tự lưu nháp (vài giây một lần) thì bỏ qua.
 */
export function shouldRevalidateChange(args: {
  doc: VersionedDoc
  previousDoc?: VersionedDoc | null
  autosave: boolean
}): boolean {
  if (args.autosave) return false
  return isPublished(args.doc) || isPublished(args.previousDoc)
}

type HookContext = { disableRevalidate?: boolean }

export function revalidateCollection<TDoc = Record<string, unknown>>(tagsFor: (doc: TDoc) => string[]) {
  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req, context }) => {
    if ((context as HookContext).disableRevalidate) return doc
    if (shouldRevalidateChange({ doc, previousDoc, autosave: isAutosave(req) })) {
      // Gồm cả tag của bản trước để đổi slug thì trang cũ cũng được làm mới.
      revalidateTags([...tagsFor(doc as TDoc), ...(previousDoc ? tagsFor(previousDoc as TDoc) : [])])
    }
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
    if (!(context as HookContext).disableRevalidate) {
      revalidateTags(tagsFor(doc as TDoc))
    }
    return doc
  }

  return { afterChange, afterDelete }
}

export function revalidateGlobal(slug: string): GlobalAfterChangeHook {
  return ({ doc, previousDoc, req, context }) => {
    if ((context as HookContext).disableRevalidate) return doc
    if (shouldRevalidateChange({ doc, previousDoc, autosave: isAutosave(req) })) {
      revalidateTags([cacheTags.global(slug)])
    }
    return doc
  }
}
