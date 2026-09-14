import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        // next-intl import `next/navigation` không có đuôi .js; để Node tự nạp ESM thì
        // không tìm thấy file, nên cho Vite biên dịch gói này cùng test.
        inline: ['next-intl'],
      },
    },
    // tests/int: chạm DB thật · src/**/*.test: component + tiện ích, không cần DB.
    include: ['tests/int/**/*.int.spec.ts', 'src/**/*.test.{ts,tsx}'],
  },
})
