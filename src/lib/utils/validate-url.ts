import {protectedDomains} from './protected-domains.js'

export default function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return !protectedDomains.includes(parsedUrl.hostname)
  } catch {
    return false
  }
}
