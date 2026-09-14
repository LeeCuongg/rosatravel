import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'

import messages from '@/i18n/messages/vi.json'

/** Render component có dùng next-intl với nhãn tiếng Việt thật của dự án. */
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
      {ui}
    </NextIntlClientProvider>,
  )
}
