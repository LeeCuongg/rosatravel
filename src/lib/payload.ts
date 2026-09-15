import config from '@payload-config'
import { getPayload } from 'payload'

/** Payload Local API: gọi thẳng trong Server Component, không qua HTTP. */
export function getPayloadClient() {
  return getPayload({ config })
}
