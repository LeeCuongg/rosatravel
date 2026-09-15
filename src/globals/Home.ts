import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { homeBlocks } from '../blocks/home'
import { seoField } from '../fields/common'
import { revalidateGlobal } from '../hooks/revalidate'
import { previewPath, previewUrl } from '../lib/preview'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Trang chủ',
  admin: {
    group: 'Cấu hình site',
    description: 'Chọn các section của trang chủ và thứ tự của chúng. Bấm "Xuất bản" để đưa lên site.',
    livePreview: {
      url: ({ locale }) => previewUrl(previewPath({ global: 'home' }, locale?.code)),
    },
  },
  access: { read: anyone, update: contentEditors },
  versions: { max: 30, drafts: { autosave: { interval: 2000 } } },
  hooks: { afterChange: [revalidateGlobal('home')] },
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      label: 'Các section',
      blocks: homeBlocks,
      labels: { singular: 'Section', plural: 'Section' },
      admin: { description: 'Kéo thả để đổi thứ tự hiển thị.', initCollapsed: true },
    },
    seoField,
  ],
}
