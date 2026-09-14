// Any setup scripts you might need go here

import { config } from 'dotenv'

// Env thật của dự án nằm ở .env.local (giống Next.js); `dotenv/config` mặc định chỉ đọc .env.
config({ path: ['.env.local', '.env'] })
