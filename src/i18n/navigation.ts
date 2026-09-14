import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

// Dùng các hàm này thay cho next/link, next/navigation để URL tự mang locale.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
