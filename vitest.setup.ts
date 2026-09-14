// Any setup scripts you might need go here

import { cleanup } from '@testing-library/react'
import { config } from 'dotenv'
import { afterEach } from 'vitest'

// Không bật `globals` trong Vitest nên Testing Library không tự dọn DOM giữa các test.
afterEach(() => {
  cleanup()
})

// Env thật của dự án nằm ở .env.local (giống Next.js); `dotenv/config` mặc định chỉ đọc .env.
config({ path: ['.env.local', '.env'] })
